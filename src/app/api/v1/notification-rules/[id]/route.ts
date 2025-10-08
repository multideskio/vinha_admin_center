import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { notificationRules } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { authenticateApiKey } from '@/lib/api-auth'
import { getErrorMessage } from '@/lib/error-types'

const COMPANY_ID = process.env.COMPANY_INIT
if (!COMPANY_ID) {
  throw new Error('COMPANY_INIT environment variable is required')
}
const VALIDATED_COMPANY_ID = COMPANY_ID as string

const notificationRuleSchema = z.object({
  name: z.string().min(1, 'O nome da automação é obrigatório.').optional(),
  eventTrigger: z
    .enum(['user_registered', 'payment_received', 'payment_due_reminder', 'payment_overdue'])
    .optional(),
  daysOffset: z.coerce.number().int().optional(),
  messageTemplate: z.string().min(1, 'O modelo da mensagem é obrigatório.').optional(),
  sendViaEmail: z.boolean().optional(),
  sendViaWhatsapp: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authResponse = await authenticateApiKey()
  if (authResponse) return authResponse

  const { id } = params
  try {
    const body = await request.json()
    const validatedData = notificationRuleSchema.parse(body)

    const [updatedRule] = await db
      .update(notificationRules)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(
        and(eq(notificationRules.id, id), eq(notificationRules.companyId, VALIDATED_COMPANY_ID)),
      )
      .returning()

    if (!updatedRule) {
      return NextResponse.json({ error: 'Regra não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, rule: updatedRule })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao atualizar regra de notificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const authResponse = await authenticateApiKey()
  if (authResponse) return authResponse

  const { id } = params
  try {
    const [deletedRule] = await db
      .delete(notificationRules)
      .where(
        and(eq(notificationRules.id, id), eq(notificationRules.companyId, VALIDATED_COMPANY_ID)),
      )
      .returning()

    if (!deletedRule) {
      return NextResponse.json({ error: 'Regra não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Regra excluída com sucesso.' })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao excluir regra de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: errorMessage },
      { status: 500 },
    )
  }
}
