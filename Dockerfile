# =============================================================================
# Dockerfile - Worker de Notificações para EasyPanel
# Vinha Admin Center
# =============================================================================
# Este container roda APENAS o worker de notificações (BullMQ)
# O app principal roda na Vercel
# =============================================================================

FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache libc6-compat

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências (incluindo devDependencies para tsx)
RUN npm ci --legacy-peer-deps

# Copiar código fonte necessário para o worker
COPY src ./src
COPY drizzle ./drizzle
COPY drizzle.config.ts ./
COPY tsconfig.json ./

# Variáveis de ambiente
ENV NODE_ENV=production

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker
RUN chown -R worker:nodejs /app

USER worker

# Health check simples (verifica se processo está rodando)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD pgrep -f "notification-worker" || exit 1

# Executar worker com tsx
CMD ["npx", "tsx", "src/workers/notification-worker.ts"]
