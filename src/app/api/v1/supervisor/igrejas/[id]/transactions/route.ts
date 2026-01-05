import { NextResponse } from 'next/server'
import { db } from '@/db'
import { transactions, users } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params

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
    return NextResponse.json(
      { error: 'Acesso negado. Role supervisor necessária.' },
      { status: 403 },
    )
  }

  const { id } = params
  const supervisorId = sessionUser.id

  try {
    // Buscar transações relacionadas à igreja
    // Isso inclui transações onde a igreja é a origem ou destino
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
          // Transações relacionadas à igreja (pode ser contributorId ou churchId dependendo do schema)
          eq(transactions.contributorId, id), // Ajustar conforme o schema real
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
    console.error('Erro ao buscar transações da igreja:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
