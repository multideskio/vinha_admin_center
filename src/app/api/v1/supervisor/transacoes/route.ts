/**
 * @fileoverview Rota da API para buscar transações da supervisão.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

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
import { getErrorMessage } from '@/lib/error-types'

export async function GET(request: Request): Promise<NextResponse> {
  // Primeiro tenta autenticação JWT (usuário logado via web)
  const { user: sessionUser } = await validateRequest()
  
  if (!sessionUser) {
    // Se não há usuário logado, tenta autenticação por API Key
    const authResponse = await authenticateApiKey()
    if (authResponse) return authResponse
    
    // Se nem JWT nem API Key funcionaram, retorna 401
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  
  // Verifica se o usuário tem a role correta
  if (sessionUser.role !== 'supervisor') {
    return NextResponse.json({ error: 'Acesso negado. Role supervisor necessária.' }, { status: 403 })
  }

  try {
    // Extrair parâmetros de data da URL
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    const networkUserIds = [sessionUser.id, ...pastorIds, ...churchIds]
    if (networkUserIds.length === 0) {
      return NextResponse.json({ transactions: [] })
    }

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

    const formattedTransactions = results.map((t) => ({
      ...t,
      amount: Number(t.amount),
      date: format(new Date(t.date), 'dd/MM/yyyy'),
    }))

    return NextResponse.json({ transactions: formattedTransactions })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao buscar transações da supervisão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 },
    )
  }
}
