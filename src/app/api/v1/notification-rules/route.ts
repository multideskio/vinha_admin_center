/**
 * @fileoverview Rota da API para gerenciar regras de notificação.
 * @version 1.3
 * @date 2024-08-07
 * @author PH
 * @lastReview 2026-01-05 14:30 - Segurança e funcionalidades verificadas
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { notificationRules } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'
import { NOTIFICATION_EVENT_TRIGGERS } from '@/lib/types'
import { getErrorMessage } from '@/lib/error-types'

const notificationRuleSchema = z.object({
  name: z.string().min(1, 'O nome da automação é obrigatório.'),
  eventTrigger: z.enum(NOTIFICATION_EVENT_TRIGGERS),
  daysOffset: z.coerce.number().int(),
  messageTemplate: z.string().min(1, 'O modelo da mensagem é obrigatório.'),
  sendViaEmail: z.boolean().default(true),
  sendViaWhatsapp: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export async function GET(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const allRules = await db
      .select()
      .from(notificationRules)
      .where(eq(notificationRules.companyId, user.companyId))
      .orderBy(desc(notificationRules.createdAt))
      .limit(100)

    return NextResponse.json({ rules: allRules })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao buscar regras de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 },
    )
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = notificationRuleSchema.parse(body)

    const [newRule] = await db
      .insert(notificationRules)
      .values({
        ...validatedData,
        companyId: user.companyId,
      })
      .returning()

    return NextResponse.json({ success: true, rule: newRule }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao criar regra de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 },
    )
  }
}
