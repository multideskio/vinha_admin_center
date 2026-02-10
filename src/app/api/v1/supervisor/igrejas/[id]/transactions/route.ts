import { NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions, users, churchProfiles } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'

async function verifyChurch(churchId: string, supervisorId: string): Promise<boolean> {
  const [church] = await db
    .select()
    .from(churchProfiles)
    .where(eq(churchProfiles.userId, churchId))
    .limit(1)
  if (!church || church.supervisorId !== supervisorId) return false
  return true
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-church-transactions', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_CHURCH_TRANSACTIONS_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const params = await props.params

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: sessionUser } = await validateRequest()

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_CHURCH_TRANSACTIONS_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_CHURCH_TRANSACTIONS_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    const { id } = params

    // Verificar se a igreja pertence à supervisão
    const isAuthorized = await verifyChurch(id, sessionUser.id)
    if (!isAuthorized) {
      console.error('[SUPERVISOR_CHURCH_TRANSACTIONS_UNAUTHORIZED]', {
        supervisorId: sessionUser.id,
        churchId: id,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Igreja não encontrada ou não pertence a esta supervisão.' },
        { status: 403 },
      )
    }

    // Buscar transações relacionadas à igreja
    // Transações onde a igreja é a origem (originChurchId)
    const churchTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        paymentMethod: transactions.paymentMethod,
        createdAt: transactions.createdAt,
        contributorName: users.email, // Nome do contribuinte
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .where(
        and(
          // Transações onde a igreja é a origem
          eq(transactions.originChurchId, id),
        ),
      )
      .orderBy(desc(transactions.createdAt))
      .limit(50) // Limitar a 50 transações mais recentes

    // Formatar as transações para o formato esperado pelo frontend
    const formattedTransactions = churchTransactions.map((transaction) => ({
      id: transaction.id,
      amount: transaction.amount,
      status: transaction.status,
      paymentMethod: transaction.paymentMethod,
      date: new Date(transaction.createdAt).toLocaleDateString('pt-BR'),
      contributorName: transaction.contributorName,
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
      total: formattedTransactions.length,
    })
  } catch (error) {
    console.error('[SUPERVISOR_CHURCH_TRANSACTIONS_ERROR]', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
