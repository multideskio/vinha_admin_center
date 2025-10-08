/**
 * @fileoverview Biblioteca de notificações para WhatsApp e Email
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { EvolutionSendTextRequest, EvolutionResponse } from './evolution-api-types'
import { TemplateEngine, TemplateVariables } from './template-engine'
import { db } from '@/db/drizzle'
import { messageTemplates, notificationLogs } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// Types
interface NotificationConfig {
  whatsappApiUrl?: string
  whatsappApiKey?: string
  whatsappApiInstance?: string
  sesRegion?: string
  sesAccessKeyId?: string
  sesSecretAccessKey?: string
  fromEmail?: string
}

interface WhatsAppMessage {
  number: string
  text: string
}

interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
}

// WhatsApp Service
export class WhatsAppService {
  constructor(private config: NotificationConfig) {}

  async sendMessage({ number, text }: WhatsAppMessage): Promise<boolean> {
    if (!this.config.whatsappApiUrl || !this.config.whatsappApiKey || !this.config.whatsappApiInstance) {
      console.warn('WhatsApp configuration missing')
      return false
    }

    try {
      const payload: EvolutionSendTextRequest = {
        number,
        text,
        delay: 1000,
        linkPreview: false,
      }

      const response = await fetch(
        `${this.config.whatsappApiUrl}/message/sendText/${this.config.whatsappApiInstance}`,
        {
          method: 'POST',
          headers: {
            'apikey': this.config.whatsappApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        console.error('WhatsApp API error:', response.status, response.statusText)
        return false
      }

      const data: EvolutionResponse = await response.json()
      return !!data.key?.id
    } catch (error) {
      console.error('WhatsApp send error:', error)
      return false
    }
  }
}

// Email Service
export class EmailService {
  private sesClient?: SESClient

  constructor(private config: NotificationConfig) {
    if (config.sesAccessKeyId && config.sesSecretAccessKey && config.sesRegion) {
      this.sesClient = new SESClient({
        region: config.sesRegion,
        credentials: {
          accessKeyId: config.sesAccessKeyId,
          secretAccessKey: config.sesSecretAccessKey,
        },
      })
    }
  }

  async sendEmail({ to, subject, html, text }: EmailMessage): Promise<boolean> {
    if (!this.sesClient || !this.config.fromEmail) {
      console.warn('Email configuration missing')
      return false
    }

    try {
      const command = new SendEmailCommand({
        Source: this.config.fromEmail,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject },
          Body: {
            Html: { Data: html },
            Text: text ? { Data: text } : undefined,
          },
        },
      })

      await this.sesClient.send(command)
      return true
    } catch (error) {
      console.error('Email send error:', error)
      return false
    }
  }
}

// Notification Templates
export const templates = {
  welcome: {
    whatsapp: (name: string, churchName: string) =>
      `🙏 Olá ${name}!\n\nSeja bem-vindo(a) à ${churchName}!\n\nEstamos felizes em tê-lo(a) conosco. Em breve você receberá mais informações sobre como contribuir e participar de nossas atividades.\n\nQue Deus abençoe! 🙌`,
    
    email: {
      subject: (churchName: string) => `Bem-vindo(a) à ${churchName}!`,
      html: (name: string, churchName: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">🙏 Bem-vindo(a), ${name}!</h2>
          <p>Estamos muito felizes em recebê-lo(a) na <strong>${churchName}</strong>!</p>
          <p>Em breve você receberá informações sobre:</p>
          <ul>
            <li>Como fazer suas contribuições</li>
            <li>Atividades e eventos</li>
            <li>Formas de participação</li>
          </ul>
          <p>Que Deus abençoe sua jornada conosco! 🙌</p>
          <hr style="margin: 20px 0;">
          <small style="color: #718096;">Esta é uma mensagem automática do sistema ${churchName}</small>
        </div>
      `,
    },
  },

  paymentReminder: {
    whatsapp: (name: string, amount: string, dueDate: string) =>
      `💰 Olá ${name}!\n\nLembramos que seu dízimo de R$ ${amount} vence em ${dueDate}.\n\nVocê pode realizar o pagamento através do nosso sistema online.\n\nObrigado pela sua fidelidade! 🙏`,
    
    email: {
      subject: 'Lembrete de Dízimo',
      html: (name: string, amount: string, dueDate: string, paymentLink?: string) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">💰 Lembrete de Dízimo</h2>
          <p>Olá ${name},</p>
          <p>Lembramos que seu dízimo de <strong>R$ ${amount}</strong> vence em <strong>${dueDate}</strong>.</p>
          ${paymentLink ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${paymentLink}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Pagar Agora
              </a>
            </div>
          ` : ''}
          <p>Obrigado pela sua fidelidade e contribuição! 🙏</p>
          <hr style="margin: 20px 0;">
          <small style="color: #718096;">Esta é uma mensagem automática do sistema</small>
        </div>
      `,
    },
  },
}

// Main Notification Service
export class NotificationService {
  private whatsapp: WhatsAppService
  private email: EmailService
  private companyId: string

  constructor(config: NotificationConfig & { companyId: string }) {
    this.whatsapp = new WhatsAppService(config)
    this.email = new EmailService(config)
    this.companyId = config.companyId
  }

  async sendWhatsApp({ phone, message }: { phone: string; message: string }): Promise<boolean> {
    return await this.whatsapp.sendMessage({ number: phone, text: message })
  }

  async sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
    return await this.email.sendEmail({ to, subject, html })
  }

  async sendWelcome(
    userId: string,
    name: string,
    churchName: string,
    phone?: string,
    email?: string
  ): Promise<{ whatsapp: boolean; email: boolean }> {
    const results = { whatsapp: false, email: false }
    const variables: TemplateVariables = { name, churchName }

    // Buscar templates personalizados
    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.companyId, this.companyId),
          eq(messageTemplates.templateType, 'welcome'),
          eq(messageTemplates.isActive, true)
        )
      )
      .limit(1)

    if (phone && template?.whatsappTemplate) {
      const message = TemplateEngine.processTemplate(template.whatsappTemplate, variables)
      results.whatsapp = await this.whatsapp.sendMessage({
        number: phone,
        text: message,
      })
      
      await this.logNotification(userId, 'welcome', 'whatsapp', results.whatsapp, message)
    }

    if (email && template?.emailSubjectTemplate && template?.emailHtmlTemplate) {
      const subject = TemplateEngine.processTemplate(template.emailSubjectTemplate, variables)
      const html = TemplateEngine.processTemplate(template.emailHtmlTemplate, variables)
      
      results.email = await this.email.sendEmail({
        to: email,
        subject,
        html,
      })
      
      await this.logNotification(userId, 'welcome', 'email', results.email, html)
    }

    return results
  }

  async sendPaymentReminder(
    userId: string,
    name: string,
    amount: string,
    dueDate: string,
    phone?: string,
    email?: string,
    paymentLink?: string
  ): Promise<{ whatsapp: boolean; email: boolean }> {
    const results = { whatsapp: false, email: false }
    const variables: TemplateVariables = { name, amount, dueDate, paymentLink }

    // Buscar templates personalizados
    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.companyId, this.companyId),
          eq(messageTemplates.templateType, 'payment_reminder'),
          eq(messageTemplates.isActive, true)
        )
      )
      .limit(1)

    if (phone && template?.whatsappTemplate) {
      const message = TemplateEngine.processTemplate(template.whatsappTemplate, variables)
      results.whatsapp = await this.whatsapp.sendMessage({
        number: phone,
        text: message,
      })
      
      await this.logNotification(userId, 'payment_reminder', 'whatsapp', results.whatsapp, message)
    }

    if (email && template?.emailSubjectTemplate && template?.emailHtmlTemplate) {
      const subject = TemplateEngine.processTemplate(template.emailSubjectTemplate, variables)
      const html = TemplateEngine.processTemplate(template.emailHtmlTemplate, variables)
      
      results.email = await this.email.sendEmail({
        to: email,
        subject,
        html,
      })
      
      await this.logNotification(userId, 'payment_reminder', 'email', results.email, html)
    }

    return results
  }

  private async logNotification(
    userId: string,
    type: string,
    channel: string,
    success: boolean,
    content: string,
    error?: string
  ): Promise<void> {
    try {
      await db.insert(notificationLogs).values({
        companyId: this.companyId,
        userId,
        notificationType: type,
        channel,
        status: success ? 'sent' : 'failed',
        messageContent: content,
        errorMessage: error,
      })
    } catch (logError) {
      console.error('Error logging notification:', logError)
    }
  }
}