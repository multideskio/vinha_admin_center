# Design: Correção de Problemas Críticos de Qualidade de Código

## Visão Geral

Este documento detalha as soluções técnicas para os problemas identificados no documento de requisitos. As soluções são projetadas para serem minimamente invasivas, mantendo compatibilidade com o código existente.

## 1. Soluções para Problemas de Segurança

### 1.1 Substituição de Tipos `any`

**Solução**: Criar tipos explícitos para objetos de sessão e SMTP.

```typescript
// src/lib/types.ts - Adicionar
export interface SessionUser {
  id: string
  email: string
  role: UserRole
  companyId: string
  avatarUrl: string | null
}

export interface SmtpTransporter {
  sendMail(options: {
    from: string
    to: string
    subject: string
    html: string
    text?: string
  }): Promise<void>
}
```

**Implementação**:

- Substituir `let sessionUser: any = null` por `let sessionUser: SessionUser | null = null`
- Substituir `private smtpTransporter?: any` por `private smtpTransporter?: SmtpTransporter`
- Atualizar imports em todos os arquivos afetados

### 1.2 Padronização de Queries com `.limit()`

**Solução**: Criar função utilitária para queries de registro único.

```typescript
// src/lib/db-utils.ts - Novo arquivo
import { db } from '@/db/drizzle'
import type { PgTable } from 'drizzle-orm/pg-core'

export async function findOne<T extends PgTable>(
  query: ReturnType<typeof db.select>,
): Promise<T | null> {
  const [result] = await query.limit(1)
  return result || null
}
```

**Implementação**:

- Refatorar queries existentes para usar `findOne()`
- Adicionar `.limit(1)` em queries que não podem usar a função
- Adicionar lint rule para detectar queries sem `.limit()`

### 1.3 Validação de Variáveis de Ambiente

**Solução**: Criar módulo centralizado de validação.

```typescript
// src/lib/env.ts - Novo arquivo
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  COMPANY_INIT: z.string().uuid(),
  JWT_SECRET: z.string().min(32),
  DEFAULT_PASSWORD: z.string().min(6),
  // Opcionais
  REDIS_URL: z.string().optional(),
  AWS_SES_REGION: z.string().optional(),
})

export const env = envSchema.parse(process.env)
```

**Implementação**:

- Criar arquivo `src/lib/env.ts` com validação Zod
- Substituir `process.env.X` por `env.X` em todo código
- Adicionar validação no startup da aplicação

## 2. Soluções para Idempotência

### 2.1 Verificação de Duplicação em Pagamentos

**Solução**: Implementar verificação antes de criar pagamento.

```typescript
// src/lib/payment-guard.ts - Novo arquivo
export async function checkDuplicatePayment(
  userId: string,
  amount: number,
  windowMinutes: number = 5,
): Promise<{ isDuplicate: boolean; existingTransaction?: Transaction }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)

  const [existing] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.contributorId, userId),
        eq(transactions.amount, amount.toString()),
        gte(transactions.createdAt, windowStart),
        inArray(transactions.status, ['pending', 'approved']),
      ),
    )
    .limit(1)

  return {
    isDuplicate: !!existing,
    existingTransaction: existing,
  }
}
```

**Implementação**:

- Adicionar verificação em `POST /api/v1/transacoes`
- Retornar erro 409 (Conflict) se duplicação detectada
- Incluir ID da transação existente na resposta

### 2.2 Tratamento de Race Condition em Webhooks

**Solução**: Implementar reconciliação de estado.

```typescript
// src/lib/webhook-reconciliation.ts - Novo arquivo
export async function reconcileTransactionState(
  transactionId: string,
  webhookStatus: string,
): Promise<void> {
  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1)

  if (!transaction) {
    // Webhook chegou antes - criar transação pendente
    console.warn('[WEBHOOK_EARLY] Webhook arrived before transaction creation')
    return
  }

  // Reconciliar estados divergentes
  if (transaction.status !== webhookStatus) {
    await db
      .update(transactions)
      .set({ status: webhookStatus })
      .where(eq(transactions.id, transactionId))
  }
}
```

