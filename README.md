<div align="center">

# NT COMMAND CENTER

### Dashboard local para monitoramento de eventos de agentes de IA

[![Status](https://img.shields.io/badge/status-MVP%20local-F59E0B?style=flat-square)](#status-e-limites)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)](event-bus/)
[![WebSocket](https://img.shields.io/badge/WebSocket-tempo%20real-111827?style=flat-square)](#arquitetura)
[![Licença](https://img.shields.io/badge/licença-MIT-16A34A?style=flat-square)](#licença)

</div>

---

## Visão geral

O **NT Command Center** é um MVP local para receber, visualizar e acompanhar eventos emitidos por agentes de IA. A solução combina um event bus em Node.js, comunicação WebSocket, dashboard web e um hook de linha de comando.

O foco é observabilidade de execução: status, tarefas, sessões, eventos recentes e conexão dos visualizadores.

## Arquitetura

| Componente | Papel |
|---|---|
| `event-bus/server.js` | API HTTP e servidor WebSocket |
| `dashboard/index.html` | painel web responsivo |
| `hooks/hook-openclaw.js` | envio de eventos pela CLI |
| `start-all.sh` | inicialização dos serviços |
| `logs/` | registros locais da execução |

## Funcionalidades

- cartões com eventos, agentes, sessões e viewers;
- estados `idle`, `working`, `error` e `done`;
- log de eventos em tempo real;
- lista de sessões recentes;
- reconexão automática do WebSocket;
- API para consulta e publicação;
- interface escura do ecossistema Núcleo Tático.

## Execução local

Pré-requisitos: Node.js 18+ e Python 3 para servir o dashboard estático.

```bash
git clone https://github.com/matheusflorindo32/nt-command-center.git
cd nt-command-center
chmod +x start-all.sh
./start-all.sh
```

Acesse:

- dashboard: `http://localhost:3000`;
- API/event bus: `http://localhost:9999`.

## Envio de evento

```bash
node hooks/hook-openclaw.js "Agente-Demo" "working" "Gerando relatório"
node hooks/hook-openclaw.js "Agente-Demo" "done"
```

Ou via HTTP:

```bash
curl -X POST http://localhost:9999/events \
  -H "Content-Type: application/json" \
  -d '{"agent":"Agente-Demo","status":"working","task":"Gerando relatório"}'
```

## Endpoints

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/health` | saúde do serviço |
| POST | `/events` | publicar evento |
| GET | `/events` | listar eventos |
| GET | `/agents` | listar agentes |
| GET | `/sessions` | listar sessões |
| GET | `/stats` | consultar indicadores |
| WS | `ws://localhost:9999` | atualização em tempo real |

## Status e limites

O projeto é um **MVP local de observabilidade**, não uma plataforma de comando operacional. A versão atual não deve ser exposta diretamente à internet sem autenticação, controle de acesso, persistência segura, limitação de requisições e revisão de segurança.

## Roadmap

- persistência em SQLite ou JSONL;
- autenticação e autorização;
- integração configurável com agentes;
- acompanhamento de custo e latência;
- isolamento por workspace;
- testes automatizados e empacotamento.

## Licença

MIT — Núcleo Tático, 2026.

---

<div align="center">

Desenvolvido por **Matheus Florindo de Deus**  
[Núcleo Tático](https://www.nucleotatico.com) · [Tropa Científica](https://www.tropacientifica.com) · [Portfólio GitHub](https://github.com/matheusflorindo32)

</div>
