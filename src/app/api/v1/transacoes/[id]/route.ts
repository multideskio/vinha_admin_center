import { NextResponse } from 'next/server'
import { queryPayment } from '@/lib/cielo'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if it's a payment ID or transaction ID
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.gatewayTransactionId, params.id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Query Cielo for payment status
    const paymentData = await queryPayment(params.id)

    // Update transaction status if changed
    if (paymentData.Payment.Status === 2 && transaction.status !== 'approved') {
      await db
        .update(transactions)
        .set({ status: 'approved' })
        .where(eq(transactions.id, transaction.id))
    }

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        status: transaction.status,
        Payment: paymentData.Payment,
      },
    })
  } catch (error) {
    console.error('Error querying payment:', error)
    return NextResponse.json(
      { error: 'Erro ao consultar pagamento' },
      { status: 500 }
    )
  }
}
