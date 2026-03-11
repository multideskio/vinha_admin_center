/**
 * @fileoverview Cache Redis para dados de aplicação
 * @description Usa instância Redis singleton de @/lib/redis.
 * Quando Redis não está disponível, as funções são no-op (get retorna null).
 */

import { redis } from '@/lib/redis'
import { getErrorMessage } from '@/lib/error-types'

const CACHE_PREFIX = 'cache:'

export async function setCache(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  if (!redis) return
  try {
    const fullKey = `${CACHE_PREFIX}${key}`
    const serialized = JSON.stringify(value)
    await redis.setex(fullKey, ttlSeconds, serialized)
  } catch (error) {
    console.error('[CACHE_SET_ERROR]', getErrorMessage(error))
  }
}

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    const fullKey = `${CACHE_PREFIX}${key}`
    const raw = await redis.get(fullKey)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch (error) {
    console.error('[CACHE_GET_ERROR]', getErrorMessage(error))
    return null
  }
}

export async function delCache(key: string): Promise<void> {
  if (!redis) return
  try {
    const fullKey = `${CACHE_PREFIX}${key}`
    await redis.del(fullKey)
  } catch (error) {
    console.error('[CACHE_DEL_ERROR]', getErrorMessage(error))
  }
}

/**
 * Invalida chaves por padrão usando SCAN (não-bloqueante)
 * O pattern usa sintaxe Redis (ex: gerentes:* vira cache:gerentes:*)
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return
  try {
    const fullPattern = `${CACHE_PREFIX}${pattern}`
    let cursor = '0'
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', fullPattern, 'COUNT', 100)
      cursor = newCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== '0')
  } catch (error) {
    console.error('[CACHE_INVALIDATE_ERROR]', getErrorMessage(error))
  }
}
