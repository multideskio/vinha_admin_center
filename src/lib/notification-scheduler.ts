/**
 * @fileoverview Agendador de notificações automáticas
 */

import { db } from '@/db/drizzle'
import { users, otherSettings, userNotificationSettings } from '@/db/schema'
import { NotificationService } from './notifications'
import { eq, and, isNull, lte } from 'drizzle-orm'
import { addDays, format } from 'date-fns'

export class NotificationScheduler {
  async processWelcomeNotifications(): Promise<void> {
    try {
      // Buscar usuários criados nas últimas 24h que ainda não receberam boas-vindas
      const newUsers = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          companyId: users.companyId,
          createdAt: users.createdAt,
          welcomeSent: users.welcomeSent,
        })
        .from(users)
        .where(
          and(
            lte(users.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
            isNull(users.deletedAt)
          )
        )

      for (const user of newUsers) {
        await this.sendWelcomeNotification(user)
      }
    } catch (error) {
      console.error('Error processing welcome notifications:', error)
    }
  }

  async processPaymentReminders(): Promise<void> {
    try {
      const today = new Date()
      const currentDay = today.getDate()

      // Buscar usuários com dia do dízimo próximo (3 dias antes)
      const usersToRemind = await db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          titheDay: users.titheDay,
          companyId: users.companyId,
        })
        .from(users)
        .where(
          and(
            eq(users.titheDay, currentDay + 3),
            isNull(users.deletedAt)
          )
        )

      for (const user of usersToRemind) {
        if (user.titheDay) {
          await this.sendPaymentReminder(user)
        }
      }
    } catch (error) {
      console.error('Error processing payment reminders:', error)
    }
  }

  private async sendWelcomeNotification(user: {
    id: string
    companyId: string
    email: string
    phone: string | null
    welcomeSent: boolean | null
  }): Promise<void> {
    try {
      const settings = await this.getCompanySettings(user.companyId)
      if (!settings) return

      const notificationService = new NotificationService({
        whatsappApiUrl: settings.whatsappApiUrl || undefined,
        whatsappApiKey: settings.whatsappApiKey || undefined,
        whatsappApiInstance: settings.whatsappApiInstance || undefined,
        sesRegion: settings.s3Region || undefined,
        sesAccessKeyId: settings.s3AccessKeyId || undefined,
        sesSecretAccessKey: settings.s3SecretAccessKey || undefined,
        fromEmail: settings.smtpFrom || undefined,
        companyId: user.companyId,
      })

      const userName = 'Membro'
      const churchName = 'Nossa Igreja'

      await notificationService.sendWelcome(
        user.id,
        userName,
        churchName,
        user.phone || undefined,
        user.email
      )
    } catch (error) {
      console.error(`Error sending welcome notification to user ${user.id}:`, error)
    }
  }

  private async sendPaymentReminder(user: {
    id: string
    companyId: string
    email: string
    phone: string | null
    titheDay: number | null
  }): Promise<void> {
    try {
      const settings = await this.getCompanySettings(user.companyId)
      if (!settings) return

      const notificationService = new NotificationService({
        whatsappApiUrl: settings.whatsappApiUrl || undefined,
        whatsappApiKey: settings.whatsappApiKey || undefined,
        whatsappApiInstance: settings.whatsappApiInstance || undefined,
        sesRegion: settings.s3Region || undefined,
        sesAccessKeyId: settings.s3AccessKeyId || undefined,
        sesSecretAccessKey: settings.s3SecretAccessKey || undefined,
        fromEmail: settings.smtpFrom || undefined,
        companyId: user.companyId,
      })

      const dueDate = format(addDays(new Date(), 3), 'dd/MM/yyyy')
      const userName = 'Membro'
      
      // Valor padrão ou buscar do histórico
      const amount = '100,00' // Implementar lógica para buscar valor real

      await notificationService.sendPaymentReminder(
        user.id,
        userName,
        amount,
        dueDate,
        user.phone || undefined,
        user.email
      )
    } catch (error) {
      console.error(`Error sending payment reminder to user ${user.id}:`, error)
    }
  }

  private async getCompanySettings(companyId: string) {
    try {
      const [settings] = await db
        .select()
        .from(otherSettings)
        .where(eq(otherSettings.companyId, companyId))
        .limit(1)

      return settings
    } catch (error) {
      console.error('Error fetching company settings:', error)
      return null
    }
  }

  // Método para verificar preferências do usuário
  private async getUserNotificationPreferences(userId: string) {
    try {
      const preferences = await db
        .select()
        .from(userNotificationSettings)
        .where(eq(userNotificationSettings.userId, userId))

      return preferences.reduce((acc, pref) => {
        acc[pref.notificationType] = {
          email: pref.email,
          whatsapp: pref.whatsapp,
        }
        return acc
      }, {} as Record<string, { email: boolean; whatsapp: boolean }>)
    } catch (error) {
      console.error('Error fetching user notification preferences:', error)
      return {}
    }
  }
}

// Função utilitária para executar o scheduler
export async function runNotificationScheduler(): Promise<void> {
  const scheduler = new NotificationScheduler()
  
  console.log('Running notification scheduler...')
  
  await Promise.all([
    scheduler.processWelcomeNotifications(),
    scheduler.processPaymentReminders(),
  ])
  
  console.log('Notification scheduler completed')
}