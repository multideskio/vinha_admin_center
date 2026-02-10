import { db } from '@/db/drizzle'
import { cieloLogs } from '@/db/schema'
import { sanitizeLog } from '@/lib/log-sanitizer'

export async function logCieloRequest(data: {
  operationType: 'pix' | 'cartao' | 'boleto' | 'consulta' | 'cancelamento'
  method: string
  endpoint: string
  paymentId?: string
  requestBody?: unknown
}) {
  try {
    await db.insert(cieloLogs).values({
      operationType: data.operationType,
      type: 'request',
      method: data.method,
      endpoint: data.endpoint,
      paymentId: data.paymentId || null,
      requestBody: data.requestBody ? JSON.stringify(sanitizeLog(data.requestBody)) : null,
    })
  } catch (error) {
    console.error(
      '[CIELO_LOGGER] Error logging request:',
      error instanceof Error ? error.message : error,
    )
  }
}

export async function logCieloResponse(data: {
  operationType: 'pix' | 'cartao' | 'boleto' | 'consulta' | 'cancelamento'
  method: string
  endpoint: string
  paymentId?: string
  responseBody?: unknown
  statusCode: number
  errorMessage?: string
}) {
  try {
    await db.insert(cieloLogs).values({
      operationType: data.operationType,
      type: 'response',
      method: data.method,
      endpoint: data.endpoint,
      paymentId: data.paymentId || null,
      responseBody: data.responseBody ? JSON.stringify(sanitizeLog(data.responseBody)) : null,
      statusCode: data.statusCode,
      errorMessage: data.errorMessage || null,
    })
  } catch (error) {
    console.error(
      '[CIELO_LOGGER] Error logging response:',
      error instanceof Error ? error.message : error,
    )
  }
}

export async function logCieloWebhook(data: { paymentId?: string; requestBody: unknown }) {
  try {
    await db.insert(cieloLogs).values({
      operationType: 'webhook',
      type: 'request',
      method: 'POST',
      endpoint: '/webhooks/cielo',
      paymentId: data.paymentId || null,
      requestBody: JSON.stringify(sanitizeLog(data.requestBody)),
    })
  } catch (error) {
    console.error(
      '[CIELO_LOGGER] Error logging webhook:',
      error instanceof Error ? error.message : error,
    )
  }
}
