import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { queryPayment } from '@/lib/cielo'

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

    if (!transaction.gatewayTransactionId) {
      return NextResponse.json({ error: 'Transação sem ID do gateway' }, { status: 400 })
    }

    // Verificar se tem mais de 15 minutos
    const now = new Date()
    const transactionDate = new Date(transaction.createdAt)
    const diffMinutes = (now.getTime() - transactionDate.getTime()) / (1000 * 60)

    if (transaction.status === 'pending' && diffMinutes > 15) {
      // Cancelar transação pendente com mais de 15 minutos
      await db.update(transactions).set({ status: 'refused' }).where(eq(transactions.id, id))

      return NextResponse.json({
        success: true,
        message: 'Transação cancelada (mais de 15 minutos pendente)',
        status: 'refused',
      })
    }

    // Não sincronizar se já foi reembolsado
    if (transaction.status === 'refunded') {
      return NextResponse.json({
        success: true,
        message: 'Transação já reembolsada - não sincronizada',
        status: 'refunded',
      })
    }

    // Consultar status na Cielo
    const cieloResponse = await queryPayment(transaction.gatewayTransactionId)

    // Mapear status da Cielo
    let newStatus: 'approved' | 'pending' | 'refused' | 'refunded' = 'pending'
    if (cieloResponse.Payment?.Status === 2) {
      newStatus = 'approved'
    } else if (cieloResponse.Payment?.Status === 3 || cieloResponse.Payment?.Status === 10) {
      newStatus = 'refused'
    } else if (cieloResponse.Payment?.Status === 11) {
      newStatus = 'refunded'
    }

    // Atualizar no banco se mudou
    if (newStatus !== transaction.status) {
      await db.update(transactions).set({ status: newStatus }).where(eq(transactions.id, id))
    }

    return NextResponse.json({
      success: true,
      message: 'Transação sincronizada com sucesso',
      status: newStatus,
      cieloStatus: cieloResponse.Payment?.Status,
    })
  } catch (error) {
    console.error('Error syncing transaction:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao sincronizar' },
      { status: 500 },
    )
  }
}
