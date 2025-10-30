import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, churchProfiles, managerProfiles, supervisorProfiles, pastorProfiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { createPixPayment, createCreditCardPayment, createBoletoPayment } from '@/lib/cielo'
import { z } from 'zod'

const COMPANY_ID = process.env.COMPANY_INIT || ''

const transactionSchema = z.object({
  amount: z.number().min(1),
  paymentMethod: z.enum(['pix', 'credit_card', 'boleto']),
  contributionType: z.enum(['dizimo', 'oferta']),
  description: z.string().optional(),
  card: z.object({
    number: z.string(),
    holder: z.string(),
    expirationDate: z.string(),
    securityCode: z.string(),
    brand: z.string(),
  }).optional(),
  installments: z.number().min(1).max(12).optional(),
})

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    let query = db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
        paymentMethod: transactions.paymentMethod,
        contributorId: users.id,
        contributorRole: users.role,
        contributorEmail: users.email,
        churchId: transactions.originChurchId,
        refundRequestReason: transactions.refundRequestReason,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .orderBy(desc(transactions.createdAt))
      .$dynamic()

    if (userId) {
      query = query.where(eq(transactions.contributorId, userId))
    }

    if (from) {
      const { gte } = await import('drizzle-orm')
      query = query.where(gte(transactions.createdAt, new Date(from)))
    }

    if (to) {
      const { lt } = await import('drizzle-orm')
      query = query.where(lt(transactions.createdAt, new Date(to)))
    }

    const userTransactions = await query.limit(limit).offset(offset)

    const formattedTransactions = await Promise.all(
      userTransactions.map(async (t) => {
        let contributorName = t.contributorEmail
        
        if (t.contributorRole === 'manager') {
          const [profile] = await db.select({ firstName: managerProfiles.firstName, lastName: managerProfiles.lastName })
            .from(managerProfiles).where(eq(managerProfiles.userId, t.contributorId)).limit(1)
          if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
        } else if (t.contributorRole === 'supervisor') {
          const [profile] = await db.select({ firstName: supervisorProfiles.firstName, lastName: supervisorProfiles.lastName })
            .from(supervisorProfiles).where(eq(supervisorProfiles.userId, t.contributorId)).limit(1)
          if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
        } else if (t.contributorRole === 'pastor') {
          const [profile] = await db.select({ firstName: pastorProfiles.firstName, lastName: pastorProfiles.lastName })
            .from(pastorProfiles).where(eq(pastorProfiles.userId, t.contributorId)).limit(1)
          if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
        } else if (t.contributorRole === 'church_account') {
          const [profile] = await db.select({ nomeFantasia: churchProfiles.nomeFantasia })
            .from(churchProfiles).where(eq(churchProfiles.userId, t.contributorId)).limit(1)
          if (profile) contributorName = profile.nomeFantasia
        }

        return {
          id: t.id,
          contributor: contributorName,
          contributorEmail: t.contributorEmail,
          church: t.churchId || null,
          amount: parseFloat(t.amount),
          method: t.paymentMethod,
          status: t.status,
          date: new Date(t.createdAt).toLocaleDateString('pt-BR'),
          paidAt: new Date(t.createdAt).toISOString(),
          refundRequestReason: t.refundRequestReason,
        }
      })
    )

    return NextResponse.json({ 
      transactions: formattedTransactions,
      pagination: {
        page,
        limit,
        hasMore: formattedTransactions.length === limit,
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = transactionSchema.parse(body)

    // Get user data with profile based on role
    let profile: Record<string, unknown> | null = null
    let userData: { email: string } | null = null

    if (user.role === 'manager') {
      const [result] = await db
        .select({ email: users.email, profile: managerProfiles })
        .from(users)
        .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result || null
      profile = result?.profile as Record<string, unknown> | null
    } else if (user.role === 'supervisor') {
      const [result] = await db
        .select({ email: users.email, profile: supervisorProfiles })
        .from(users)
        .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result || null
      profile = result?.profile as Record<string, unknown> | null
    } else if (user.role === 'pastor') {
      const [result] = await db
        .select({ email: users.email, profile: pastorProfiles })
        .from(users)
        .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result || null
      profile = result?.profile as Record<string, unknown> | null
    } else if (user.role === 'church_account') {
      const [result] = await db
        .select({ email: users.email, profile: churchProfiles })
        .from(users)
        .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result || null
      profile = result?.profile as Record<string, unknown> | null
    } else {
      const [result] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result || null
    }

    if (!userData) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const userName = profile?.firstName && profile?.lastName 
      ? `${profile.firstName} ${profile.lastName}` 
      : profile?.nomeFantasia || userData.email.split('@')[0]
    const userCpf = profile?.cpf || profile?.treasurerCpf || ''
    const userAddress = profile?.address || ''
    const userCity = profile?.city || ''
    const userState = profile?.state || ''
    const userCep = profile?.cep || ''
    const userDistrict = profile?.neighborhood || ''



    let paymentResult: Record<string, unknown> | undefined
    let status: 'pending' | 'approved' | 'refused' = 'pending'

    // Process payment based on method
    if (data.paymentMethod === 'pix') {
      paymentResult = await createPixPayment(data.amount, userName as string)
    } else if (data.paymentMethod === 'credit_card' && data.card) {
      const installments = data.installments || 1
      paymentResult = await createCreditCardPayment(
        data.amount,
        String(userName),
        userData.email,
        data.card,
        installments
      )
      status = paymentResult.Status === 2 ? 'approved' : paymentResult.Status === 3 ? 'refused' : 'pending'
    } else if (data.paymentMethod === 'boleto') {
      if (!userCpf || !userAddress || !userCity || !userState || !userCep || !userDistrict) {
        return NextResponse.json({ 
          error: 'Boleto requer perfil completo com CPF, endereço e bairro. Complete seu perfil em /manager/perfil' 
        }, { status: 400 })
      }
      paymentResult = await createBoletoPayment(
        data.amount,
        String(userName),
        userData.email,
        String(userCpf),
        String(userAddress),
        String(userCity),
        String(userState),
        String(userCep),
        String(userDistrict)
      )
    }

    // Save transaction to database
    const [transaction] = await db
      .insert(transactions)
      .values({
        companyId: COMPANY_ID,
        contributorId: user.id,
        amount: data.amount.toString(),
        status,
        paymentMethod: data.paymentMethod,
        installments: data.installments || 1,
        gatewayTransactionId: (paymentResult?.PaymentId as string) || null,
      })
      .returning()

    return NextResponse.json({
      success: true,
      transaction: { id: transaction?.id },
      data: paymentResult,
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
