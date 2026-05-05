#!/bin/bash
# ╔════════════════════════════════════════════════════════════╗
# ║  NT Command Center — Inicialização Completa                ║
# ║  Núcleo Tático - NÃO NEGOCIE COM SUA MENTE!             ║
# ╚════════════════════════════════════════════════════════════╝

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVENT_BUS_DIR="$SCRIPT_DIR/event-bus"
DASHBOARD_DIR="$SCRIPT_DIR/dashboard"
LOG_FILE="$SCRIPT_DIR/logs/dashboard-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "$SCRIPT_DIR/logs"

echo ""
echo "🚀 NT Command Center — Inicializando..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. Verifica Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale primeiro:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
    echo "   apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js $NODE_VERSION detectado. Recomendado: 18+"
fi

echo "✅ Node.js $(node --version)"

# 2. Instala dependências do Event Bus
if [ ! -d "$EVENT_BUS_DIR/node_modules" ]; then
    echo "📦 Instalando dependências do Event Bus..."
    cd "$EVENT_BUS_DIR"
    npm install --silent
fi

# 3. Inicia Event Bus
echo "🔌 Iniciando Event Bus (porta 9999)..."
cd "$EVENT_BUS_DIR"
node server.js >> "$LOG_FILE" 2>&1 &
EVENT_BUS_PID=$!
echo $EVENT_BUS_PID > "$SCRIPT_DIR/.pid-event-bus"

# 4. Aguarda Event Bus subir
echo "⏳ Aguardando Event Bus..."
for i in {1..30}; do
    if curl -s http://localhost:9999/health > /dev/null 2>&1; then
        echo "✅ Event Bus pronto!"
        break
    fi
    sleep 0.5
done

# 5. Inicia dashboard (servidor estático simples)
echo "🎨 Iniciando Dashboard (porta 3000)..."
cd "$DASHBOARD_DIR"
python3 -m http.server 3000 >> "$LOG_FILE" 2>&1 &
DASHBOARD_PID=$!
echo $DASHBOARD_PID > "$SCRIPT_DIR/.pid-dashboard"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ NT Command Center ONLINE"
echo ""
echo "   📊 Dashboard:  http://localhost:3000"
echo "   🔌 Event Bus:   http://localhost:9999"
echo "   💓 Health:       http://localhost:9999/health"
echo ""
echo "   Enviar evento de teste:"
echo "   node hooks/hook-openclaw.js 'Teste' 'working' 'Hello World'"
echo ""
echo "   Logs: $LOG_FILE"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 6. Aguarda sinal de encerramento
trap 'echo ""; echo "🛑 Encerrando..."; kill $EVENT_BUS_PID $DASHBOARD_PID 2>/dev/null; rm -f "$SCRIPT_DIR"/.pid-*; exit 0' INT TERM
wait
