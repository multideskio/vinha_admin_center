/**
 * @fileoverview Endpoint para aprovar manualmente uma transação pendente
 * Usado para dar baixa em pagamentos feitos fora do gateway (transferência, dinheiro, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { invalidateCache } from '@/lib/cache'
import { onTransactionCreated } from '@/lib/notification-hooks'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await validateRequest()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { id } = await params

    // Buscar transação
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Verificar se já está aprovada
    if (transaction.status === 'approved') {
      return NextResponse.json({ error: 'Transação já está aprovada' }, { status: 400 })
    }

    // Verificar se está em status que pode ser aprovado
    if (transaction.status === 'refunded') {
      return NextResponse.json(
        { error: 'Transação reembolsada não pode ser aprovada' },
        { status: 400 },
      )
    }

    if (transaction.status === 'refused' && transaction.isFraud) {
      return NextResponse.json(
        { error: 'Transação marcada como fraude não pode ser aprovada' },
        { status: 400 },
      )
    }

    // Aprovar transação
    await db
      .update(transactions)
      .set({
        status: 'approved',
        description: transaction.description
          ? `${transaction.description} | Aprovado manualmente por ${user.email} em ${new Date().toLocaleString('pt-BR')}`
          : `Aprovado manualmente por ${user.email} em ${new Date().toLocaleString('pt-BR')}`,
      })
      .where(eq(transactions.id, id))

    // Invalidar cache
    await invalidateCache('dashboard')
    await invalidateCache('transactions')

    // Disparar notificação de pagamento aprovado
    try {
      await onTransactionCreated(id)
    } catch (notifError) {
      console.error('[APPROVE_TRANSACTION] Erro ao enviar notificação:', notifError)
      // Não falha a operação por erro de notificação
    }

    return NextResponse.json({
      success: true,
      message: 'Transação aprovada com sucesso',
      transaction: {
        id,
        status: 'approved',
        approvedBy: user.email,
        approvedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[APPROVE_TRANSACTION] Erro:', error)
    return NextResponse.json({ error: 'Erro ao aprovar transação' }, { status: 500 })
  }
}
