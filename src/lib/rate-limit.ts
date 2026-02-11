/**
 * @fileoverview Rate limiting via Redis com fallback em memória
 * @description Usa Redis quando disponível, fallback para Map em memória quando Redis falha
 */

import { redis } from '@/lib/redis'

// ─── Fallback em Memória ────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetAt: number
}

/**
 * Store em memória para rate limiting quando Redis não está disponível.
 * Limitado a 10.000 entradas para evitar memory leak.
 */
const inMemoryStore = new Map<string, RateLimitEntry>()

/**
 * Tamanho máximo do store em memória (10k entradas)
 */
const MAX_MEMORY_ENTRIES = 10_000

/**
 * Intervalo de limpeza do store em memória (5 minutos)
 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

/**
 * Limpa entradas expiradas do store em memória
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  let cleaned = 0

  for (const [key, entry] of inMemoryStore.entries()) {
    if (now > entry.resetAt) {
      inMemoryStore.delete(key)
      cleaned++
    }
  }

  if (cleaned > 0) {
    console.log(`[RATE_LIMIT_CLEANUP] Removed ${cleaned} expired entries from memory store`)
  }
}

/**
 * Agenda limpeza periódica do store em memória
 */
let cleanupTimer: NodeJS.Timeout | null = null
function scheduleCleanup(): void {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS)
    // Não bloquear o processo de encerrar
    if (cleanupTimer.unref) {
      cleanupTimer.unref()
    }
  }
}

/**
 * Rate limiting em memória (fallback quando Redis não está disponível)
 */
function inMemoryRateLimit(
  routeKey: string,
  ip: string,
  limit: number,
  windowSec: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const key = `${routeKey}:${ip}`
  const entry = inMemoryStore.get(key)

  // Se não existe entrada ou já expirou, criar nova
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowSec * 1000

    // Limitar tamanho do store para evitar memory leak
    if (inMemoryStore.size >= MAX_MEMORY_ENTRIES) {
      console.warn(
        `[RATE_LIMIT_MEMORY] Store atingiu limite de ${MAX_MEMORY_ENTRIES} entradas, limpando...`,
      )
      cleanupExpiredEntries()

      // Se ainda estiver cheio após limpeza, remover entradas mais antigas
      if (inMemoryStore.size >= MAX_MEMORY_ENTRIES) {
        const entriesToRemove = Math.floor(MAX_MEMORY_ENTRIES * 0.1) // Remover 10%
        let removed = 0
        for (const [k] of inMemoryStore.entries()) {
          if (removed >= entriesToRemove) break
          inMemoryStore.delete(k)
          removed++
        }
        console.warn(`[RATE_LIMIT_MEMORY] Removidas ${removed} entradas mais antigas`)
      }
    }

    inMemoryStore.set(key, { count: 1, resetAt })
    scheduleCleanup()

    return {
      allowed: true,
      remaining: limit - 1,
    }
  }

  // Incrementar contador
  entry.count++

  const allowed = entry.count <= limit
  const remaining = Math.max(0, limit - entry.count)

  return { allowed, remaining }
}

// ─── Rate Limiting Principal ────────────────────────────────────────────────

/**
 * Rate limiting com Redis (preferencial) e fallback em memória
 *
 * @param routeKey - Identificador da rota (ex: 'transacoes-post')
 * @param ip - Endereço IP do cliente
 * @param limit - Número máximo de requisições permitidas
 * @param windowSec - Janela de tempo em segundos
 * @returns Objeto com allowed (boolean) e remaining (número de requisições restantes)
 *
 * @example
 * ```typescript
 * const result = await rateLimit('api-endpoint', '192.168.1.1', 10, 60)
 * if (!result.allowed) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 * }
 * ```
 */
export async function rateLimit(
  routeKey: string,
  ip: string,
  limit = 10,
  windowSec = 60,
): Promise<{ allowed: boolean; remaining: number }> {
  // Tentar usar Redis primeiro
  if (redis) {
    try {
      const key = `ratelimit:${routeKey}:${ip}`
      const current = await redis.incr(key)
      if (current === 1) await redis.expire(key, windowSec)
      const allowed = current <= limit
      const remaining = Math.max(0, limit - current)
      return { allowed, remaining }
    } catch (error) {
      console.error(
        '[RATE_LIMIT_REDIS_ERROR] Redis falhou, usando fallback em memória',
        routeKey,
        error instanceof Error ? error.message : error,
      )
      // Fallback para memória em caso de erro do Redis
      return inMemoryRateLimit(routeKey, ip, limit, windowSec)
    }
  }

  // Se Redis não está disponível, usar fallback em memória
  console.warn('[RATE_LIMIT_FALLBACK] Redis não disponível, usando rate limiting em memória')
  return inMemoryRateLimit(routeKey, ip, limit, windowSec)
}

/**
 * Limpa o store em memória (útil para testes)
 */
export function clearInMemoryStore(): void {
  inMemoryStore.clear()
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    cleanupTimer = null
  }
}

/**
 * Retorna estatísticas do store em memória (útil para monitoramento)
 */
export function getInMemoryStats(): {
  size: number
  maxSize: number
  oldestEntry: number | null
} {
  let oldestResetAt: number | null = null

  for (const entry of inMemoryStore.values()) {
    if (oldestResetAt === null || entry.resetAt < oldestResetAt) {
      oldestResetAt = entry.resetAt
    }
  }

  return {
    size: inMemoryStore.size,
    maxSize: MAX_MEMORY_ENTRIES,
    oldestEntry: oldestResetAt,
  }
}
