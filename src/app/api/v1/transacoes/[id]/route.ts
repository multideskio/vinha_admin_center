import { NextResponse } from 'next/server'
import { queryPayment } from '@/lib/cielo'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`[TRANSACTION API] Starting query for ID: ${id}`)
    
    // Check if it's a payment ID or transaction ID
    console.log(`[TRANSACTION API] Searching for transaction with gatewayTransactionId: ${id}`)
    
    // Primeiro, vamos ver quantas transações existem no total
    const totalTransactions = await db.select().from(transactions).limit(10)
    console.log(`[TRANSACTION API] Total transactions in database (first 10):`, totalTransactions.map(t => ({
      id: t.id,
      gatewayTransactionId: t.gatewayTransactionId,
      status: t.status,
      amount: t.amount
    })))
    
    let [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.gatewayTransactionId, id))
      .limit(1)

    if (!transaction) {
      console.log(`[TRANSACTION API] Transaction not found in database for gatewayTransactionId: ${id}`)
      
      // Vamos tentar buscar por ID da transação também
      console.log(`[TRANSACTION API] Trying to search by transaction.id instead`)
      const [transactionById] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1)
        
      if (transactionById) {
        console.log(`[TRANSACTION API] Found transaction by ID:`, {
          id: transactionById.id,
          gatewayTransactionId: transactionById.gatewayTransactionId,
          status: transactionById.status
        })
        // Use a transação encontrada por ID
        transaction = transactionById
      } else {
        console.log(`[TRANSACTION API] Transaction not found by ID either: ${id}`)
        return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
      }
    }

    console.log(`[TRANSACTION API] Transaction found:`, {
      id: transaction.id,
      gatewayTransactionId: transaction.gatewayTransactionId,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.createdAt
    })

    // Use the gatewayTransactionId for Cielo query, not the passed ID
    const cieloPaymentId = transaction.gatewayTransactionId
    if (!cieloPaymentId) {
      console.log(`[TRANSACTION API] No gatewayTransactionId found for transaction ${transaction.id}`)
      return NextResponse.json({
        transaction: {
          id: transaction.id,
          status: transaction.status,
          Payment: {
            Status: transaction.status === 'approved' ? 2 : 0,
            ReasonCode: 0,
            ReasonMessage: 'Transação sem ID do gateway'
          }
        }
      })
    }

    console.log(`[TRANSACTION API] Using Cielo Payment ID: ${cieloPaymentId} (different from request ID: ${id})`)

    // Query Cielo for payment status
    console.log(`[TRANSACTION API] Querying Cielo for payment ID: ${cieloPaymentId}`)
    let paymentData
    try {
      paymentData = await queryPayment(cieloPaymentId)
      console.log(`[TRANSACTION API] Cielo response received:`, JSON.stringify(paymentData, null, 2))
      console.log(`[TRANSACTION API] Payment status from Cielo: ${paymentData.Payment?.Status}`)
    } catch (error) {
      console.error(`[TRANSACTION API] Error querying Cielo for payment ID ${cieloPaymentId}:`, error)
      console.log(`[TRANSACTION API] Returning local transaction status: ${transaction.status}`)
      // Se não conseguir consultar a Cielo, retorna o status atual da transação
      return NextResponse.json({
        transaction: {
          id: transaction.id,
          status: transaction.status,
          Payment: {
            Status: transaction.status === 'approved' ? 2 : 0,
            ReasonCode: 0,
            ReasonMessage: 'Erro ao consultar Cielo - usando status local'
          }
        }
      })
    }

    // Update transaction status if changed
    if (paymentData.Payment.Status === 2 && transaction.status !== 'approved') {
      console.log(`[TRANSACTION API] Payment confirmed by Cielo, updating status from '${transaction.status}' to 'approved'`)
      await db
        .update(transactions)
        .set({ status: 'approved' })
        .where(eq(transactions.id, transaction.id))
      console.log(`[TRANSACTION API] Transaction ${transaction.id} status updated to approved`)
      
      // Atualiza o status local para retornar o valor correto
      transaction.status = 'approved'
    } else {
      console.log(`[TRANSACTION API] No status update needed. Cielo status: ${paymentData.Payment.Status}, Current status: ${transaction.status}`)
    }

    const response = {
      transaction: {
        id: transaction.id,
        status: transaction.status,
        Payment: paymentData.Payment,
      },
    }
    
    console.log(`[TRANSACTION API] Returning response:`, JSON.stringify(response, null, 2))
    return NextResponse.json(response)
  } catch (error) {
    console.error(`[TRANSACTION API] Unexpected error for ID ${await params.then(p => p.id)}:`, error)
    console.error(`[TRANSACTION API] Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Erro ao consultar pagamento' },
      { status: 500 }
    )
  }
}
