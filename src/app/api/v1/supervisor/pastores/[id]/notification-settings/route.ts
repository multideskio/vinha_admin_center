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

export async function GET(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  
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
    return NextResponse.json({ error: 'Acesso negado. Role supervisor necessária.' }, { status: 403 })
  }

  const { id } = params

  try {
    // Verificar se o pastor existe
    const pastor = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    if (pastor.length === 0) {
      return NextResponse.json({ error: 'Pastor não encontrado.' }, { status: 404 })
    }

    // Buscar configurações de notificação do pastor
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
    const formattedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.notificationType]) {
        acc[setting.notificationType] = { email: false, whatsapp: false }
      }
      acc[setting.notificationType].email = setting.email
      acc[setting.notificationType].whatsapp = setting.whatsapp
      return acc
    }, {} as any)

    return NextResponse.json({ ...defaultSettings, ...formattedSettings })
  } catch (error) {
    console.error('Erro ao buscar configurações de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const params = await props.params;
  
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
    return NextResponse.json({ error: 'Acesso negado. Role supervisor necessária.' }, { status: 403 })
  }

  const { id } = params

  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validatedSettings = notificationSettingsSchema.parse(body)

    // Primeiro, deletar configurações existentes
    await db
      .delete(userNotificationSettings)
      .where(eq(userNotificationSettings.userId, id))

    // Inserir novas configurações
    const settingsToInsert = []
    for (const [type, channels] of Object.entries(validatedSettings)) {
      settingsToInsert.push({
        userId: id,
        notificationType: type as any,
        email: (channels as any).email,
        whatsapp: (channels as any).whatsapp,
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
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar configurações de notificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}