# ⚠️ IMPORTANTE: Reiniciar Servidor Backend

## El servidor backend DEBE reiniciarse para que los nuevos endpoints funcionen

### Opción 1: Desarrollo (nodemon/npm run dev)
```bash
cd backend

# Detener servidor actual (Ctrl+C si está corriendo)
# Luego reiniciar:
npm run dev
```

### Opción 2: Producción (PM2)
```bash
cd backend
pm2 restart backend

# O reiniciar todos los procesos:
pm2 restart all

# Verificar logs:
pm2 logs backend
```

### Opción 3: Docker
```bash
docker-compose restart backend
```

## Verificar que el servidor esté funcionando

```bash
# Test 1: Health check
curl http://localhost:4000/health

# Test 2: AI Assistant status
curl http://localhost:4000/ai-assistant/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test 3: Corrector ortografía
curl -X POST http://localhost:4000/ai-assistant/corregir-ortografia \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"texto":"prueba de texto","contexto":"medico"}'
```

## Endpoints Nuevos Agregados

1. ✅ `POST /ai-assistant/corregir-ortografia`
2. ✅ `POST /ai-assistant/extract-document`

## Si el error 404 persiste

1. Verificar que el archivo existe:
   ```bash
   ls -la backend/routes/ai-assistant.js
   ```

2. Verificar que está en server.js:
   ```bash
   grep "ai-assistant" backend/server.js
   ```

3. Limpiar caché de Node:
   ```bash
   rm -rf backend/node_modules/.cache
   npm run dev
   ```

4. Verificar logs del servidor:
   ```bash
   tail -f backend/logs/*.log
   # o
   pm2 logs backend
   ```
