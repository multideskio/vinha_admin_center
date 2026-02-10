/**
 * @fileoverview Rate limiting via Redis
 * @description Usa instância Redis singleton de @/lib/redis
 */

import { redis } from '@/lib/redis'

export async function rateLimit(
  routeKey: string,
  ip: string,
  limit = 10,
  windowSec = 60,
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) return { allowed: true, remaining: limit }
  try {
    const key = `ratelimit:${routeKey}:${ip}`
    const current = await redis.incr(key)
    if (current === 1) await redis.expire(key, windowSec)
    const allowed = current <= limit
    const remaining = Math.max(0, limit - current)
    return { allowed, remaining }
  } catch (error) {
    console.error('[RATE_LIMIT_ERROR]', routeKey, error)
    return { allowed: true, remaining: limit }
  }
}
