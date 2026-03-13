/**
 * @fileoverview Endpoint para criar transação manual (transferência, dinheiro, etc.)
 * Permite ao admin registrar pagamentos feitos fora do sistema de gateway
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { transactions, users } from '@/db/schema'
import { eq, isNull, and } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { z } from 'zod'
import { env } from '@/lib/env'
import { invalidateCache } from '@/lib/cache'
import { onTransactionCreated } from '@/lib/notification-hooks'

const COMPANY_ID = env.COMPANY_INIT

// Schema de validação
const manualTransactionSchema = z.object({
  contributorId: z.string().uuid('ID do contribuinte inválido'),
  amount: z.number().min(0.01, 'Valor mínimo é R$ 0,01'),
  paymentMethod: z.enum(['pix', 'boleto', 'credit_card']).default('pix'),
  description: z.string().max(500).optional(),
  // Se true, já cria como aprovado (baixa imediata)
  approveImmediately: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const body = await request.json()
    const validation = manualTransactionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 },
      )
    }

    const { contributorId, amount, paymentMethod, description, approveImmediately } =
      validation.data

    // Verificar se o contribuinte existe e está ativo
    const [contributor] = await db
      .select({ id: users.id, email: users.email, role: users.role, companyId: users.companyId })
      .from(users)
      .where(and(eq(users.id, contributorId), isNull(users.deletedAt)))
      .limit(1)

    if (!contributor) {
      return NextResponse.json({ error: 'Contribuinte não encontrado' }, { status: 404 })
    }

    // Criar transação manual
    const [transaction] = await db
      .insert(transactions)
      .values({
        companyId: COMPANY_ID,
        contributorId,
        amount: amount.toFixed(2),
        status: approveImmediately ? 'approved' : 'pending',
        paymentMethod,
        description: description || `Transação manual criada por ${user.email}`,
        gateway: 'Manual',
        gatewayTransactionId: `MANUAL-${Date.now()}`,
      })
      .returning()

    if (!transaction) {
      return NextResponse.json({ error: 'Erro ao criar transação' }, { status: 500 })
    }

    // Invalidar cache
    await invalidateCache('dashboard')
    await invalidateCache('transactions')

    // Se aprovado imediatamente, disparar notificação
    if (approveImmediately) {
      try {
        await onTransactionCreated(transaction.id)
      } catch (notifError) {
        console.error('[MANUAL_TRANSACTION] Erro ao enviar notificação:', notifError)
        // Não falha a transação por erro de notificação
      }
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt,
      },
      message: approveImmediately
        ? 'Transação criada e aprovada com sucesso'
        : 'Transação criada com sucesso (pendente)',
    })
  } catch (error) {
    console.error('[MANUAL_TRANSACTION] Erro:', error)
    return NextResponse.json({ error: 'Erro ao criar transação manual' }, { status: 500 })
  }
}
