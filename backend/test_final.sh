#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicamia.com","password":"admin123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['accessToken'])")

echo "Token: ${TOKEN:0:50}..."
echo ""

# Test dashboard endpoint
echo "Testing /calidad2/medicamentos/dashboard/resumen-general"
curl -s -X GET "http://localhost:4000/calidad2/medicamentos/dashboard/resumen-general" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool

echo ""
echo "Testing /calidad2/medicamentos/inventario"
curl -s -X GET "http://localhost:4000/calidad2/medicamentos/inventario" \
  -H "Authorization: Bearer $TOKEN" \
  | python3 -m json.tool
