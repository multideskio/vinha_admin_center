import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users, churchProfiles, managerProfiles, supervisorProfiles, pastorProfiles } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { createPixPayment, createCreditCardPayment, createBoletoPayment } from '@/lib/cielo'
import { z } from 'zod'

const COMPANY_ID = process.env.COMPANY_INIT!

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
})

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const query = db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
        paymentMethod: transactions.paymentMethod,
        contributorId: transactions.contributorId,
        originChurchId: transactions.originChurchId,
        refundRequestReason: transactions.refundRequestReason,
      })
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(100)

    const userTransactions = userId
      ? await query.where(eq(transactions.contributorId, userId))
      : await query

    const formattedTransactions = userTransactions.map(t => ({
      id: t.id,
      contributor: t.contributorId,
      church: t.originChurchId,
      amount: parseFloat(t.amount),
      method: t.paymentMethod,
      status: t.status,
      date: t.createdAt.toISOString(),
      refundRequestReason: t.refundRequestReason,
    }))

    return NextResponse.json({ transactions: formattedTransactions })
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
    let profile: any = null
    let userData: any = null

    if (user.role === 'manager') {
      const [result] = await db
        .select({ email: users.email, profile: managerProfiles })
        .from(users)
        .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result
      profile = result?.profile
    } else if (user.role === 'supervisor') {
      const [result] = await db
        .select({ email: users.email, profile: supervisorProfiles })
        .from(users)
        .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result
      profile = result?.profile
    } else if (user.role === 'pastor') {
      const [result] = await db
        .select({ email: users.email, profile: pastorProfiles })
        .from(users)
        .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result
      profile = result?.profile
    } else if (user.role === 'church') {
      const [result] = await db
        .select({ email: users.email, profile: churchProfiles })
        .from(users)
        .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result
      profile = result?.profile
    } else {
      const [result] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
      userData = result
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

    // Get church ID if user is church
    let churchId = null
    if (user.role === 'church') {
      churchId = user.id
    }

    let paymentResult: any
    let status: 'pending' | 'approved' | 'refused' = 'pending'

    // Process payment based on method
    if (data.paymentMethod === 'pix') {
      paymentResult = await createPixPayment(data.amount, userName, userData.email)
    } else if (data.paymentMethod === 'credit_card' && data.card) {
      paymentResult = await createCreditCardPayment(
        data.amount,
        userName,
        userData.email,
        data.card
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
        userName,
        userData.email,
        userCpf,
        userAddress,
        userCity,
        userState,
        userCep,
        userDistrict
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
        gatewayTransactionId: paymentResult.PaymentId,
      })
      .returning()

    return NextResponse.json({
      success: true,
      transaction: { id: transaction.id },
      data: paymentResult,
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar pagamento'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
