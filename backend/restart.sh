#!/bin/bash

echo "🔄 Reiniciando servidor backend..."

# Detectar método de ejecución
if command -v pm2 &> /dev/null; then
    echo "📦 Detectado PM2"
    pm2 restart backend || pm2 restart all
    echo "✅ Servidor reiniciado con PM2"
    pm2 logs backend --lines 20
elif pgrep -f "node.*server.js" > /dev/null; then
    echo "🔄 Detectado proceso Node"
    pkill -f "node.*server.js"
    sleep 2
    npm run dev &
    echo "✅ Servidor reiniciado"
else
    echo "▶️  Iniciando servidor..."
    npm run dev &
    echo "✅ Servidor iniciado"
fi

echo ""
echo "🧪 Esperando 3 segundos para verificar..."
sleep 3

echo ""
echo "🔍 Verificando endpoints..."
curl -s http://localhost:4000/health | grep -q "ok" && echo "✅ Health check OK" || echo "❌ Health check FAILED"

echo ""
echo "📋 Para verificar manualmente:"
echo "   curl http://localhost:4000/ai-assistant/status -H 'Authorization: Bearer TOKEN'"
