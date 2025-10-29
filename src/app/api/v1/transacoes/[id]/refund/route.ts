import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { cancelPayment } from '@/lib/cielo'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { amount, reason } = body

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Motivo do reembolso é obrigatório' }, { status: 400 })
    }

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    if (transaction.status !== 'approved') {
      return NextResponse.json(
        { error: 'Apenas transações aprovadas podem ser reembolsadas' },
        { status: 400 }
      )
    }

    const transactionAmount = parseFloat(transaction.amount)
    if (amount > transactionAmount) {
      return NextResponse.json(
        { error: 'Valor do reembolso não pode ser maior que o valor da transação' },
        { status: 400 }
      )
    }

    // Cancelar na Cielo se tiver gatewayTransactionId
    if (transaction.gatewayTransactionId) {
      try {
        await cancelPayment(transaction.gatewayTransactionId, amount)
      } catch (cieloError) {
        console.error('Erro ao cancelar na Cielo:', cieloError)
        return NextResponse.json(
          { error: cieloError instanceof Error ? cieloError.message : 'Erro ao cancelar na Cielo' },
          { status: 500 }
        )
      }
    }

    // Atualizar status da transação
    await db
      .update(transactions)
      .set({
        status: 'refunded',
        refundRequestReason: reason,
      })
      .where(eq(transactions.id, id))

    return NextResponse.json({
      success: true,
      message: 'Reembolso processado com sucesso',
    })
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar reembolso' },
      { status: 500 }
    )
  }
}
