import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, supervisorProfiles } from '@/db/schema'
import { validateRequest } from '@/lib/jwt'
import { eq } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'

// @lastReview 2025-01-05 21:30

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting: 60 requests per minute for GET
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('manager-transacao-get', ip, 60, 60) // 60 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 }
      )
    }

    const { id } = await params
    const { user } = await validateRequest()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (user.role !== 'manager') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Get transaction
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Verify transaction belongs to manager or their network
    if (transaction.contributorId !== user.id) {
      // Check if contributor is in manager's network
      const supervisors = await db
        .select({ userId: supervisorProfiles.userId })
        .from(supervisorProfiles)
        .where(eq(supervisorProfiles.managerId, user.id))

      const supervisorUserIds = supervisors.map((s) => s.userId)
      const isInNetwork = supervisorUserIds.includes(transaction.contributorId)

      if (!isInNetwork) {
        return NextResponse.json({ error: 'Acesso negado a esta transação' }, { status: 403 })
      }
    }

    // Get contributor details
    const [contributorUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, transaction.contributorId))
      .limit(1)

    const formattedTransaction = {
      id: transaction.id,
      date: transaction.createdAt,
      amount: Number(transaction.amount),
      status: transaction.status,
      contributor: {
        name: contributorUser?.email.split('@')[0] || 'Desconhecido',
        email: contributorUser?.email || 'N/A',
      },
      church: {
        name: 'N/A',
        address: 'N/A',
      },
      payment: {
        method: transaction.paymentMethod || 'N/A',
        details: 'N/A',
      },
      refundRequestReason: transaction.refundRequestReason,
    }

    return NextResponse.json({ transaction: formattedTransaction })
  } catch (error) {
    console.error('[MANAGER_TRANSACAO_GET_ERROR]', {
      userId: 'unknown',
      transactionId: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro ao buscar transação' }, { status: 500 })
  }
}
