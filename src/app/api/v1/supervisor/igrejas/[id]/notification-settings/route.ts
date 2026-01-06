import { NextResponse } from 'next/server'
import { db } from '@/db'
import { userNotificationSettings, churchProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

async function verifyChurch(churchId: string, supervisorId: string): Promise<boolean> {
  const [church] = await db
    .select()
    .from(churchProfiles)
    .where(eq(churchProfiles.userId, churchId))
    .limit(1)
  if (!church || church.supervisorId !== supervisorId) return false
  return true
}

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

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Rate limiting: 60 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('supervisor-church-notification-settings', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const params = await props.params

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: sessionUser } = await validateRequest()

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    const { id } = params

    console.log('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_GET]', {
      supervisorId: sessionUser.id,
      churchId: id,
      timestamp: new Date().toISOString(),
    })

    // Verificar se a igreja pertence à supervisão
    const isAuthorized = await verifyChurch(id, sessionUser.id)
    if (!isAuthorized) {
      console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_UNAUTHORIZED]', {
        supervisorId: sessionUser.id,
        churchId: id,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Igreja não encontrada ou não pertence a esta supervisão.' },
        { status: 403 },
      )
    }

    // Buscar configurações de notificação da igreja
    const settings = await db
      .select()
      .from(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, id))

    // Se não há configurações, retornar valores padrão
    const defaultSettings = {
      payment_notifications: { email: false, whatsapp: false },
      due_date_reminders: { email: false, whatsapp: false },
      network_reports: { email: false, whatsapp: false },
    }

    if (settings.length === 0) {
      return NextResponse.json(defaultSettings)
    }

    // Converter configurações do banco para o formato esperado
    type NotificationSettings = {
      payment_notifications: { email: boolean; whatsapp: boolean }
      due_date_reminders: { email: boolean; whatsapp: boolean }
      network_reports: { email: boolean; whatsapp: boolean }
    }
    const formattedSettings = settings.reduce((acc, setting) => {
      const type = setting.notificationType as keyof NotificationSettings
      if (!acc[type]) {
        acc[type] = { email: false, whatsapp: false }
      }
      acc[type].email = setting.email
      acc[type].whatsapp = setting.whatsapp
      return acc
    }, {} as NotificationSettings)

    return NextResponse.json({ ...defaultSettings, ...formattedSettings })
  } catch (error) {
    console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_GET_ERROR]', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    // Rate limiting: 30 requests per minute for updates
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit(
      'supervisor-church-notification-settings-update',
      ip,
      30,
      60,
    )
    if (!rateLimitResult.allowed) {
      console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_UPDATE_RATE_LIMIT]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const params = await props.params

    // Primeiro tenta autenticação JWT (usuário logado via web)
    const { user: sessionUser } = await validateRequest()

    if (!sessionUser) {
      // Se não há usuário logado, tenta autenticação por API Key
      const authResponse = await authenticateApiKey()
      if (authResponse) return authResponse

      // Se nem JWT nem API Key funcionaram, retorna 401
      console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_UPDATE_AUTH_ERROR]', {
        ip,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    // Verifica se o usuário tem a role correta
    if (sessionUser.role !== 'supervisor') {
      console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_UPDATE_ROLE_ERROR]', {
        userId: sessionUser.id,
        role: sessionUser.role,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Acesso negado. Role supervisor necessária.' },
        { status: 403 },
      )
    }

    const { id } = params

    console.log('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_PUT]', {
      supervisorId: sessionUser.id,
      churchId: id,
      timestamp: new Date().toISOString(),
    })

    // Verificar se a igreja pertence à supervisão
    const isAuthorized = await verifyChurch(id, sessionUser.id)
    if (!isAuthorized) {
      console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_UPDATE_UNAUTHORIZED]', {
        supervisorId: sessionUser.id,
        churchId: id,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Igreja não encontrada ou não pertence a esta supervisão.' },
        { status: 403 },
      )
    }
    const body = await request.json()

    // Validar dados de entrada
    const validatedSettings = notificationSettingsSchema.parse(body)

    // Primeiro, deletar configurações existentes
    await db.delete(userNotificationSettings).where(eq(userNotificationSettings.userId, id))

    // Inserir novas configurações
    type NotificationType = 'payment_notifications' | 'due_date_reminders' | 'network_reports'
    type ChannelSettings = { email: boolean; whatsapp: boolean }
    const settingsToInsert: Array<{
      userId: string
      notificationType: NotificationType
      email: boolean
      whatsapp: boolean
    }> = []
    for (const [type, channels] of Object.entries(validatedSettings)) {
      const typedChannels = channels as ChannelSettings
      settingsToInsert.push({
        userId: id,
        notificationType: type as NotificationType,
        email: typedChannels.email,
        whatsapp: typedChannels.whatsapp,
      })
    }

    if (settingsToInsert.length > 0) {
      await db.insert(userNotificationSettings).values(settingsToInsert)
    }

    return NextResponse.json({
      message: 'Configurações de notificação atualizadas com sucesso.',
      settings: validatedSettings,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_UPDATE_VALIDATION_ERROR]', {
        errors: error.errors,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }

    console.error('[SUPERVISOR_CHURCH_NOTIFICATION_SETTINGS_UPDATE_ERROR]', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
