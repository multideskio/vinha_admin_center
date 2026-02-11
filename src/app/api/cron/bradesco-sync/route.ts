/**
 * @fileoverview Cron job para polling de transações Bradesco pendentes.
 * Consulta a API do Bradesco para atualizar o status de transações PIX e Boleto.
 * Segue o mesmo padrão do cron de notificações (auth, lock Redis, etc.).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { queryBradescoPixPayment, queryBradescoBoletoPayment } from '@/lib/bradesco'
import { invalidateCache } from '@/lib/cache'
import { timingSafeEqual } from 'crypto'
import { env } from '@/lib/env'
import { redis } from '@/lib/redis'

const LOCK_KEY = 'cron:bradesco-sync:lock'
const LOCK_TTL_SECONDS = 120

/** Máximo de transações processadas por execução */
const MAX_TRANSACTIONS_PER_RUN = 50

/** Transações pendentes há mais de 60 minutos são marcadas como recusadas */
const EXPIRATION_MINUTES = 60

function mapBradescoPixStatus(bradescoStatus: string): 'approved' | 'pending' | 'refused' {
  switch (bradescoStatus) {
    case 'CONCLUIDA':
      return 'approved'
    case 'REMOVIDA_PELO_USUARIO_RECEBEDOR':
    case 'REMOVIDA_PELO_PSP':
      return 'refused'
    case 'ATIVA':
    default:
      return 'pending'
  }
}

function mapBradescoBoletoStatus(bradescoStatus: string): 'approved' | 'pending' | 'refused' {
  switch (bradescoStatus) {
    case 'pago':
      return 'approved'
    case 'vencido':
    case 'cancelado':
      return 'refused'
    case 'registrado':
    default:
      return 'pending'
  }
}

export async function GET(request: NextRequest) {
  try {
    // Autenticação via CRON_SECRET
    const CRON_SECRET = env.CRON_SECRET
    if (!CRON_SECRET) {
      console.error('[CRON_BRADESCO] CRON_SECRET não configurado')
      return NextResponse.json({ error: 'Configuração do servidor inválida' }, { status: 500 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const expectedToken = Buffer.from(CRON_SECRET)
    const receivedToken = Buffer.from(token)

    if (
      expectedToken.length !== receivedToken.length ||
      !timingSafeEqual(expectedToken, receivedToken)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Lock distribuído via Redis
    if (redis) {
      const lockAcquired = await redis.set(
        LOCK_KEY,
        Date.now().toString(),
        'EX',
        LOCK_TTL_SECONDS,
        'NX',
      )
      if (!lockAcquired) {
        return NextResponse.json({
          success: true,
          message: 'Cron já em execução por outra instância',
          skipped: true,
        })
      }
    }

    try {
      const result = await syncBradescoTransactions()

      return NextResponse.json({
        success: true,
        message: 'Sincronização Bradesco concluída',
        timestamp: new Date().toISOString(),
        ...result,
      })
    } finally {
      if (redis) {
        await redis.del(LOCK_KEY).catch((err: Error) => {
          console.error('[CRON_BRADESCO] Erro ao liberar lock:', err.message)
        })
      }
    }
  } catch (error) {
    console.error('[CRON_BRADESCO] Erro no cron de sincronização:', error)
    return NextResponse.json(
      { error: 'Erro interno no cron de sincronização Bradesco' },
      { status: 500 },
    )
  }
}

interface SyncResult {
  total: number
  updated: number
  expired: number
  errors: number
}

async function syncBradescoTransactions(): Promise<SyncResult> {
  const result: SyncResult = { total: 0, updated: 0, expired: 0, errors: 0 }

  // Buscar transações Bradesco pendentes
  const pendingTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.gateway, 'Bradesco'),
        eq(transactions.status, 'pending'),
        sql`${transactions.gatewayTransactionId} IS NOT NULL`,
      ),
    )
    .limit(MAX_TRANSACTIONS_PER_RUN)

  result.total = pendingTransactions.length

  if (pendingTransactions.length === 0) {
    console.info('[CRON_BRADESCO] Nenhuma transação pendente encontrada')
    return result
  }

  console.info(`[CRON_BRADESCO] Processando ${pendingTransactions.length} transações pendentes`)

  let needsCacheInvalidation = false

  for (const tx of pendingTransactions) {
    try {
      const now = new Date()
      const createdAt = new Date(tx.createdAt)
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

      // Expirar transações muito antigas
      if (diffMinutes > EXPIRATION_MINUTES) {
        await db.update(transactions).set({ status: 'refused' }).where(eq(transactions.id, tx.id))

        result.expired++
        needsCacheInvalidation = true
        console.info(`[CRON_BRADESCO] Transação ${tx.id} expirada (${Math.round(diffMinutes)}min)`)
        continue
      }

      let newStatus: 'approved' | 'pending' | 'refused' = 'pending'

      if (tx.paymentMethod === 'pix') {
        const response = await queryBradescoPixPayment(tx.gatewayTransactionId!)
        newStatus = mapBradescoPixStatus(response.status)
      } else if (tx.paymentMethod === 'boleto') {
        const response = await queryBradescoBoletoPayment(tx.gatewayTransactionId!)
        newStatus = mapBradescoBoletoStatus(response.status)
      }

      if (newStatus !== 'pending') {
        await db.update(transactions).set({ status: newStatus }).where(eq(transactions.id, tx.id))

        result.updated++
        needsCacheInvalidation = true
        console.info(`[CRON_BRADESCO] Transação ${tx.id} atualizada: pending → ${newStatus}`)
      }
    } catch (error) {
      result.errors++
      console.error(`[CRON_BRADESCO] Erro ao processar transação ${tx.id}:`, error)
    }
  }

  // Invalidar caches se houve atualizações
  if (needsCacheInvalidation) {
    await invalidateCache('dashboard:admin:*').catch((err: unknown) => {
      console.error('[CRON_BRADESCO] Erro ao invalidar cache dashboard:', err)
    })
    await invalidateCache('relatorio:*').catch((err: unknown) => {
      console.error('[CRON_BRADESCO] Erro ao invalidar cache relatório:', err)
    })
  }

  console.info('[CRON_BRADESCO] Resultado:', result)
  return result
}