**Implementação**:

- Adicionar lógica de reconciliação no webhook handler
- Implementar retry com backoff exponencial
- Adicionar logs estruturados para debug

### 2.3 Idempotência em Notificações

**Solução**: Verificar histórico antes de enviar.

```typescript
// src/lib/notification-dedup.ts - Novo arquivo
export async function shouldSendNotification(
  userId: string,
  notificationType: string,
  deduplicationWindowHours: number = 24,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - deduplicationWindowHours * 60 * 60 * 1000)

  const [recent] = await db
    .select()
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.userId, userId),
        eq(notificationLogs.notificationType, notificationType),
        eq(notificationLogs.status, 'sent'),
        gte(notificationLogs.sentAt, windowStart),
      ),
    )
    .limit(1)

  return !recent
}
```

**Implementação**:

- Adicionar verificação antes de enviar notificação
- Configurar janela de deduplicação por tipo de notificação
- Logar tentativas de duplicação

## 3. Soluções para Performance

### 3.1 Eliminação de N+1 Queries

**Solução**: Usar JOIN ou buscar perfis em batch.

```typescript
// Antes (N+1):
const transactions = await db.select().from(transactions)
for (const t of transactions) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, t.userId))
}

// Depois (1 query):
const transactions = await db
  .select({
    transaction: transactions,
    profile: profiles,
  })
  .from(transactions)
  .leftJoin(profiles, eq(transactions.contributorId, profiles.userId))
```

**Implementação**:

- Refatorar GET `/api/v1/transacoes` para usar JOIN
- Criar view materializada se necessário
- Adicionar índices em foreign keys

### 3.2 Cache de Configurações

**Solução**: Implementar cache em memória com TTL.

```typescript
// src/lib/config-cache.ts - Novo arquivo
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class ConfigCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private ttlMs = 5 * 60 * 1000 // 5 minutos

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    })
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }
}

export const configCache = new ConfigCache()
```

**Implementação**:

- Adicionar cache em `getCieloConfig()`
- Adicionar cache em `NotificationService.createFromDatabase()`
- Invalidar cache quando configurações forem atualizadas

## 4. Soluções para Segurança

### 4.1 Rate Limiting Completo

**Solução**: Migrar para Redis e aplicar em todas as rotas.

```typescript
// src/lib/rate-limit-redis.ts - Novo arquivo
import IORedis from 'ioredis'

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')

export async function rateLimitRedis(
  key: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now()
  const windowKey = `ratelimit:${key}:${Math.floor(now / (windowSeconds * 1000))}`

  const count = await redis.incr(windowKey)

  if (count === 1) {
    await redis.expire(windowKey, windowSeconds)
  }

  return {
    allowed: count <= maxAttempts,
    remaining: Math.max(0, maxAttempts - count),
  }
}
```

**Implementação**:

- Criar middleware de rate limiting
- Aplicar em todas as rotas públicas
- Configurar limites por tipo de rota

### 4.2 Validação de Uploads

**Solução**: Adicionar validação antes do upload.

```typescript
// src/lib/upload-validator.ts - Novo arquivo
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateUpload(
  file: Buffer,
  filename: string,
  mimeType: string,
): { valid: boolean; error?: string } {
  // Validar tamanho
  if (file.length > MAX_FILE_SIZE) {
    return { valid: false, error: 'Arquivo muito grande (máx 10MB)' }
  }

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: 'Tipo de arquivo não permitido' }
  }

  // Validar extensão
  const ext = filename.split('.').pop()?.toLowerCase()
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
  if (!ext || !allowedExts.includes(ext)) {
    return { valid: false, error: 'Extensão de arquivo não permitida' }
  }

  return { valid: true }
}
```

**Implementação**:

- Adicionar validação em `S3Service.uploadFile()`
- Retornar erro 400 se validação falhar
- Adicionar sanitização de nome de arquivo

### 4.3 Sanitização de Logs

**Solução**: Criar função de sanitização centralizada.

