#!/usr/bin/env node
/**
 * NT Agent Hook — Captura eventos do OpenClaw e envia para o Event Bus
 * 
 * Uso: node hook-openclaw.js <agent-name> <status> [task]
 * Exemplo: node hook-openclaw.js "Kimi-Claw" "working" "Gerando relatório inteligência"
 */

const http = require('http');

const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'http://localhost:9999/events';

function sendEvent(agent, status, task = null, session = null) {
  const event = {
    agent,
    status,
    task,
    session: session || `${agent}-${new Date().toISOString().split('T')[0]}`,
    source: 'openclaw',
    timestamp: new Date().toISOString()
  };

  const url = new URL(EVENT_BUS_URL);
  const data = JSON.stringify(event);

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
    if (res.statusCode === 201) {
      console.log(`✅ Evento enviado: ${agent} → ${status}`);
    } else {
      console.error(`❌ Erro ${res.statusCode}: ${res.statusMessage}`);
    }
  });

  req.on('error', (err) => {
    console.error(`❌ Falha ao conectar no Event Bus: ${err.message}`);
  });

  req.write(data);
  req.end();
}

// CLI args
const [,, agent, status, task] = process.argv;

if (!agent || !status) {
  console.log(`
NT Agent Hook — OpenClaw Integration

Uso: node hook-openclaw.js <agent-name> <status> [task]

Status permitidos: idle | working | error | done

Exemplos:
  node hook-openclaw.js "Kimi-Claw" "working" "Gerando PDF"
  node hook-openclaw.js "Scraper-Edital" "done"
  node hook-openclaw.js "Tradutor-AHA" "error" "PubMed bloqueado"
  `);
  process.exit(0);
}

sendEvent(agent, status, task);
