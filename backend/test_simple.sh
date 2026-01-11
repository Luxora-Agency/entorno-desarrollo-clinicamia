#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@clinicamia.com","password":"admin123"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Token: ${TOKEN:0:50}..."
echo ""

# Test dashboard endpoint
echo "=== Testing dashboard/resumen-general ==="
curl -s -X GET "http://localhost:4000/calidad2/medicamentos/dashboard/resumen-general" \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo ""
echo "=== Testing inventario ==="
curl -s -X GET "http://localhost:4000/calidad2/medicamentos/inventario" \
  -H "Authorization: Bearer $TOKEN"
