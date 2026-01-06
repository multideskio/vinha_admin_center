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
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { id } = await params

    // Buscar a transação primeiro
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

    // Verificar autorização baseada no role
    let hasAccess = false

    if (user.role === 'admin') {
      hasAccess = true
    } else if (user.role === 'supervisor') {
      // Supervisor pode acessar transações da sua rede (pastores, igrejas e próprias)
      if (transaction.contributorId === user.id) {
        hasAccess = true
      } else {
        // Verificar se o contribuinte é um pastor ou igreja da supervisão
        const isInNetwork =
          (await db
            .select({ id: pastorProfiles.userId })
            .from(pastorProfiles)
            .where(eq(pastorProfiles.supervisorId, user.id))
            .then((pastors) => pastors.some((p) => p.id === transaction.contributorId))) ||
          (await db
            .select({ id: churchProfiles.userId })
            .from(churchProfiles)
            .where(eq(churchProfiles.supervisorId, user.id))
            .then((churches) => churches.some((c) => c.id === transaction.contributorId)))

        hasAccess = isInNetwork
      }
    } else if (user.role === 'manager') {
      // Manager pode acessar transações da sua rede (supervisores, pastores, igrejas e próprias)
      if (transaction.contributorId === user.id) {
        hasAccess = true
      } else {
        // Verificar se o contribuinte está na rede do manager
        const isInNetwork =
          (await db
            .select({ id: supervisorProfiles.userId })
            .from(supervisorProfiles)
            .where(eq(supervisorProfiles.managerId, user.id))
            .then((supervisors) => supervisors.some((s) => s.id === transaction.contributorId))) ||
          (await db
            .select({ id: pastorProfiles.userId })
            .from(pastorProfiles)
            .leftJoin(
              supervisorProfiles,
              eq(pastorProfiles.supervisorId, supervisorProfiles.userId),
            )
            .where(eq(supervisorProfiles.managerId, user.id))
            .then((pastors) => pastors.some((p) => p.id === transaction.contributorId))) ||
          (await db
            .select({ id: churchProfiles.userId })
            .from(churchProfiles)
            .leftJoin(
              supervisorProfiles,
              eq(churchProfiles.supervisorId, supervisorProfiles.userId),
            )
            .where(eq(supervisorProfiles.managerId, user.id))
            .then((churches) => churches.some((c) => c.id === transaction.contributorId)))

        hasAccess = isInNetwork
      }
    } else {
      // Outros roles só podem acessar suas próprias transações
      hasAccess = transaction.contributorId === user.id
    }

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado a esta transação.' }, { status: 403 })
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
      transaction: {
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
        // Dados para sincronização
        Payment: {
          Status: transaction.status === 'approved' ? 2 : transaction.status === 'refused' ? 3 : 1,
        },
      },
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
