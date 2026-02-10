/**
 * @fileoverview Cache Redis para dados de aplicação
 * @description Usa instância Redis singleton de @/lib/redis
 */

import { redis } from '@/lib/redis'

export async function setCache(key: string, value: unknown, ttlSeconds = 60) {
  if (!redis) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch (error) {
    console.error('[CACHE_SET_ERROR]', key, error instanceof Error ? error.message : error)
  }
}

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    const data = await redis.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (error) {
    console.error('[CACHE_GET_ERROR]', key, error instanceof Error ? error.message : error)
    return null
  }
}

export async function delCache(key: string) {
  if (!redis) return
  try {
    await redis.del(key)
  } catch (error) {
    console.error('[CACHE_DEL_ERROR]', key, error instanceof Error ? error.message : error)
  }
}

/**
 * Invalida chaves por padrão usando SCAN (não-bloqueante)
 * Substitui redis.keys() que é O(N) e bloqueia o Redis inteiro
 */
export async function invalidateCache(pattern: string) {
  if (!redis) return
  try {
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== '0')
  } catch (error) {
    console.error(
      '[CACHE_INVALIDATE_ERROR]',
      pattern,
      error instanceof Error ? error.message : error,
    )
  }
}
