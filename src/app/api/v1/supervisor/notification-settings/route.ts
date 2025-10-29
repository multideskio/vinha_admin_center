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

export async function GET() {
  const { user } = await validateRequest()
  if (!user || user.role !== 'supervisor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const settings = await db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, user.id))

    const result = NOTIFICATION_TYPES.reduce((acc, type) => {
      const setting = settings.find(s => s.notificationType === type)
      acc[type] = {
        email: setting?.email ?? true,
        whatsapp: setting?.whatsapp ?? false,
      }
      return acc
    }, {} as Record<string, unknown>)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'supervisor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = notificationSettingsSchema.parse(body)

    await db.transaction(async (tx) => {
      await tx
        .delete(userNotificationSettings)
        .where(eq(userNotificationSettings.userId, user.id))

      const insertData = Object.entries(data).map(([type, settings]) => ({
        userId: user.id,
        notificationType: type as 'payment_notifications' | 'due_date_reminders' | 'network_reports',
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
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
