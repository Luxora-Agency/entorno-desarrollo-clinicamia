#!/bin/bash

# Test dashboard endpoints

echo "=== Logging in ==="
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicamia.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Failed to get token"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:30}..."

echo ""
echo "=== Testing dashboard/resumen-general ==="
curl -s -X GET "http://localhost:4000/calidad2/medicamentos/dashboard/resumen-general" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

echo ""
echo "=== Testing inventario endpoint ==="
curl -s -X GET "http://localhost:4000/calidad2/medicamentos/inventario" \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.'

echo ""
echo "=== Done ==="
