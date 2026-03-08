/**
 * @fileoverview Rota da API para buscar transações da supervisão.
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 18:30
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions as transactionsTable,
  users,
  churchProfiles,
  pastorProfiles,
} from '@/db/schema'
import { eq, desc, inArray, gte, lte, and } from 'drizzle-orm'
import { format } from 'date-fns'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { SessionUser } from '@/lib/types'
import { z } from 'zod'

// BUG-05 fix: Schema Zod para validação de searchParams
const supervisorTransacoesParamsSchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  endDate: z.string().datetime({ offset: true }).optional().or(z.string().date().optional()),
  userId: z.string().uuid().optional(),
})

export async function GET(request: Request): Promise<NextResponse> {
  let sessionUser: SessionUser | null = null

  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-transacoes', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_TRANSACOES_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: authUser } = await validateRequest()
    sessionUser = authUser

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_TRANSACOES_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_TRANSACOES_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    // Extrair parâmetros da URL com validação Zod (BUG-05 fix)
    const { searchParams } = new URL(request.url)
    const paramsValidation = supervisorTransacoesParamsSchema.safeParse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      userId: searchParams.get('userId') || undefined,
    })

    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: paramsValidation.error.errors },
        { status: 400 },
      )
    }

    const { startDate, endDate, userId } = paramsValidation.data

    // Se userId for fornecido, buscar apenas transações desse usuário (se ele estiver na rede do supervisor)
    if (userId) {
      // Verificar se o usuário está na rede do supervisor
      const isInNetwork =
        (await db
          .select({ id: pastorProfiles.userId })
          .from(pastorProfiles)
          .where(eq(pastorProfiles.supervisorId, sessionUser.id))
          .then((pastors) => pastors.some((p) => p.id === userId))) ||
        (await db
          .select({ id: churchProfiles.userId })
          .from(churchProfiles)
          .where(eq(churchProfiles.supervisorId, sessionUser.id))
          .then((churches) => churches.some((c) => c.id === userId))) ||
        userId === sessionUser.id // O próprio supervisor

      if (!isInNetwork) {
        console.error('[SUPERVISOR_TRANSACOES_UNAUTHORIZED_USER]', {
          supervisorId: sessionUser.id,
          requestedUserId: userId,
          timestamp: new Date().toISOString(),
        })
        return NextResponse.json(
          { error: 'Usuário não está na sua rede de supervisão.' },
          { status: 403 },
        )
      }

      // Buscar transações do usuário específico
      const conditions = [eq(transactionsTable.contributorId, userId)]

      if (startDate) {
        conditions.push(gte(transactionsTable.createdAt, new Date(startDate)))
      }

      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setDate(endDateTime.getDate() + 1)
        conditions.push(lte(transactionsTable.createdAt, endDateTime))
      }

      const results = await db
        .select({
          id: transactionsTable.id,
          contributor: users.email,
          church: churchProfiles.nomeFantasia,
          amount: transactionsTable.amount,
          method: transactionsTable.paymentMethod,
          status: transactionsTable.status,
          date: transactionsTable.createdAt,
          createdAt: transactionsTable.createdAt,
          paymentMethod: transactionsTable.paymentMethod,
          refundRequestReason: transactionsTable.refundRequestReason,
        })
        .from(transactionsTable)
        .leftJoin(users, eq(transactionsTable.contributorId, users.id))
        .leftJoin(churchProfiles, eq(transactionsTable.originChurchId, churchProfiles.userId))
        .where(and(...conditions))
        .orderBy(desc(transactionsTable.createdAt))

      const formattedTransactions = results.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        status: t.status,
        paymentMethod: t.paymentMethod,
        createdAt: t.createdAt.toISOString(),
        date: format(new Date(t.date), 'dd/MM/yyyy'),
      }))

      return NextResponse.json({ transactions: formattedTransactions })
    }

    // Buscar pastores e igrejas da supervisão (comportamento original)
    const pastorIdsResult = await db
      .select({ id: pastorProfiles.userId })
      .from(pastorProfiles)
      .where(eq(pastorProfiles.supervisorId, sessionUser.id))
    const pastorIds = pastorIdsResult.map((p) => p.id)

    const churchIdsResult = await db
      .select({ id: churchProfiles.userId })
      .from(churchProfiles)
      .where(eq(churchProfiles.supervisorId, sessionUser.id))
    const churchIds = churchIdsResult.map((c) => c.id)

    // Incluir o próprio supervisor na rede
    const networkUserIds = [sessionUser.id, ...pastorIds, ...churchIds]

    // Construir condições de filtro
    const conditions = [inArray(transactionsTable.contributorId, networkUserIds)]

    if (startDate) {
      conditions.push(gte(transactionsTable.createdAt, new Date(startDate)))
    }

    if (endDate) {
      // Adicionar 1 dia para incluir transações do dia final
      const endDateTime = new Date(endDate)
      endDateTime.setDate(endDateTime.getDate() + 1)
      conditions.push(lte(transactionsTable.createdAt, endDateTime))
    }

    const results = await db
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
      .where(and(...conditions))
      .orderBy(desc(transactionsTable.createdAt))
      .limit(500) // BUG-04 fix: evitar resultado ilimitado

    const formattedTransactions = results.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: format(new Date(t.date), 'dd/MM/yyyy'),
    }))

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error: unknown) {
    console.error('[SUPERVISOR_TRANSACOES_GET_ERROR]', {
      supervisorId: sessionUser?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
