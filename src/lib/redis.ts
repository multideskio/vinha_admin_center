/**
 * @fileoverview Instância Redis compartilhada (singleton)
 * @description Evita múltiplas conexões Redis no mesmo processo.
 * Importar daqui em vez de criar novas instâncias em cada módulo.
 */

import IORedis from 'ioredis'
import { env } from '@/lib/env'

function createRedis(): IORedis | null {
  try {
    const url = env.REDIS_URL
    const isTLS = url.startsWith('rediss://')
    const client = new IORedis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      connectTimeout: 5000,
      retryStrategy: (times: number) => Math.min(5000, times * 200),
      tls: isTLS ? { rejectUnauthorized: false } : undefined,
    } as Record<string, unknown>)
    client.on('error', (err: Error) => {
      console.error('[REDIS_ERROR]', err.message)
    })
    return client
  } catch (error) {
    console.error('[REDIS_INIT_ERROR]', error)
    return null
  }
}

/** Instância Redis singleton — pode ser null se a conexão falhar */
export const redis: IORedis | null = createRedis()
