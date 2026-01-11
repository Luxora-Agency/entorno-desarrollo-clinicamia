#!/bin/bash

# Comprehensive test of all Medicamentos module endpoints
echo "=================================="
echo "MEDICAMENTOS MODULE - FULL TEST"
echo "=================================="

# Get fresh token
echo -e "\n1. Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicamia.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authenticated successfully"

# Test Dashboard Endpoints
echo -e "\n2. Testing Dashboard Endpoints..."
curl -s "http://localhost:4000/calidad2/medicamentos/dashboard/resumen-general" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.success, .data.totalInventario // "N/A"' | head -2

# Test Inventario Endpoints
echo -e "\n3. Testing Inventario Endpoints..."
curl -s "http://localhost:4000/calidad2/medicamentos/inventario/estadisticas" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.success'

# Test Farmacovigilancia
echo -e "\n4. Testing Farmacovigilancia..."
FARMACO_RESPONSE=$(curl -s "http://localhost:4000/calidad2/medicamentos/farmacovigilancia?limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo $FARMACO_RESPONSE | jq -r '.success, (.pagination.total // 0)'

# Test Tecnovigilancia
echo -e "\n5. Testing Tecnovigilancia..."
TECNO_RESPONSE=$(curl -s "http://localhost:4000/calidad2/medicamentos/tecnovigilancia?limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo $TECNO_RESPONSE | jq -r '.success, (.pagination.total // 0)'

# Test Protocolos
echo -e "\n6. Testing Protocolos..."
curl -s "http://localhost:4000/calidad2/medicamentos/protocolos?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.success, (.pagination.total // 0)'

# Test Temperatura
echo -e "\n7. Testing Temperatura..."
curl -s "http://localhost:4000/calidad2/medicamentos/temperatura-humedad?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.success, (.pagination.total // 0)'

# Test Formatos
echo -e "\n8. Testing Formatos..."
curl -s "http://localhost:4000/calidad2/medicamentos/formatos?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.success, (.pagination.total // 0)'

# Test Alertas
echo -e "\n9. Testing Alertas..."
curl -s "http://localhost:4000/calidad2/medicamentos/alertas?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.success, (.data | length // 0)'

echo -e "\n=================================="
echo "✅ ALL ENDPOINTS TESTED"
echo "=================================="
