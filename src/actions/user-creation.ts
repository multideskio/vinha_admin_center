/**
 * @fileoverview Actions para criação de usuários com notificações automáticas
 */

import { db } from '@/db/drizzle'
import { users, otherSettings } from '@/db/schema'
import { NotificationService } from '@/lib/notifications'
import { eq } from 'drizzle-orm'

export async function createUserWithWelcome(userData: {
  companyId: string
  email: string
  password: string
  role: string
  phone?: string
  firstName?: string
  lastName?: string
  churchName?: string
}) {
  // Criar usuário
  const newUserResult = await db
    .insert(users)
    .values({
      companyId: userData.companyId,
      email: userData.email,
      password: userData.password,
      role: userData.role as any,
      phone: userData.phone,
      welcomeSent: false,
    })
    .returning()

  const newUser = newUserResult[0]
  
  if (!newUser) {
    throw new Error('Failed to create user')
  }

  // Enviar boas-vindas automaticamente
  await sendWelcomeNotification(newUser.id, {
    name: userData.firstName && userData.lastName 
      ? `${userData.firstName} ${userData.lastName}` 
      : 'Novo Membro',
    churchName: userData.churchName || 'Nossa Igreja',
    email: userData.email,
    phone: userData.phone,
  })

  return newUser
}

export async function sendWelcomeNotification(
  userId: string,
  data: {
    name: string
    churchName: string
    email: string
    phone?: string
  }
) {
  try {
    // Buscar dados do usuário
    const [user] = await db
      .select({
        id: users.id,
        companyId: users.companyId,
        welcomeSent: users.welcomeSent,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user || user.welcomeSent) {
      return { success: false, reason: 'User not found or welcome already sent' }
    }

    // Buscar configurações da empresa
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)

    if (!settings) {
      return { success: false, reason: 'Company settings not found' }
    }

    // Criar serviço de notificação
    const notificationService = new NotificationService({
      companyId: user.companyId,
      whatsappApiUrl: settings.whatsappApiUrl || undefined,
      whatsappApiKey: settings.whatsappApiKey || undefined,
      whatsappApiInstance: settings.whatsappApiInstance || undefined,
      sesRegion: settings.s3Region || undefined,
      sesAccessKeyId: settings.s3AccessKeyId || undefined,
      sesSecretAccessKey: settings.s3SecretAccessKey || undefined,
      fromEmail: settings.smtpFrom || undefined,
    })

    // Enviar boas-vindas
    const result = await notificationService.sendWelcome(
      userId,
      data.name,
      data.churchName,
      data.phone,
      data.email
    )

    // Marcar como enviado
    await db
      .update(users)
      .set({ welcomeSent: true })
      .where(eq(users.id, userId))

    return { success: true, result }
  } catch (error) {
    console.error('Error sending welcome notification:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return { success: false, error: errorMessage }
  }
}