/**
 * @fileoverview API para configurações de notificação do usuário
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { userNotificationSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'
import { NOTIFICATION_TYPES } from '@/lib/types'

const notificationSettingsSchema = z.object({
  payment_notifications: z.object({
    email: z.boolean(),
    whatsapp: z.boolean(),
  }),
  due_date_reminders: z.object({
    email: z.boolean(),
    whatsapp: z.boolean(),
  }),
  network_reports: z.object({
    email: z.boolean(),
    whatsapp: z.boolean(),
  }),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = await params

  // Usuário pode acessar suas próprias configurações OU admin/manager/supervisor podem acessar de qualquer um
  if (user.id !== id && !['admin', 'manager', 'supervisor'].includes(user.role)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const settings = await db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, id))

    const result = NOTIFICATION_TYPES.reduce(
      (acc, type) => {
        const setting = settings.find((s) => s.notificationType === type)
        acc[type] = {
          email: setting?.email ?? true,
          whatsapp: setting?.whatsapp ?? false,
        }
        return acc
      },
      {} as Record<string, unknown>,
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user } = await validateRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { id } = await params

  // Usuário pode atualizar suas próprias configurações OU admin/manager/supervisor podem atualizar de qualquer um
  if (user.id !== id && !['admin', 'manager', 'supervisor'].includes(user.role)) {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = notificationSettingsSchema.parse(body)

    await db.transaction(async (tx) => {
      // Remove configurações existentes
      await tx.delete(userNotificationSettings).where(eq(userNotificationSettings.userId, id))

      // Insere novas configurações
      const insertData = Object.entries(data).map(([type, settings]) => ({
        userId: id,
        notificationType: type as
          | 'payment_notifications'
          | 'due_date_reminders'
          | 'network_reports',
        email: settings.email,
        whatsapp: settings.whatsapp,
      }))

      if (insertData.length > 0) {
        await tx.insert(userNotificationSettings).values(insertData)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notification settings:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
