const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Configurações
const PORT = process.env.PORT || 9999;
const MAX_EVENTS = 1000; // Limite de eventos em memória

// Estado global
const state = {
  agents: new Map(),      // agent_id -> { id, name, status, task, startedAt, lastSeen }
  sessions: new Map(),    // session_id -> { id, agent_id, events[], startedAt, endedAt }
  events: [],             // Todos os eventos (FIFO limitado)
  connections: 0,         // Conexões WebSocket ativas
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ========== WEBSOCKET ==========

wss.on('connection', (ws) => {
  state.connections++;
  console.log(`[WS] Cliente conectado. Total: ${state.connections}`);

  // Envia estado atual para o novo cliente
  ws.send(JSON.stringify({
    type: 'INIT',
    data: {
      agents: Array.from(state.agents.values()),
      sessions: Array.from(state.sessions.values()).map(s => ({
        ...s,
        events: s.events.slice(-50) // Só últimos 50 eventos
      })),
      events: state.events.slice(-100),
      connections: state.connections
    }
  }));

  ws.on('close', () => {
    state.connections--;
    console.log(`[WS] Cliente desconectado. Total: ${state.connections}`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Erro:', err.message);
  });
});

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  });
}

// ========== ROTAS HTTP ==========

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    connections: state.connections,
    agents: state.agents.size,
    sessions: state.sessions.size,
    events: state.events.length
  });
});

// Receber evento de agente
app.post('/events', (req, res) => {
  const event = {
    id: uuidv4(),
    ...req.body,
    timestamp: req.body.timestamp || new Date().toISOString(),
    receivedAt: new Date().toISOString()
  };

  // Validação mínima
  if (!event.agent || !event.status) {
    return res.status(400).json({ error: 'Campos obrigatórios: agent, status' });
  }

  // Adiciona à fila
  state.events.push(event);
  if (state.events.length > MAX_EVENTS) {
    state.events.shift();
  }

  // Atualiza agente
  const agent = state.agents.get(event.agent) || {
    id: event.agent,
    name: event.agent,
    status: 'idle',
    task: null,
    startedAt: event.timestamp,
    lastSeen: event.timestamp
  };
  agent.status = event.status;
  agent.task = event.task || agent.task;
  agent.lastSeen = event.timestamp;
  state.agents.set(event.agent, agent);

  // Atualiza sessão
  const sessionId = event.session || `${event.agent}-${new Date().toISOString().split('T')[0]}`;
  let session = state.sessions.get(sessionId);
  if (!session) {
    session = {
      id: sessionId,
      agent_id: event.agent,
      events: [],
      startedAt: event.timestamp,
      endedAt: null
    };
    state.sessions.set(sessionId, session);
  }
  session.events.push(event);
  if (event.status === 'done' || event.status === 'error') {
    session.endedAt = event.timestamp;
  }

  // Broadcast para todos os clients WebSocket
  broadcast('EVENT', event);

  res.status(201).json({ ok: true, eventId: event.id });
});

// Listar todos os eventos
app.get('/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json(state.events.slice(-limit));
});

// Listar agentes
app.get('/agents', (req, res) => {
  res.json(Array.from(state.agents.values()));
});

// Listar sessões
app.get('/sessions', (req, res) => {
  res.json(Array.from(state.sessions.values()));
});

// Detalhe de uma sessão
app.get('/sessions/:id', (req, res) => {
  const session = state.sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });
  res.json(session);
});

// Estatísticas
app.get('/stats', (req, res) => {
  const statusCount = {};
  state.events.forEach(e => {
    statusCount[e.status] = (statusCount[e.status] || 0) + 1;
  });

  res.json({
    totalEvents: state.events.length,
    totalAgents: state.agents.size,
    totalSessions: state.sessions.size,
    activeConnections: state.connections,
    statusBreakdown: statusCount,
    topAgents: Array.from(state.agents.values())
      .sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen))
      .slice(0, 10)
  });
});

// ========== INICIALIZAÇÃO ==========

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  NT AGENT EVENT BUS                                  ║
║  Núcleo Tático - Monitoramento de Agentes IA         ║
╠══════════════════════════════════════════════════════╣
║  Porta: ${PORT}                                      ║
║  WebSocket: ws://localhost:${PORT}                   ║
║  Health: http://localhost:${PORT}/health             ║
╚══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[BUS] Encerrando...');
  server.close(() => process.exit(0));
});
