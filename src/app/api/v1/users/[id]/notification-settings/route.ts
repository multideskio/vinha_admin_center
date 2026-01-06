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
import { rateLimit } from '@/lib/rate-limit'

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
  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('user-notification-settings-get', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[USER_NOTIFICATION_SETTINGS_GET_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const { user } = await validateRequest()
    if (!user) {
      console.error('[USER_NOTIFICATION_SETTINGS_GET_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { id } = await params

    // Usuário pode acessar suas próprias configurações OU admin/manager/supervisor podem acessar de qualquer um
    if (user.id !== id && !['admin', 'manager', 'supervisor'].includes(user.role)) {
      console.error('[USER_NOTIFICATION_SETTINGS_GET_FORBIDDEN]', {
        userId: user.id,
        requestedId: id,
        role: user.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    console.log('[USER_NOTIFICATION_SETTINGS_GET_REQUEST]', {
      userId: user.id,
      requestedId: id,
      timestamp: new Date().toISOString(),
    })

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
    console.error('[USER_NOTIFICATION_SETTINGS_GET_ERROR]', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting: 30 requests per minute for updates
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('user-notification-settings-put', ip, 30, 60)
    if (!rateLimitResult.allowed) {
      console.error('[USER_NOTIFICATION_SETTINGS_PUT_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const { user } = await validateRequest()
    if (!user) {
      console.error('[USER_NOTIFICATION_SETTINGS_PUT_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { id } = await params

    // Usuário pode atualizar suas próprias configurações OU admin/manager/supervisor podem atualizar de qualquer um
    if (user.id !== id && !['admin', 'manager', 'supervisor'].includes(user.role)) {
      console.error('[USER_NOTIFICATION_SETTINGS_PUT_FORBIDDEN]', {
        userId: user.id,
        requestedId: id,
        role: user.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    console.log('[USER_NOTIFICATION_SETTINGS_PUT_REQUEST]', {
      userId: user.id,
      requestedId: id,
      timestamp: new Date().toISOString(),
    })

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

    console.log('[USER_NOTIFICATION_SETTINGS_PUT_SUCCESS]', {
      userId: user.id,
      requestedId: id,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[USER_NOTIFICATION_SETTINGS_PUT_VALIDATION_ERROR]', {
        errors: error.errors,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }

    console.error('[USER_NOTIFICATION_SETTINGS_PUT_ERROR]', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
