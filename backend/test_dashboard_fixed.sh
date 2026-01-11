#!/bin/bash

# Test dashboard endpoints with correct paths

echo "=== Logging in ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicamia.com","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // .data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Failed to get token, trying legacy path..."
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@clinicamia.com","password":"admin123"}')
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // .data.token // empty')
fi

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Failed to get token from both paths"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:30}..."

echo ""
echo "=== Testing dashboard/resumen-general ==="
DASHBOARD_RESPONSE=$(curl -s -X GET "http://localhost:4000/calidad2/medicamentos/dashboard/resumen-general" \
  -H "Authorization: Bearer $TOKEN")
echo "$DASHBOARD_RESPONSE" | jq '.'

echo ""
echo "=== Testing inventario endpoint ==="
INVENTARIO_RESPONSE=$(curl -s -X GET "http://localhost:4000/calidad2/medicamentos/inventario" \
  -H "Authorization: Bearer $TOKEN")
echo "$INVENTARIO_RESPONSE" | jq '.'

echo ""
echo "=== Done ==="
