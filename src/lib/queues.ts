import { Queue } from 'bullmq'
import IORedis from 'ioredis'

function createRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  const isTLS = url.startsWith('rediss://')
  const client = new IORedis(url, {
    maxRetriesPerRequest: null as unknown as undefined,
    enableReadyCheck: false,
    connectTimeout: 5000,
    retryStrategy: (times: number) => Math.min(5000, times * 200),
      tls: isTLS ? { rejectUnauthorized: false } : undefined,
    } as Record<string, unknown>)

  // ✅ CORRIGIDO: Logging de erros Redis (Bug #1)
  client.on('error', (error) => {
    console.error('Redis connection error:', error)
  })

  client.on('connect', () => {
    console.log('Redis connected successfully')
  })

  client.on('ready', () => {
    console.log('Redis ready to accept commands')
  })

  client.on('reconnecting', () => {
    console.warn('Redis reconnecting...')
  })

  return client
}

const connection = createRedis()

export const notificationQueue = new Queue('notifications', { connection })
