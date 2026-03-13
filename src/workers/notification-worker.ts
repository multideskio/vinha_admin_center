import { Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { processNotificationEvent } from '../lib/notification-hooks'
import { env } from '../lib/env'

console.log('[WORKER] Iniciando worker de notificações...')
console.log('[WORKER] NODE_ENV:', process.env.NODE_ENV)

// Criar conexão Redis
function createRedis(): IORedis | null {
  try {
    const url = env.REDIS_URL
    if (!url) {
      console.error('[WORKER] REDIS_URL não configurada')
      return null
    }

    console.log('[WORKER] Conectando ao Redis...')
    const isTLS = url.startsWith('rediss://')

    const client = new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 10000,
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error('[WORKER] Máximo de tentativas de reconexão atingido')
          return null // Para de tentar
        }
        const delay = Math.min(5000, times * 500)
        console.log(`[WORKER] Reconectando ao Redis (tentativa ${times})... Delay: ${delay}ms`)
        return delay
      },
      ...(isTLS && { tls: { rejectUnauthorized: false } }),
    })

    client.on('error', (error) => {
      console.error('[WORKER] Redis error:', error instanceof Error ? error.message : error)
    })

    client.on('connect', () => {
      console.log('[WORKER] Redis conectado')
    })

    client.on('ready', () => {
      console.log('[WORKER] Redis pronto para receber comandos')
    })

    client.on('close', () => {
      console.log('[WORKER] Conexão Redis fechada')
    })

    return client
  } catch (error) {
    console.error(
      '[WORKER] Erro ao criar conexão Redis:',
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

const connection = createRedis()

if (!connection) {
  console.error('[WORKER] Falha ao conectar no Redis. Encerrando...')
  process.exit(1)
}

// Criar worker
const worker = new Worker(
  'notifications',
  async (job: Job) => {
    console.log(`[WORKER] Processando job ${job.id}:`, job.name)

    try {
      const { eventType, data } = job.data
      console.log(`[WORKER] Evento: ${eventType}, UserId: ${data?.userId}`)

      await processNotificationEvent(eventType, data)

      console.log(`[WORKER] Job ${job.id} processado com sucesso`)
    } catch (error) {
      console.error(
        `[WORKER] Erro ao processar job ${job.id}:`,
        error instanceof Error ? error.message : error,
      )
      throw error // Re-throw para BullMQ marcar como failed
    }
  },
  {
    connection,
    concurrency: 5, // Processar até 5 jobs simultaneamente
  },
)

// Event handlers
worker.on('completed', (job) => {
  console.log(`[WORKER] ✅ Job ${job.id} completado`)
})

worker.on('failed', (job, err) => {
  console.error(`[WORKER] ❌ Job ${job?.id} falhou:`, err instanceof Error ? err.message : err)
})

worker.on('error', (err) => {
  console.error('[WORKER] Erro no worker:', err instanceof Error ? err.message : err)
})

worker.on('ready', () => {
  console.log('[WORKER] ✅ Worker pronto e aguardando jobs na fila "notifications"')
})

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`[WORKER] Recebido ${signal}. Encerrando graciosamente...`)

  try {
    await worker.close()
    console.log('[WORKER] Worker fechado')

    await connection?.quit()
    console.log('[WORKER] Conexão Redis fechada')

    process.exit(0)
  } catch (error) {
    console.error('[WORKER] Erro ao encerrar:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Keep-alive - mantém o processo rodando
console.log('[WORKER] Worker iniciado. Pressione Ctrl+C para encerrar.')
