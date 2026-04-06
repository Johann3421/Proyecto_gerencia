# ───────────────────────────────────────────────────────────
# Stage 1 – Instalar todas las dependencias + build
# ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias del SO necesarias para Prisma y node-gyp
RUN apk add --no-cache libc6-compat openssl

# Copiar manifiestos e instalar TODAS las dependencias (incluyendo dev)
COPY package*.json ./
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Generar el cliente de Prisma
RUN npx prisma generate

# Compilar Next.js
RUN npm run build

# ───────────────────────────────────────────────────────────
# Stage 2 – Imagen de producción
# ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Instalar openssl (requerido por Prisma en runtime)
RUN apk add --no-cache openssl

# Crear usuario sin privilegios
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copiar artefactos del builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json

# Copiar y dar permisos al entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
