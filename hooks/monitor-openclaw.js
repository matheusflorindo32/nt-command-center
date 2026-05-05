#!/usr/bin/env node
/**
 * NT OpenClaw Log Monitor — Captura eventos automaticamente do workspace
 * 
 * Monitora:
 * - Sessões ativas do OpenClaw
 * - Execução de ferramentas (tool calls)
 * - Arquivos criados/modificados
 * - Erros no log
 * 
 * Uso: node monitor-openclaw.js
 * Requer: EVENT_BUS_URL=http://localhost:9999/events
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const WORKSPACE_DIR = process.env.OPENCLAW_WORKSPACE || '/root/.openclaw/workspace';
const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'http://localhost:9999/events';
const MEMORY_DIR = path.join(WORKSPACE_DIR, 'memory');
const POLL_INTERVAL = 5000; // 5 segundos

let lastSessionFile = null;
let lastSessionSize = 0;

function sendEvent(agent, status, task = null) {
  const event = {
    agent,
    status,
    task,
    session: `openclaw-${new Date().toISOString().split('T')[0]}`,
    source: 'openclaw-monitor',
    timestamp: new Date().toISOString()
  };

  const data = JSON.stringify(event);
  const url = new URL(EVENT_BUS_URL);

  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    if (res.statusCode !== 201) {
      console.error(`[MONITOR] Erro ${res.statusCode} ao enviar evento`);
    }
  });

  req.on('error', (err) => {
    // Silencioso — Event Bus pode estar offline
  });

  req.write(data);
  req.end();
}

function detectActivity() {
  try {
    // Verifica se há sessões do OpenClaw rodando
    const sessionsDir = path.join(WORKSPACE_DIR, '.openclaw', 'sessions');
    
    // Verifica arquivos de memória sendo escritos
    if (fs.existsSync(MEMORY_DIR)) {
      const files = fs.readdirSync(MEMORY_DIR);
      const todayFile = files.find(f => f.startsWith(new Date().toISOString().split('T')[0]));
      
      if (todayFile) {
        const filePath = path.join(MEMORY_DIR, todayFile);
        const stats = fs.statSync(filePath);
        
        if (lastSessionFile !== filePath || stats.size > lastSessionSize) {
          // Atividade detectada!
          lastSessionFile = filePath;
          lastSessionSize = stats.size;
          
          sendEvent('Kimi-Claw', 'working', `Atividade no workspace (${(stats.size/1024).toFixed(1)}KB)`);
        }
      }
    }

    // Verifica processos do node (OpenClaw gateway)
    // Nota: Em Linux, podemos checar /proc
    const procDir = '/proc';
    if (fs.existsSync(procDir)) {
      const pids = fs.readdirSync(procDir).filter(f => /^\d+$/.test(f));
      let openclawRunning = false;
      
      for (const pid of pids.slice(0, 50)) { // Limita para não travar
        try {
          const cmdline = fs.readFileSync(path.join(procDir, pid, 'cmdline'), 'utf8');
          if (cmdline.includes('openclaw') || cmdline.includes('node')) {
            openclawRunning = true;
            break;
          }
        } catch (e) { /* ignorar */ }
      }
      
      if (!openclawRunning) {
        sendEvent('OpenClaw-Gateway', 'idle', 'Gateway parado');
      }
    }

  } catch (err) {
    console.error('[MONITOR] Erro na detecção:', err.message);
  }
}

// ========== MAIN ==========

console.log(`
╔══════════════════════════════════════════════════════╗
║  NT OpenClaw Monitor                                 ║
║  Auto-captura de atividade do workspace              ║
╠══════════════════════════════════════════════════════╣
║  Workspace: ${WORKSPACE_DIR}
║  Event Bus: ${EVENT_BUS_URL}
║  Intervalo: ${POLL_INTERVAL/1000}s
╚══════════════════════════════════════════════════════╝
`);

// Envia evento de inicialização
sendEvent('OpenClaw-Monitor', 'working', 'Monitor iniciado');

// Loop de monitoramento
setInterval(detectActivity, POLL_INTERVAL);

// Mantém processo vivo
console.log('[MONITOR] Rodando... Pressione Ctrl+C para parar.\n');
