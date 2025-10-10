import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Cielo Webhook received:', JSON.stringify(body, null, 2))

    const { PaymentId, ChangeType } = body

    if (!PaymentId) {
      return NextResponse.json({ error: 'PaymentId missing' }, { status: 400 })
    }

    // Buscar transação
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.gatewayTransactionId, PaymentId))
      .limit(1)

    if (!transaction) {
      console.log('Transaction not found:', PaymentId)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Mapear status Cielo para nosso status
    let newStatus: 'approved' | 'pending' | 'refused' | 'refunded' = transaction.status

    switch (ChangeType) {
      case 1: // Payment status changed
      case 3: // Recurrence created
        // Consultar status atual na Cielo
        const { queryPayment } = await import('@/lib/cielo')
        const paymentData = await queryPayment(PaymentId)
        const cieloStatus = paymentData.Payment?.Status

        if (cieloStatus === 2) newStatus = 'approved'
        else if (cieloStatus === 3) newStatus = 'refused'
        else if (cieloStatus === 10 || cieloStatus === 11) newStatus = 'refunded'
        else newStatus = 'pending'
        break

      case 2: // Boleto status changed
        newStatus = 'approved'
        break

      case 4: // Antifraud status changed
      case 5: // Recurrence deactivated
        // Não altera status
        break
    }

    // Atualizar transação se status mudou
    if (newStatus !== transaction.status) {
      await db
        .update(transactions)
        .set({ status: newStatus })
        .where(eq(transactions.id, transaction.id))

      console.log(`Transaction ${transaction.id} updated: ${transaction.status} -> ${newStatus}`)
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('Cielo webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
