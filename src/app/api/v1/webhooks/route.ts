/**
 * @fileoverview Rota da API para gerenciar webhooks.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { webhooks, webhookEventEnum } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'

import { getCompanyId } from '@/lib/utils'

const COMPANY_ID = getCompanyId()

const webhookSchema = z.object({
  url: z.string().url(),
  secret: z.string().min(1),
  events: z.array(z.enum(webhookEventEnum.enumValues)).min(1, 'Selecione ao menos um evento.'),
})

export async function GET(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const allWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.companyId, COMPANY_ID))
      .orderBy(desc(webhooks.createdAt))

    return NextResponse.json({ webhooks: allWebhooks })
  } catch (error: unknown) {
    console.error('Erro ao buscar webhooks:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = webhookSchema.parse(body)

    const [newWebhook] = await db
      .insert(webhooks)
      .values({
        companyId: COMPANY_ID,
        url: validatedData.url,
        secret: validatedData.secret,
        events: validatedData.events,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ success: true, webhook: newWebhook }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao criar webhook:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
