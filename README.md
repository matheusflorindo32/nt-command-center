# 🤖 NT Command Center

**Dashboard de Monitoramento de Agentes IA — Núcleo Tático**

> *"NÃO NEGOCIE COM SUA MENTE!"*

---

## 📋 O que é

Sistema unificado para monitorar, visualizar e gerenciar agentes de IA em tempo real. Inspirado em `agent-flow`, `Claude-Code-Agent-Monitor` e `opcode`, mas construído do zero com stack limpa (MIT) e 100% comercializável.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│           NT Command Center                 │
│                                             │
│  ┌─────────────┐      ┌─────────────────┐  │
│  │  Dashboard  │◄────►│   Event Bus     │  │
│  │  (Web)      │  WS   │   (Node.js)     │  │
│  └─────────────┘      └────────┬────────┘  │
│       http://:3000               │           │
│                                  │ HTTP      │
│                         ┌────────┴────────┐  │
│                         │  OpenClaw Hooks  │  │
│                         │  (Log Parser)    │  │
│                         └──────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 🚀 Setup Rápido (1 minuto)

### Pré-requisitos
- Node.js 18+ (`node --version`)
- Python 3 (pra servidor estático do dashboard)

### 1. Clone
```bash
cd ai-agent-dashboard
```

### 2. Inicie tudo
```bash
./start-all.sh
```

### 3. Acesse
- **Dashboard:** http://localhost:3000
- **API:** http://localhost:9999

---

## 📡 Enviar Eventos

### Via hook CLI
```bash
node hooks/hook-openclaw.js "Kimi-Claw" "working" "Gerando relatório"
node hooks/hook-openclaw.js "Kimi-Claw" "done"
```

### Via API direta
```bash
curl -X POST http://localhost:9999/events \
  -H "Content-Type: application/json" \
  -d '{
    "agent": "Scraper-Edital",
    "status": "working",
    "task": "Buscando concursos PMERJ"
  }'
```

---

## 🔌 Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status do servidor |
| POST | `/events` | Receber evento de agente |
| GET | `/events` | Listar eventos |
| GET | `/agents` | Listar agentes |
| GET | `/sessions` | Listar sessões |
| GET | `/stats` | Estatísticas em tempo real |
| WS | `ws://localhost:9999` | WebSocket tempo real |

---

## 🎨 Dashboard Features

- ✅ **Stats Cards** — Eventos, agentes, sessões, viewers
- ✅ **Agent Cards** — Status colorido (idle/working/error/done)
- ✅ **Pulse Animation** — Agentes "working" pulsam azul
- ✅ **Session List** — Últimas 10 sessões
- ✅ **Event Log** — Últimos 100 eventos em tempo real
- ✅ **Auto-reconnect** — WebSocket reconecta sozinho
- ✅ **Dark Theme** — Cyberpunk / military style

---

## 🛠️ Estrutura

```
ai-agent-dashboard/
├── event-bus/
│   ├── server.js          # Servidor WebSocket + Express
│   └── package.json       # Dependências
├── dashboard/
│   └── index.html         # Frontend SPA
├── hooks/
│   └── hook-openclaw.js   # CLI para enviar eventos
├── logs/                  # Logs de execução
├── start-all.sh           # Inicialização 1-clique
└── README.md              # Este arquivo
```

---

## 📝 Roadmap

- [ ] Persistência em SQLite/JSONL
- [ ] Integração automática com OpenClaw (parse de logs)
- [ ] Gamificação (XP, níveis, conquistas por agente)
- [ ] Multi-company (NT, TC, Apex, PS isolados)
- [ ] Org chart visual (hierarquia de agentes)
- [ ] Controle de custos (monitorar gasto de API)

---

**Licença:** MIT — Núcleo Tático 2026
