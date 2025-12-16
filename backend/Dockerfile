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

# Instalar dependencias de runtime para Prisma y healthcheck
RUN apk add --no-cache openssl curl

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
ENV PORT=3000
ENV HOST=0.0.0.0

USER honojs

EXPOSE 3000

# Healthcheck usando curl (requerido por Coolify)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Usar db push en lugar de migrate deploy para bases de datos existentes
CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
