/**
 * @fileoverview Rota da API para criar e listar transações.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  gatewayConfigurations,
  transactions as transactionsTable,
  users,
  churchProfiles,
  pastorProfiles,
  supervisorProfiles,
  managerProfiles,
  transactionStatusEnum,
} from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { z } from 'zod'
import { format } from 'date-fns'
import { validateRequest } from '@/lib/auth'
import { PAYMENT_METHODS, type UserRole } from '@/lib/types'

import { getCompanyId } from '@/lib/utils'

const COMPANY_ID = getCompanyId()

const transactionSchema = z.object({
  amount: z.coerce.number().min(1, 'O valor deve ser maior que zero.'),
  paymentMethod: z.enum(PAYMENT_METHODS),
  contributionType: z.enum(['dizimo', 'oferta'], {
    required_error: 'O tipo de contribuição é obrigatório.',
  }),
  description: z.string().optional(),
  card: z
    .object({
      number: z.string(),
      holder: z.string(),
      expirationDate: z.string(),
      securityCode: z.string(),
      brand: z.string(),
    })
    .optional(),
})

async function getCieloCredentials(): Promise<{
  merchantId: string | null
  merchantKey: string | null
  apiUrl: string
}> {
  const [config] = await db
    .select()
    .from(gatewayConfigurations)
    .where(eq(gatewayConfigurations.gatewayName, 'Cielo'))
    .limit(1)

  if (!config || !config.isActive) throw new Error('Gateway Cielo não está ativo ou configurado.')

  const isProduction = config.environment === 'production'
  return {
    merchantId: isProduction ? config.prodClientId : config.devClientId,
    merchantKey: isProduction ? config.prodClientSecret : config.devClientSecret,
    apiUrl: isProduction
      ? 'https://api.cieloecommerce.cielo.com.br'
      : 'https://apisandbox.cieloecommerce.cielo.com.br',
  }
}

function mapCieloStatusToDbStatus(
  cieloStatus: number,
): (typeof transactionStatusEnum.enumValues)[number] {
  switch (cieloStatus) {
    case 2: // PaymentConfirmed
    case 1: // Authorized (auto-capture)
      return 'approved'
    case 12: // Pending
      return 'pending'
    case 3: // Denied
    case 10: // Voided
    case 11: // Refunded
    case 13: // Aborted
    default:
      return 'refused'
  }
}

async function getContributorProfile(
  userId: string,
  role: UserRole,
): Promise<
  Array<{
    firstName: string | null
    lastName: string | null
    cpf: string | null
    address: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
    cep: string | null
  }>
> {
  let profileQuery
  switch (role) {
    case 'manager':
      profileQuery = db
        .select({
          firstName: managerProfiles.firstName,
          lastName: managerProfiles.lastName,
          cpf: managerProfiles.cpf,
          address: managerProfiles.address,
          neighborhood: managerProfiles.neighborhood,
          city: managerProfiles.city,
          state: managerProfiles.state,
          cep: managerProfiles.cep,
        })
        .from(managerProfiles)
        .where(eq(managerProfiles.userId, userId))
        .limit(1)
      break
    case 'supervisor':
      profileQuery = db
        .select({
          firstName: supervisorProfiles.firstName,
          lastName: supervisorProfiles.lastName,
          cpf: supervisorProfiles.cpf,
          address: supervisorProfiles.address,
          neighborhood: supervisorProfiles.neighborhood,
          city: supervisorProfiles.city,
          state: supervisorProfiles.state,
          cep: supervisorProfiles.cep,
        })
        .from(supervisorProfiles)
        .where(eq(supervisorProfiles.userId, userId))
        .limit(1)
      break
    case 'pastor':
      profileQuery = db
        .select({
          firstName: pastorProfiles.firstName,
          lastName: pastorProfiles.lastName,
          cpf: pastorProfiles.cpf,
          address: pastorProfiles.address,
          neighborhood: pastorProfiles.neighborhood,
          city: pastorProfiles.city,
          state: pastorProfiles.state,
          cep: pastorProfiles.cep,
        })
        .from(pastorProfiles)
        .where(eq(pastorProfiles.userId, userId))
        .limit(1)
      break
    case 'church_account':
      profileQuery = db
        .select({
          firstName: churchProfiles.nomeFantasia,
          lastName: sql<string>`''`,
          cpf: churchProfiles.cnpj,
          address: churchProfiles.address,
          neighborhood: churchProfiles.neighborhood,
          city: churchProfiles.city,
          state: churchProfiles.state,
          cep: churchProfiles.cep,
        })
        .from(churchProfiles)
        .where(eq(churchProfiles.userId, userId))
        .limit(1)
      break
    default:
      return []
  }
  const profile = await profileQuery
  return profile
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  if (!sessionUser) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const [contributorProfile] = await getContributorProfile(sessionUser.id, sessionUser.role)

    if (!contributorProfile) {
      return NextResponse.json({ error: 'Perfil do contribuinte não encontrado.' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = transactionSchema.parse(body)
    const credentials = await getCieloCredentials()

    const merchantOrderId = `vinha-${Date.now()}`

    const originChurchId = sessionUser.role === 'church_account' ? sessionUser.id : null

    const cieloPayload: {
      MerchantOrderId: string
      Customer: {
        Name: string
        Identity?: string
        IdentityType?: string
        Address?: {
          Street: string
          Number: string
          District: string
          ZipCode: string
          City: string
          State: string
          Country: string
        }
      }
      Payment: {
        Type: string
        Amount: number
        Capture?: boolean
        Installments?: number
        Provider?: string
        CreditCard?: {
          CardNumber: string
          Holder: string
          ExpirationDate: string
          SecurityCode: string
          Brand: string
        }
      }
    } = {
      MerchantOrderId: merchantOrderId,
      Customer: {
        Name: `${contributorProfile.firstName || 'Usuário'} ${contributorProfile.lastName || ''}`.trim(),
      },
      Payment: {
        Type: '',
        Amount: validatedData.amount * 100,
      },
    }

    switch (validatedData.paymentMethod) {
      case 'pix':
        cieloPayload.Payment.Type = 'Pix'
        break
      case 'credit_card':
        if (!validatedData.card) {
          throw new Error('Dados do cartão de crédito são obrigatórios.')
        }
        cieloPayload.Payment.Type = 'CreditCard'
        cieloPayload.Payment.Capture = true
        cieloPayload.Payment.Installments = 1
        cieloPayload.Payment.CreditCard = {
          CardNumber: validatedData.card.number.replace(/\s/g, ''),
          Holder: validatedData.card.holder,
          ExpirationDate: validatedData.card.expirationDate,
          SecurityCode: validatedData.card.securityCode,
          Brand: validatedData.card.brand,
        }
        break
      case 'boleto':
        if (
          !contributorProfile.cpf ||
          !contributorProfile.address ||
          !contributorProfile.neighborhood ||
          !contributorProfile.city ||
          !contributorProfile.state ||
          !contributorProfile.cep
        ) {
          return NextResponse.json(
            {
              error:
                'Endereço ou CPF incompletos. Por favor, complete seu perfil antes de gerar um boleto.',
            },
            { status: 400 },
          )
        }
        cieloPayload.Payment.Type = 'Boleto'
        cieloPayload.Payment.Provider = 'Bradesco2'
        cieloPayload.Customer.Identity = contributorProfile.cpf.replace(/\D/g, '')
        cieloPayload.Customer.IdentityType =
          contributorProfile.cpf.replace(/\D/g, '').length === 11 ? 'CPF' : 'CNPJ'
        cieloPayload.Customer.Address = {
          Street: contributorProfile.address,
          Number: '123', // Número é obrigatório, mas pode ser um valor padrão
          District: contributorProfile.neighborhood,
          ZipCode: contributorProfile.cep.replace(/\D/g, ''),
          City: contributorProfile.city,
          State: contributorProfile.state,
          Country: 'BRA',
        }
        break
    }

    const response = await fetch(`${credentials.apiUrl}/1/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        MerchantId: credentials.merchantId || '',
        MerchantKey: credentials.merchantKey || '',
      },
      body: JSON.stringify(cieloPayload),
    })

    const cieloData = await response.json()

    if (!response.ok) {
      console.error('Erro da API Cielo:', cieloData)
      throw new Error(cieloData[0]?.Message || 'Falha ao processar pagamento na Cielo.')
    }

    const dbStatus = mapCieloStatusToDbStatus(cieloData.Payment?.Status)

    await db.insert(transactionsTable).values({
      companyId: COMPANY_ID,
      contributorId: sessionUser.id,
      originChurchId: originChurchId,
      amount: String(validatedData.amount),
      status: dbStatus,
      paymentMethod: validatedData.paymentMethod,
      gatewayTransactionId: cieloData.Payment?.PaymentId,
    })

    return NextResponse.json({ success: true, data: cieloData.Payment }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao criar transação:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    const query = db
      .select({
        id: transactionsTable.id,
        contributor: users.email,
        church: churchProfiles.nomeFantasia,
        amount: transactionsTable.amount,
        method: transactionsTable.paymentMethod,
        status: transactionsTable.status,
        date: transactionsTable.createdAt,
        refundRequestReason: transactionsTable.refundRequestReason,
      })
      .from(transactionsTable)
      .leftJoin(users, eq(transactionsTable.contributorId, users.id))
      .leftJoin(churchProfiles, eq(transactionsTable.originChurchId, churchProfiles.userId))
      .orderBy(desc(transactionsTable.createdAt))

    if (userId) {
      query.where(eq(transactionsTable.contributorId, userId))
    }

    const results = await query

    const formattedTransactions = results.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: format(new Date(t.date), 'dd/MM/yyyy'),
    }))

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error: unknown) {
    console.error('Erro ao buscar transações:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: errorMessage },
      { status: 500 },
    )
  }
}
