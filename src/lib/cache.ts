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
    } as any)
    client.on('error', () => {})
    return client
  } catch {
    return null
  }
}

let redis: IORedis | null = createRedis()

export async function setCache(key: string, value: any, ttlSeconds = 60) {
  if (!redis) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // ignora erro de cache
  }
}

export async function getCache<T = any>(key: string): Promise<T | null> {
  if (!redis) return null
  try {
    const data = await redis.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

export async function delCache(key: string) {
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    // ignora
  }
}

export async function invalidateCache(pattern: string) {
  if (!redis) return
  try {
    const keys = await redis.keys(pattern)
    if (keys && keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // ignora
  }
}
