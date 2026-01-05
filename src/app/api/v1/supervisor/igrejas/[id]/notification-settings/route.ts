import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users, userNotificationSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { authenticateApiKey } from '@/lib/api-auth'
import { validateRequest } from '@/lib/jwt'
import { z } from 'zod'

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
  const params = await props.params

  // Primeiro tenta autenticação JWT (usuário logado via web)
  const { user: sessionUser } = await validateRequest()

  if (!sessionUser) {
    // Se não há usuário logado, tenta autenticação por API Key
    const authResponse = await authenticateApiKey()
    if (authResponse) return authResponse

    // Se nem JWT nem API Key funcionaram, retorna 401
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // Verifica se o usuário tem a role correta
  if (sessionUser.role !== 'supervisor') {
    return NextResponse.json(
      { error: 'Acesso negado. Role supervisor necessária.' },
      { status: 403 },
    )
  }

  const { id } = params

  try {
    // Verificar se a igreja existe
    const church = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)

    if (church.length === 0) {
      return NextResponse.json({ error: 'Igreja não encontrada.' }, { status: 404 })
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
    console.error('Erro ao buscar configurações de notificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const params = await props.params

  // Primeiro tenta autenticação JWT (usuário logado via web)
  const { user: sessionUser } = await validateRequest()

  if (!sessionUser) {
    // Se não há usuário logado, tenta autenticação por API Key
    const authResponse = await authenticateApiKey()
    if (authResponse) return authResponse

    // Se nem JWT nem API Key funcionaram, retorna 401
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  // Verifica se o usuário tem a role correta
  if (sessionUser.role !== 'supervisor') {
    return NextResponse.json(
      { error: 'Acesso negado. Role supervisor necessária.' },
      { status: 403 },
    )
  }

  const { id } = params

  try {
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
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }

    console.error('Erro ao atualizar configurações de notificação:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
