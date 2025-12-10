# Dockerfile para Backend Hono.js + Prisma
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para Prisma
RUN apk add --no-cache openssl

# Copiar archivos de dependencias
COPY package.json yarn.lock* package-lock.json* ./

# Instalar dependencias
RUN \
  if [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# Copiar código fuente y schema de Prisma
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Instalar dependencias de runtime para Prisma
RUN apk add --no-cache openssl

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 honojs

# Copiar node_modules y código desde builder
COPY --from=builder --chown=honojs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=honojs:nodejs /app/package*.json ./
COPY --from=builder --chown=honojs:nodejs /app/prisma ./prisma
COPY --chown=honojs:nodejs . .

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=4000

USER honojs

EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Script de inicio que ejecuta migraciones y luego inicia el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