```typescript
// src/lib/log-sanitizer.ts - Novo arquivo
const SENSITIVE_PATTERNS = {
  cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
  creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
  cvv: /\b\d{3,4}\b/g,
  password: /"password"\s*:\s*"[^"]+"/g,
  token: /"token"\s*:\s*"[^"]+"/g,
}

export function sanitizeLog(data: unknown): unknown {
  if (typeof data === 'string') {
    let sanitized = data
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.cpf, '***.***.***-**')
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.creditCard, '****-****-****-****')
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.cvv, '***')
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.password, '"password":"[REDACTED]"')
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.token, '"token":"[REDACTED]"')
    return sanitized
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      if (['password', 'token', 'securityCode', 'cvv'].includes(key)) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeLog(value)
      }
    }
    return sanitized
  }

  return data
}

// Wrapper para console.log
export function safeLog(message: string, data?: unknown): void {
  console.log(message, data ? sanitizeLog(data) : '')
}
```

**Implementação**:

- Substituir `console.log()` por `safeLog()` em código crítico
- Adicionar sanitização em logs de erro
- Nunca logar payloads completos de cartão de crédito

## 5. Soluções para Logging

### 5.1 Logging Estruturado

**Solução**: Criar logger centralizado com contexto.

```typescript
// src/lib/logger.ts - Novo arquivo
interface LogContext {
  userId?: string
  transactionId?: string
  operation: string
  timestamp: string
}

export class Logger {
  private context: Partial<LogContext> = {}

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context }
  }

  error(message: string, error?: unknown): void {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: error instanceof Error ? error.message : String(error),
        ...this.context,
        timestamp: new Date().toISOString(),
      }),
    )
  }

  warn(message: string, data?: unknown): void {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        data: sanitizeLog(data),
        ...this.context,
        timestamp: new Date().toISOString(),
      }),
    )
  }

  info(message: string, data?: unknown): void {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        data: sanitizeLog(data),
        ...this.context,
        timestamp: new Date().toISOString(),
      }),
    )
  }
}

export const logger = new Logger()
```

**Implementação**:

- Substituir `console.error()` por `logger.error()`
- Adicionar contexto em início de cada rota
- Usar formato JSON para facilitar parsing

## 6. Arquitetura de Implementação

### Ordem de Implementação

1. **Fase 1 - Fundação** (Semana 1)
   - Criar arquivos utilitários: `env.ts`, `types.ts`, `logger.ts`
   - Validar variáveis de ambiente
   - Substituir tipos `any`

2. **Fase 2 - Segurança** (Semana 2)
   - Implementar `payment-guard.ts`
   - Adicionar `log-sanitizer.ts`
   - Implementar `upload-validator.ts`

3. **Fase 3 - Performance** (Semana 3)
   - Refatorar queries N+1
   - Implementar `config-cache.ts`
   - Adicionar `.limit()` em queries

4. **Fase 4 - Resiliência** (Semana 4)
   - Implementar `webhook-reconciliation.ts`
   - Adicionar `notification-dedup.ts`
   - Migrar rate limiting para Redis

### Testes Necessários

1. **Testes Unitários**
   - Validação de variáveis de ambiente
   - Sanitização de logs
   - Validação de uploads
   - Cache de configurações

2. **Testes de Integração**
   - Verificação de duplicação de pagamentos
   - Reconciliação de webhooks
   - Deduplicação de notificações

3. **Testes de Performance**
   - Benchmark de queries antes/depois
   - Teste de carga em rate limiting
   - Medição de hit rate do cache

### Métricas de Sucesso

- Zero tipos `any` no código
- 100% das variáveis críticas validadas
- Redução de 90% em N+1 queries
- Hit rate de cache > 80%
- Zero duplicações de pagamento em testes
- Tempo de resposta médio < 200ms

## 7. Compatibilidade e Rollback

### Estratégia de Rollback

1. Manter código antigo comentado por 1 sprint
2. Feature flags para novas funcionalidades
3. Monitoramento de erros em produção
4. Rollback automático se taxa de erro > 1%

### Compatibilidade

- Todas as mudanças são backward-compatible
- APIs públicas mantêm mesma interface
- Banco de dados não requer migrations
- Configurações existentes continuam funcionando
