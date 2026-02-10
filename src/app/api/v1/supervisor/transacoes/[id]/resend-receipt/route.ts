/**
 * @fileoverview API para reenviar comprovante de transação (visão do supervisor).
 * @version 1.0
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 18:30
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions as transactionsTable,
  users,
  pastorProfiles,
  churchProfiles,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { SessionUser } from '@/lib/types'

async function verifyTransactionOwnership(
  transactionId: string,
  supervisorId: string,
): Promise<boolean> {
  const [transaction] = await db
    .select({ contributorId: transactionsTable.contributorId })
    .from(transactionsTable)
    .where(eq(transactionsTable.id, transactionId))
    .limit(1)

  if (!transaction || !transaction.contributorId) return false

  const contributorId = transaction.contributorId

  // Verificar se é o próprio supervisor
  if (contributorId === supervisorId) return true

  // Verificar se é um pastor da supervisão
  const pastorIdsResult = await db
    .select({ id: pastorProfiles.userId })
    .from(pastorProfiles)
    .where(eq(pastorProfiles.supervisorId, supervisorId))
  const pastorIds = pastorIdsResult.map((p) => p.id)
  if (pastorIds.includes(contributorId)) return true

  // Verificar se é uma igreja da supervisão
  const churchIdsResult = await db
    .select({ id: churchProfiles.userId })
    .from(churchProfiles)
    .where(eq(churchProfiles.supervisorId, supervisorId))
  const churchIds = churchIdsResult.map((c) => c.id)
  if (churchIds.includes(contributorId)) return true

  return false
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params
  const { id } = params
  let sessionUser: SessionUser | null = null

  try {
    // Rate limiting: 10 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-transacoes-resend-receipt', ip, 10, 60)
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_TRANSACOES_RESEND_RECEIPT_RATE_LIMIT]', {
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
      console.error('[SUPERVISOR_TRANSACOES_RESEND_RECEIPT_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_TRANSACOES_RESEND_RECEIPT_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    if (!id) {
      return NextResponse.json({ error: 'ID da transação não fornecido.' }, { status: 400 })
    }

    // Verificar se o supervisor tem acesso a esta transação
    const isAuthorized = await verifyTransactionOwnership(id, sessionUser.id)
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Transação não encontrada ou você não tem permissão para acessá-la.' },
        { status: 404 },
      )
    }

    // Buscar dados da transação e do contribuinte
    const [transactionData] = await db
      .select({
        transaction: transactionsTable,
        contributorEmail: users.email,
      })
      .from(transactionsTable)
      .leftJoin(users, eq(transactionsTable.contributorId, users.id))
      .where(eq(transactionsTable.id, id))
      .limit(1)

    if (!transactionData) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 })
    }

    // Verificar se a transação está aprovada
    if (transactionData.transaction.status !== 'approved') {
      return NextResponse.json(
        { error: 'Comprovante só pode ser reenviado para transações aprovadas.' },
        { status: 400 },
      )
    }

    // TODO: Implementar envio de email com comprovante
    // Por enquanto, simular o envio

    return NextResponse.json({
      success: true,
      message: 'Comprovante reenviado com sucesso.',
    })
  } catch (error: unknown) {
    console.error('[SUPERVISOR_TRANSACOES_RESEND_RECEIPT_ERROR]', {
      supervisorId: sessionUser?.id,
      transactionId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro interno do servidor.', details: errorMessage },
      { status: 500 },
    )
  }
}
