import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions,
  users,
  churchProfiles,
  pastorProfiles,
  supervisorProfiles,
  managerProfiles,
  adminProfiles,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'

// @lastReview 2025-01-05 21:45

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting: 60 requests per minute for GET
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('transacao-get', ip, 60, 60) // 60 requests per minute
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

    // Buscar nome da igreja se houver
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
        churchAddress =
          church.address && church.city
            ? `${church.address}, ${church.city}, ${church.state}`
            : null
      }
    }

    // Buscar nome real do contribuinte baseado no role
    let contributorName = transaction.contributorEmail.split('@')[0]

    try {
      if (transaction.contributorRole === 'pastor') {
        const [profile] = await db
          .select({ firstName: pastorProfiles.firstName, lastName: pastorProfiles.lastName })
          .from(pastorProfiles)
          .where(eq(pastorProfiles.userId, transaction.contributorId))
          .limit(1)
        if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
      } else if (transaction.contributorRole === 'supervisor') {
        const [profile] = await db
          .select({
            firstName: supervisorProfiles.firstName,
            lastName: supervisorProfiles.lastName,
          })
          .from(supervisorProfiles)
          .where(eq(supervisorProfiles.userId, transaction.contributorId))
          .limit(1)
        if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
      } else if (transaction.contributorRole === 'manager') {
        const [profile] = await db
          .select({ firstName: managerProfiles.firstName, lastName: managerProfiles.lastName })
          .from(managerProfiles)
          .where(eq(managerProfiles.userId, transaction.contributorId))
          .limit(1)
        if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
      } else if (transaction.contributorRole === 'church_account') {
        const [profile] = await db
          .select({ nomeFantasia: churchProfiles.nomeFantasia })
          .from(churchProfiles)
          .where(eq(churchProfiles.userId, transaction.contributorId))
          .limit(1)
        if (profile) contributorName = profile.nomeFantasia
      } else if (transaction.contributorRole === 'admin') {
        const [profile] = await db
          .select({ firstName: adminProfiles.firstName, lastName: adminProfiles.lastName })
          .from(adminProfiles)
          .where(eq(adminProfiles.userId, transaction.contributorId))
          .limit(1)
        if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
      }
    } catch (error) {
      console.error('[TRANSACAO_CONTRIBUTOR_NAME_ERROR]', {
        transactionId: id,
        contributorId: transaction.contributorId,
        contributorRole: transaction.contributorRole,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      id: transaction.id,
      date: new Date(transaction.createdAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      amount: parseFloat(transaction.amount),
      status: transaction.status,
      contributor: {
        id: transaction.contributorId,
        name: contributorName,
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
            ? 'PIX'
            : transaction.paymentMethod === 'credit_card'
              ? 'Cartão de Crédito'
              : 'Boleto',
        details: transaction.gatewayTransactionId || 'N/A',
      },
      refundRequestReason: transaction.refundRequestReason,
    })
  } catch (error) {
    console.error('[TRANSACAO_GET_ERROR]', {
      transactionId: 'unknown',
      userId: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
