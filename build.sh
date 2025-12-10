#!/bin/bash
# Script para construir imágenes Docker de Frontend y Backend

echo "🚀 Construyendo imágenes Docker para Clínica Mía..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backend
echo -e "${BLUE}📦 Construyendo Backend...${NC}"
cd backend
docker build -t clinica-mia-backend:latest . || {
    echo -e "${RED}❌ Error construyendo backend${NC}"
    exit 1
}
echo -e "${GREEN}✅ Backend construido exitosamente${NC}"
echo ""

# Frontend
cd ../frontend
echo -e "${BLUE}🎨 Construyendo Frontend...${NC}"
docker build -t clinica-mia-frontend:latest \
    --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api . || {
    echo -e "${RED}❌ Error construyendo frontend${NC}"
    exit 1
}
echo -e "${GREEN}✅ Frontend construido exitosamente${NC}"
echo ""

cd ..

echo -e "${GREEN}🎉 Todas las imágenes construidas exitosamente!${NC}"
echo ""
echo "Para ejecutar:"
echo "  docker-compose up -d"
echo ""
echo "O individualmente:"
echo "  docker run -d -p 4000:4000 clinica-mia-backend:latest"
echo "  docker run -d -p 3000:3000 clinica-mia-frontend:latest"
