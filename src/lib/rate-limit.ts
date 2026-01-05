import IORedis from 'ioredis'

function createRedis(): IORedis | null {
  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379'
    const isTLS = url.startsWith('rediss://')
    const client = new IORedis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      connectTimeout: 5000,
      retryStrategy: (times: number) => Math.min(5000, times * 200),
      tls: isTLS ? { rejectUnauthorized: false } : undefined,
    } as Record<string, unknown>)
    client.on('error', () => {})
    return client
  } catch {
    return null
  }
}

const redis: IORedis | null = createRedis()

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
  } catch {
    return { allowed: true, remaining: limit }
  }
}
