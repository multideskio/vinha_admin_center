import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { queryPayment } from '@/lib/cielo'
import { queryBradescoPixPayment, queryBradescoBoletoPayment } from '@/lib/bradesco'
import { rateLimit } from '@/lib/rate-limit'
import { invalidateCache } from '@/lib/cache'

// @lastReview 2025-02-11 — Suporte a múltiplos gateways (Cielo + Bradesco)

/**
 * Mapeia status do Bradesco PIX para status interno do sistema.
 */
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

/**
 * Mapeia status do Bradesco Boleto para status interno do sistema.
 */
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting: 30 requests per minute for POST (sync operations)
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('transacao-sync', ip, 30, 60)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const { user } = await validateRequest()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { id } = await params
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    if (!transaction.gatewayTransactionId) {
      return NextResponse.json({ error: 'Transação sem ID do gateway' }, { status: 400 })
    }

    // Verificar se tem mais de 15 minutos
    const now = new Date()
    const transactionDate = new Date(transaction.createdAt)
    const diffMinutes = (now.getTime() - transactionDate.getTime()) / (1000 * 60)

    if (transaction.status === 'pending' && diffMinutes > 15) {
      await db.update(transactions).set({ status: 'refused' }).where(eq(transactions.id, id))

      await invalidateCache('dashboard:admin:*')
      await invalidateCache('relatorio:*')

      return NextResponse.json({
        success: true,
        message: 'Transação cancelada (mais de 15 minutos pendente)',
        status: 'refused',
      })
    }

    // Não sincronizar se já foi reembolsado
    if (transaction.status === 'refunded') {
      return NextResponse.json({
        success: true,
        message: 'Transação já reembolsada - não sincronizada',
        status: 'refunded',
      })
    }

    let newStatus: 'approved' | 'pending' | 'refused' | 'refunded' = 'pending'
    let gatewayStatus: string | number | undefined

    if (transaction.gateway === 'Bradesco') {
      // Consultar status no Bradesco
      if (transaction.paymentMethod === 'pix') {
        const bradescoResponse = await queryBradescoPixPayment(transaction.gatewayTransactionId)
        newStatus = mapBradescoPixStatus(bradescoResponse.status)
        gatewayStatus = bradescoResponse.status
      } else if (transaction.paymentMethod === 'boleto') {
        const bradescoResponse = await queryBradescoBoletoPayment(transaction.gatewayTransactionId)
        newStatus = mapBradescoBoletoStatus(bradescoResponse.status)
        gatewayStatus = bradescoResponse.status
      }
    } else {
      // Consultar status na Cielo (fluxo existente)
      const cieloResponse = await queryPayment(transaction.gatewayTransactionId)

      if (cieloResponse.Payment?.Status === 2) {
        newStatus = 'approved'
      } else if (cieloResponse.Payment?.Status === 3 || cieloResponse.Payment?.Status === 10) {
        newStatus = 'refused'
      } else if (cieloResponse.Payment?.Status === 11) {
        newStatus = 'refunded'
      }
      gatewayStatus = cieloResponse.Payment?.Status
    }

    // Atualizar no banco se mudou
    if (newStatus !== transaction.status) {
      await db.update(transactions).set({ status: newStatus }).where(eq(transactions.id, id))

      await invalidateCache('dashboard:admin:*')
      await invalidateCache('relatorio:*')
    }

    return NextResponse.json({
      success: true,
      message: 'Transação sincronizada com sucesso',
      status: newStatus,
      gateway: transaction.gateway || 'Cielo',
      gatewayStatus,
    })
  } catch (error) {
    console.error('[TRANSACAO_SYNC_ERROR]', {
      transactionId: 'unknown',
      userId: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao sincronizar' },
      { status: 500 },
    )
  }
}
