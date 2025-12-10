# 🚀 Guía de Deployment - Clínica Mía

Esta guía cubre el deployment separado de Frontend y Backend usando Docker.

## 📋 Requisitos Previos

- Docker y Docker Compose instalados
- PostgreSQL 15+ (para producción)
- Node.js 18+ (para desarrollo local)

---

## 🐳 Deployment con Docker

### Opción 1: Deploy Completo con Docker Compose

Para levantar toda la aplicación (DB + Backend + Frontend):

```bash
# Desde la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

**URLs después del deployment:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- PostgreSQL: localhost:5432

---

### Opción 2: Deploy Separado por Servicio

#### 📦 Backend (Hono.js + Prisma)

```bash
cd backend

# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales

# 2. Construir imagen
docker build -t clinica-mia-backend:latest .

# 3. Ejecutar contenedor
docker run -d \
  --name clinica-backend \
  -p 4000:4000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/clinica_mia" \
  -e JWT_SECRET="tu_secret_aqui" \
  -e PORT=4000 \
  -e NODE_ENV=production \
  clinica-mia-backend:latest

# Ver logs
docker logs -f clinica-backend

# Detener
docker stop clinica-backend
docker rm clinica-backend
```

**Ejecutar migraciones manualmente:**
```bash
docker exec -it clinica-backend npx prisma migrate deploy
```

**Ejecutar seeders (opcional):**
```bash
docker exec -it clinica-backend node seeders.js
```

---

#### 🎨 Frontend (Next.js)

```bash
cd frontend

# 1. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL de tu backend

# 2. Construir imagen
docker build -t clinica-mia-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=https://tu-backend.com/api .

# 3. Ejecutar contenedor
docker run -d \
  --name clinica-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="https://tu-backend.com/api" \
  -e NEXT_PUBLIC_BASE_URL="https://tu-dominio.com" \
  clinica-mia-frontend:latest

# Ver logs
docker logs -f clinica-frontend

# Detener
docker stop clinica-frontend
docker rm clinica-frontend
```

---

## 🌐 Deployment en Producción

### Recomendaciones por Plataforma

#### 🔵 Backend en Railway / Render / Fly.io

1. **Conectar repositorio Git**
2. **Configurar variables de entorno:**
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   PORT=4000
   NODE_ENV=production
   FRONTEND_URL=https://tu-frontend.com
   ```

3. **Build Command:**
   ```bash
   npm install && npx prisma generate
   ```

4. **Start Command:**
   ```bash
   npx prisma migrate deploy && node server.js
   ```

---

#### 🟢 Frontend en Vercel / Netlify

**Vercel (Recomendado):**

1. Conectar repositorio
2. Root Directory: `frontend`
3. Framework Preset: Next.js
4. Variables de entorno:
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend.com/api
   NEXT_PUBLIC_BASE_URL=https://tu-dominio.vercel.app
   ```

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
.next
```

---

#### 🟣 Base de Datos PostgreSQL

**Opciones recomendadas:**
- **Supabase** (Gratis hasta cierto límite)
- **Neon** (PostgreSQL serverless)
- **Railway** (PostgreSQL managed)
- **AWS RDS** (Producción enterprise)

**Después de crear la DB:**
1. Copiar `DATABASE_URL`
2. Configurarla en el backend
3. Ejecutar migraciones:
   ```bash
   npx prisma migrate deploy
   ```

---

## 🔐 Variables de Entorno Requeridas

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=super_secret_key_minimo_32_caracteres
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://tu-frontend.com
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://tu-backend.com/api
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
```

---

## 🧪 Testing del Deployment

### Health Checks

**Backend:**
```bash
curl http://localhost:4000/health
# Respuesta esperada: {"status":"ok","database":"connected","orm":"prisma"}
```

**Frontend:**
```bash
curl -I http://localhost:3000
# Respuesta esperada: HTTP/1.1 200 OK
```

---

## 📊 Monitoreo

### Logs en Docker

```bash
# Backend
docker logs -f clinica-backend --tail 100

# Frontend
docker logs -f clinica-frontend --tail 100

# PostgreSQL
docker logs -f clinica_mia_db --tail 100
```

### Logs en producción

Usar herramientas nativas de cada plataforma:
- **Vercel:** Dashboard > Deployments > Logs
- **Railway:** Deployment > Logs
- **Render:** Dashboard > Logs

---

## 🔄 Actualización del Deployment

### Docker

```bash
# Reconstruir y redesplegar
docker-compose up -d --build

# O por servicio
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Producción

1. Push a rama `main`
2. Las plataformas auto-despliegan (CI/CD)
3. Verificar health checks

---

## 🐛 Troubleshooting

### Backend no conecta a la DB
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Verificar conexión
docker exec -it clinica_mia_db psql -U clinica_user -d clinica_mia
```

### Frontend no conecta al Backend
```bash
# Verificar CORS en backend
# Verificar NEXT_PUBLIC_API_URL en frontend
# Verificar que backend esté accesible

curl https://tu-backend.com/health
```

### Migraciones fallan
```bash
# Ejecutar manualmente
docker exec -it clinica-backend npx prisma migrate deploy

# Ver estado de migraciones
docker exec -it clinica-backend npx prisma migrate status
```

---

## 📞 Credenciales de Prueba

Después del seeding inicial:

- **Admin:** admin@clinicamia.com / admin123
- **Doctor:** doctor@clinicamia.com / doctor123
- **Recepcionista:** recepcionista@clinicamia.com / recepcion123

---

## 🎯 Checklist de Deployment

- [ ] PostgreSQL configurado y accesible
- [ ] Variables de entorno configuradas
- [ ] Backend desplegado y health check pasa
- [ ] Migraciones ejecutadas
- [ ] Seeders ejecutados (opcional)
- [ ] Frontend desplegado
- [ ] Frontend conecta al backend
- [ ] Login funciona correctamente
- [ ] CORS configurado correctamente
- [ ] HTTPS habilitado (producción)
- [ ] Monitoreo configurado

---

## 📚 Recursos Adicionales

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production](https://www.prisma.io/docs/guides/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
