import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { processNotificationEvent } from '../lib/notification-hooks'
import { env } from '../lib/env'

// ✅ CORRIGIDO: Fallback gracioso — se Redis falhar, worker não crasheia o processo
function createRedis(): IORedis | null {
  try {
    const url = env.REDIS_URL
    if (!url) {
      console.error('[WORKER_REDIS_INIT] REDIS_URL não configurada')
      return null
    }

    const isTLS = url.startsWith('rediss://')

    const client = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 5000,
      retryStrategy: (times: number) => {
        const delay = Math.min(5000, times * 200)
        console.warn(`[WORKER_REDIS] Reconectando (tentativa ${times})... Delay: ${delay}ms`)
        return delay
      },
      ...(isTLS && { tls: { rejectUnauthorized: false } }),
    })

    client.on('error', (error) => {
      console.error('[WORKER_REDIS_ERROR]', error instanceof Error ? error.message : error)
    })

    client.on('connect', () => {
      console.warn('[WORKER_REDIS] Conectado com sucesso')
    })

    client.on('ready', () => {
      console.warn('[WORKER_REDIS] Pronto para receber comandos')
    })

    return client
  } catch (error) {
    console.error('[WORKER_REDIS_INIT_ERROR]', error instanceof Error ? error.message : error)
    return null
  }
}

const connection = createRedis()

if (connection) {
  const worker = new Worker(
    'notifications',
    async (job: Job) => {
      const { eventType, data } = job.data
      await processNotificationEvent(eventType, data)
    },
    { connection },
  )

  worker.on('completed', (job) => {
    console.warn('[WORKER] Notificação processada com sucesso:', job.id)
  })
  worker.on('failed', (job, err) => {
    console.error(
      '[WORKER] Falha ao processar notificação:',
      job?.id,
      err instanceof Error ? err.message : err,
    )
  })
} else {
  console.error('[WORKER] Redis indisponível — worker de notificações não iniciado')
}
