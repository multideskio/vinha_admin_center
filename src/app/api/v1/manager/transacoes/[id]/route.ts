import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, churchProfiles, supervisorProfiles } from '@/db/schema'
import { validateRequest } from '@/lib/jwt'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      .where(eq(transactions.id, params.id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Verify transaction belongs to manager's network
    const [church] = await db
      .select({ supervisorId: churchProfiles.supervisorId })
      .from(churchProfiles)
      .where(eq(churchProfiles.userId, transaction.churchId))
      .limit(1)

    if (!church) {
      return NextResponse.json({ error: 'Igreja não encontrada' }, { status: 404 })
    }

    const [supervisor] = await db
      .select({ managerId: supervisorProfiles.managerId })
      .from(supervisorProfiles)
      .where(eq(supervisorProfiles.id, church.supervisorId))
      .limit(1)

    if (!supervisor || supervisor.managerId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado a esta transação' }, { status: 403 })
    }

    // Get contributor details
    const [contributor] = await db
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, transaction.contributorId))
      .limit(1)

    // Get church details
    const [churchUser] = await db
      .select({
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, transaction.churchId))
      .limit(1)

    const [churchProfile] = await db
      .select({
        address: churchProfiles.address,
        city: churchProfiles.city,
        state: churchProfiles.state,
      })
      .from(churchProfiles)
      .where(eq(churchProfiles.userId, transaction.churchId))
      .limit(1)

    const formattedTransaction = {
      id: transaction.id,
      date: transaction.createdAt,
      amount: Number(transaction.amount),
      status: transaction.status,
      contributor: {
        name: contributor?.name || 'Desconhecido',
        email: contributor?.email || 'N/A',
      },
      church: {
        name: churchUser?.name || 'Desconhecida',
        address: churchProfile
          ? `${churchProfile.address}, ${churchProfile.city}, ${churchProfile.state}`
          : 'N/A',
      },
      payment: {
        method: transaction.method,
        details: transaction.paymentDetails || 'N/A',
      },
      refundRequestReason: transaction.refundRequestReason,
    }

    return NextResponse.json({ transaction: formattedTransaction })
  } catch (error) {
    console.error('Error fetching manager transaction:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar transação' },
      { status: 500 }
    )
  }
}
