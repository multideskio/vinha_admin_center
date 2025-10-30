import { Queue } from 'bullmq'
import IORedis from 'ioredis'

function createRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  const isTLS = url.startsWith('rediss://')
  const client = new IORedis(url, {
    maxRetriesPerRequest: null as unknown as undefined,
    enableReadyCheck: false,
    connectTimeout: 5000,
    retryStrategy: (times) => Math.min(5000, times * 200),
    tls: isTLS ? { rejectUnauthorized: false } : undefined,
  } as any)
  client.on('error', () => {})
  return client
}

const connection = createRedis()

export const notificationQueue = new Queue('notifications', { connection })
