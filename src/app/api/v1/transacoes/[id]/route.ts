import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, churchProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const [transaction] = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
        paymentMethod: transactions.paymentMethod,
        gatewayTransactionId: transactions.gatewayTransactionId,
        refundRequestReason: transactions.refundRequestReason,
        contributorEmail: users.email,
        contributorPhone: users.phone,
        contributorRole: users.role,
        contributorId: users.id,
        churchId: transactions.originChurchId,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    let churchName = null
    let churchAddress = null
    if (transaction.churchId) {
      const [church] = await db
        .select({
          name: churchProfiles.nomeFantasia,
          address: churchProfiles.address,
          city: churchProfiles.city,
          state: churchProfiles.state,
        })
        .from(churchProfiles)
        .innerJoin(users, eq(churchProfiles.userId, users.id))
        .where(eq(users.id, transaction.churchId))
        .limit(1)

      if (church) {
        churchName = church.name
        churchAddress = `${church.address}, ${church.city}, ${church.state}`
      }
    }

    return NextResponse.json({
      id: transaction.id,
      date: new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      amount: parseFloat(transaction.amount),
      status: transaction.status,
      contributor: {
        id: transaction.contributorId,
        name: transaction.contributorEmail.split('@')[0],
        email: transaction.contributorEmail,
        phone: transaction.contributorPhone,
        role: transaction.contributorRole,
      },
      church: churchName
        ? {
            name: churchName,
            address: churchAddress,
          }
        : null,
      payment: {
        method:
          transaction.paymentMethod === 'pix'
            ? 'Pix'
            : transaction.paymentMethod === 'credit_card'
              ? 'Cartão de Crédito'
              : 'Boleto',
        details: transaction.gatewayTransactionId || 'N/A',
      },
      refundRequestReason: transaction.refundRequestReason,
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
