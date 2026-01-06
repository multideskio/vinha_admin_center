import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { id } = await params

    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Atualizar status para refused e marcar como fraude
    await db
      .update(transactions)
      .set({
        status: 'refused',
        refundRequestReason: 'Marcada como fraude pelo administrador',
        isFraud: true,
        fraudMarkedAt: new Date(),
        fraudMarkedBy: user.id,
        fraudReason: 'Transação identificada como fraudulenta pela administração',
      })
      .where(eq(transactions.id, id))

    return NextResponse.json({
      success: true,
      message: 'Transação marcada como fraude',
    })
  } catch (error) {
    console.error('Error marking as fraud:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao marcar como fraude' },
      { status: 500 },
    )
  }
}
