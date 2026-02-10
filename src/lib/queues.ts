import { Queue } from 'bullmq'
import IORedis from 'ioredis'
import { env } from '@/lib/env'

// ✅ CORRIGIDO: Fallback gracioso — se Redis falhar, notificationQueue será null
function createRedis(): IORedis | null {
  try {
    const url = env.REDIS_URL
    if (!url) {
      console.error('[QUEUES_REDIS_INIT] REDIS_URL não configurada')
      return null
    }

    const isTLS = url.startsWith('rediss://')
    const client = new IORedis(url, {
      maxRetriesPerRequest: null as unknown as undefined,
      enableReadyCheck: false,
      connectTimeout: 5000,
      retryStrategy: (times: number) => Math.min(5000, times * 200),
      tls: isTLS ? { rejectUnauthorized: false } : undefined,
    } as Record<string, unknown>)

    client.on('error', (error) => {
      console.error('[QUEUES_REDIS_ERROR]', error instanceof Error ? error.message : error)
    })

    return client
  } catch (error) {
    console.error('[QUEUES_REDIS_INIT_ERROR]', error instanceof Error ? error.message : error)
    return null
  }
}

const connection = createRedis()

export const notificationQueue: Queue | null = connection
  ? new Queue('notifications', { connection })
  : null
