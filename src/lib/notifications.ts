/**
 * @fileoverview Biblioteca de notificações para WhatsApp e Email
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { createTransport } from 'nodemailer'
import { EvolutionSendTextRequest, EvolutionResponse } from './evolution-api-types'
import { TemplateEngine, TemplateVariables } from './template-engine'
import { SmtpTransporter } from './types'
import { safeError } from './log-sanitizer'
import { db } from '@/db/drizzle'
import { messageTemplates, notificationLogs, emailBlacklist, otherSettings } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { configCache, CACHE_KEYS } from './config-cache'

// Types
interface NotificationConfig {
  companyId: string
  whatsappApiUrl?: string
  whatsappApiKey?: string
  whatsappApiInstance?: string
  sesRegion?: string
  sesAccessKeyId?: string
  sesSecretAccessKey?: string
  fromEmail?: string
  // SMTP config
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPass?: string
  smtpFrom?: string
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
    if (
      !this.config.whatsappApiUrl ||
      !this.config.whatsappApiKey ||
      !this.config.whatsappApiInstance
    ) {
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
            apikey: this.config.whatsappApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        safeError('[WHATSAPP_API_ERROR]', {
          status: response.status,
          statusText: response.statusText,
        })
        return false
      }

      const data: EvolutionResponse = await response.json()
      return !!data.key?.id
    } catch (error) {
      safeError('[WHATSAPP_SEND_ERROR]', error)
      return false
    }
  }
}

// Email Service
export class EmailService {
  private sesClient?: SESClient
  private smtpTransporter?: SmtpTransporter

  constructor(private config: NotificationConfig) {
    // Configurar SES se disponível
    if (config.sesAccessKeyId && config.sesSecretAccessKey && config.sesRegion) {
      this.sesClient = new SESClient({
        region: config.sesRegion,
        credentials: {
          accessKeyId: config.sesAccessKeyId,
          secretAccessKey: config.sesSecretAccessKey,
        },
      })
    }

    // Configurar SMTP se disponível E se não for credenciais AWS SES
    // AWS SES Access Keys começam com "AKIA" e têm 20 chars
    const isAwsSesCredentials =
      config.smtpUser?.startsWith('AKIA') && config.smtpUser?.length === 20

    if (
      config.smtpHost &&
      config.smtpPort &&
      config.smtpUser &&
      config.smtpPass &&
      !isAwsSesCredentials
    ) {
      this.smtpTransporter = createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465, // true para 465, false para outras portas
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      })
    } else if (isAwsSesCredentials) {
      // Se as credenciais SMTP são na verdade AWS SES, configurar SES
      if (config.smtpUser && config.smtpPass) {
        this.sesClient = new SESClient({
          region: 'us-east-1', // Região padrão para AWS SES
          credentials: {
            accessKeyId: config.smtpUser,
            secretAccessKey: config.smtpPass,
          },
        })
      }
    }
  }

  async sendEmail(
    { to, subject, html, text }: EmailMessage,
    companyId?: string,
  ): Promise<{ success: boolean; error?: string; errorCode?: string }> {
    // Verificar se temos alguma configuração de email
    if (!this.sesClient && !this.smtpTransporter) {
      return { success: false, error: 'Nenhuma configuração de email disponível (SES ou SMTP)' }
    }

    const fromEmail = this.config.fromEmail || this.config.smtpFrom
    if (!fromEmail) {
      return { success: false, error: 'Email de origem não configurado' }
    }

    // Verificar blacklist
    if (companyId) {
      const [blacklisted] = await db
        .select()
        .from(emailBlacklist)
        .where(
          and(
            eq(emailBlacklist.companyId, companyId),
            eq(emailBlacklist.email, to),
            eq(emailBlacklist.isActive, true),
          ),
        )
        .limit(1)

      if (blacklisted) {
        return {
          success: false,
          error: `Email bloqueado: ${blacklisted.reason}`,
          errorCode: 'BLACKLISTED',
        }
      }
    }

    try {
      // Tentar SES primeiro se disponível (mais confiável)
      if (this.sesClient) {
        const command = new SendEmailCommand({
          Source: fromEmail,
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
        return { success: true }
      }

      // Fallback para SMTP se SES não estiver disponível
      if (this.smtpTransporter) {
        await this.smtpTransporter.sendMail({
          from: fromEmail,
          to,
          subject,
          html,
          text,
        })
        return { success: true }
      }

      return { success: false, error: 'Nenhum método de envio disponível' }
    } catch (error: unknown) {
      const errorObj = error as { name?: string; Code?: string; message?: string; code?: string }
      const errorCode = errorObj.name || errorObj.Code || errorObj.code || 'UNKNOWN'
      const errorMessage = errorObj.message || String(error)

      // Log detalhado do erro para debug (sanitizado)
      safeError('[EMAIL_SEND_ERROR]', {
        to,
        subject,
        errorCode,
        errorMessage,
        hasSmtp: !!this.smtpTransporter,
        hasSes: !!this.sesClient,
      })

      // Se for erro de autenticação SMTP, não adicionar à blacklist
      if (errorCode === 'EAUTH' || errorMessage.includes('Authentication Credentials Invalid')) {
        return {
          success: false,
          error: 'Credenciais SMTP inválidas - verifique as configurações',
          errorCode: 'SMTP_AUTH_FAILED',
        }
      }

      // Adicionar à blacklist se for erro permanente
      if (companyId && this.shouldBlacklist(errorCode)) {
        await this.addToBlacklist(companyId, to, errorCode, errorMessage)
      }

      return { success: false, error: errorMessage, errorCode }
    }
  }

  private shouldBlacklist(errorCode: string): boolean {
    const permanentErrors = [
      'MessageRejected',
      'MailFromDomainNotVerified',
      'InvalidParameterValue',
      'AccountSendingPausedException',
    ]
    return (
      permanentErrors.includes(errorCode) ||
      errorCode.includes('Bounce') ||
      errorCode.includes('Complaint')
    )
  }

  private async addToBlacklist(
    companyId: string,
    email: string,
    errorCode: string,
    errorMessage: string,
  ) {
    try {
      const [existing] = await db
        .select()
        .from(emailBlacklist)
        .where(and(eq(emailBlacklist.companyId, companyId), eq(emailBlacklist.email, email)))
        .limit(1)

      if (existing) {
        await db
          .update(emailBlacklist)
          .set({
            lastAttemptAt: new Date(),
            attemptCount: existing.attemptCount + 1,
            errorCode,
            errorMessage,
            isActive: true,
          })
          .where(eq(emailBlacklist.id, existing.id))
      } else {
        await db.insert(emailBlacklist).values({
          companyId,
          email,
          reason: errorCode.includes('Bounce')
            ? 'bounce'
            : errorCode.includes('Complaint')
              ? 'complaint'
              : 'error',
          errorCode,
          errorMessage,
        })
      }
    } catch (error) {
      safeError('[BLACKLIST_ADD_ERROR]', error)
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
          ${
            paymentLink
              ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${paymentLink}" style="background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Pagar Agora
              </a>
            </div>
          `
              : ''
          }
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

  // Método estático para criar instância com configurações do banco
  static async createFromDatabase(companyId: string): Promise<NotificationService> {
    // ✅ Verificar cache primeiro
    const smtpCacheKey = CACHE_KEYS.SMTP_CONFIG(companyId)
    const whatsappCacheKey = CACHE_KEYS.WHATSAPP_CONFIG(companyId)

    let smtpConfig = configCache.get<{
      smtpHost?: string
      smtpPort?: number
      smtpUser?: string
      smtpPass?: string
      smtpFrom?: string
    }>(smtpCacheKey)

    let whatsappConfig = configCache.get<{
      whatsappApiUrl?: string
      whatsappApiKey?: string
      whatsappApiInstance?: string
    }>(whatsappCacheKey)

    // Se não estiver em cache, buscar do banco
    if (!smtpConfig || !whatsappConfig) {
      const [settings] = await db
        .select()
        .from(otherSettings)
        .where(eq(otherSettings.companyId, companyId))
        .limit(1)

      smtpConfig = {
        smtpHost: settings?.smtpHost || undefined,
        smtpPort: settings?.smtpPort || undefined,
        smtpUser: settings?.smtpUser || undefined,
        smtpPass: settings?.smtpPass || undefined,
        smtpFrom: settings?.smtpFrom || undefined,
      }

      whatsappConfig = {
        whatsappApiUrl: settings?.whatsappApiUrl || undefined,
        whatsappApiKey: settings?.whatsappApiKey || undefined,
        whatsappApiInstance: settings?.whatsappApiInstance || undefined,
      }

      // ✅ Armazenar no cache
      configCache.set(smtpCacheKey, smtpConfig)
      configCache.set(whatsappCacheKey, whatsappConfig)
    }

    const config: NotificationConfig & { companyId: string } = {
      companyId,
      // WhatsApp config (do cache)
      ...whatsappConfig,
      // SMTP config (do cache)
      ...smtpConfig,
      // SES config (fallback para variáveis de ambiente)
      sesRegion: process.env.AWS_SES_REGION,
      sesAccessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
      sesSecretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
      fromEmail: process.env.AWS_SES_FROM_EMAIL,
    }

    return new NotificationService(config)
  }

  async sendWhatsApp({ phone, message }: { phone: string; message: string }): Promise<boolean> {
    return await this.whatsapp.sendMessage({ number: phone, text: message })
  }

  async sendEmail({
    to,
    subject,
    html,
  }: {
    to: string
    subject: string
    html: string
  }): Promise<boolean> {
    const result = await this.email.sendEmail({ to, subject, html }, this.companyId)

    // Log detalhado para debug
    if (!result.success) {
      safeError('[NOTIFICATION_EMAIL_FAILED]', {
        to,
        subject,
        error: result.error,
        errorCode: result.errorCode,
      })
    }

    return result.success
  }

  async sendWelcome(
    userId: string,
    name: string,
    churchName: string,
    phone?: string,
    email?: string,
  ): Promise<{ whatsapp: boolean; email: boolean }> {
    const results = { whatsapp: false, email: false }
    const variables: TemplateVariables = {
      name,
      churchName,
      // aliases PT-BR
      nome_usuario: name,
      nome_igreja: churchName,
    }

    // Buscar templates personalizados
    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.companyId, this.companyId),
          eq(messageTemplates.templateType, 'welcome'),
          eq(messageTemplates.isActive, true),
        ),
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

      const emailResult = await this.email.sendEmail(
        {
          to: email,
          subject,
          html,
        },
        this.companyId,
      )
      results.email = emailResult.success

      await this.logNotification(
        userId,
        'welcome',
        'email',
        results.email,
        html,
        undefined,
        email,
        subject,
      )
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
    paymentLink?: string,
  ): Promise<{ whatsapp: boolean; email: boolean }> {
    const results = { whatsapp: false, email: false }
    const variables: TemplateVariables = {
      name,
      amount,
      dueDate,
      paymentLink,
      // aliases PT-BR
      nome_usuario: name,
      valor_transacao: amount,
      data_vencimento: dueDate,
      link_pagamento: paymentLink || '',
    }

    // Buscar templates personalizados
    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.companyId, this.companyId),
          eq(messageTemplates.templateType, 'payment_reminder'),
          eq(messageTemplates.isActive, true),
        ),
      )
      .limit(1)

    // WhatsApp
    if (phone) {
      let message: string
      if (template?.whatsappTemplate) {
        // Usar template personalizado
        message = TemplateEngine.processTemplate(template.whatsappTemplate, variables)
      } else {
        // Usar template padrão
        message = templates.paymentReminder.whatsapp(name, amount, dueDate)
      }

      results.whatsapp = await this.whatsapp.sendMessage({
        number: phone,
        text: message,
      })

      await this.logNotification(userId, 'payment_reminder', 'whatsapp', results.whatsapp, message)
    }

    // Email
    if (email) {
      let subject: string
      let html: string

      if (template?.emailSubjectTemplate && template?.emailHtmlTemplate) {
        // Usar template personalizado
        subject = TemplateEngine.processTemplate(template.emailSubjectTemplate, variables)
        html = TemplateEngine.processTemplate(template.emailHtmlTemplate, variables)
      } else {
        // Usar template padrão
        subject = templates.paymentReminder.email.subject
        html = templates.paymentReminder.email.html(name, amount, dueDate, paymentLink)
      }

      const emailResult = await this.email.sendEmail(
        {
          to: email,
          subject,
          html,
        },
        this.companyId,
      )
      results.email = emailResult.success

      await this.logNotification(
        userId,
        'payment_reminder',
        'email',
        results.email,
        html,
        undefined,
        email,
        subject,
      )
    }

    return results
  }

  async sendPaymentOverdue(
    userId: string,
    name: string,
    amount: string,
    dueDate: string,
    phone?: string,
    email?: string,
    paymentLink?: string,
  ): Promise<{ whatsapp: boolean; email: boolean }> {
    const results = { whatsapp: false, email: false }
    const variables: TemplateVariables = {
      name,
      amount,
      dueDate,
      paymentLink,
      // aliases PT-BR
      nome_usuario: name,
      valor_transacao: amount,
      data_vencimento: dueDate,
      link_pagamento: paymentLink || '',
    }

    // Buscar templates personalizados
    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.companyId, this.companyId),
          eq(messageTemplates.templateType, 'payment_overdue'),
          eq(messageTemplates.isActive, true),
        ),
      )
      .limit(1)

    // WhatsApp
    if (phone) {
      let message: string
      if (template?.whatsappTemplate) {
        // Usar template personalizado
        message = TemplateEngine.processTemplate(template.whatsappTemplate, variables)
      } else {
        // Usar template padrão (mesmo do reminder mas com texto de atraso)
        message = `🚨 Olá ${name}!\n\nSeu dízimo de R$ ${amount} estava previsto para ${dueDate} e está em atraso.\n\nPor favor, regularize sua situação o quanto antes.\n\nObrigado pela compreensão! 🙏`
      }

      results.whatsapp = await this.whatsapp.sendMessage({
        number: phone,
        text: message,
      })
      await this.logNotification(userId, 'payment_overdue', 'whatsapp', results.whatsapp, message)
    }

    // Email
    if (email) {
      let subject: string
      let html: string

      if (template?.emailSubjectTemplate && template?.emailHtmlTemplate) {
        // Usar template personalizado
        subject = TemplateEngine.processTemplate(template.emailSubjectTemplate, variables)
        html = TemplateEngine.processTemplate(template.emailHtmlTemplate, variables)
      } else {
        // Usar template padrão
        subject = 'Dízimo em Atraso'
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e53e3e;">🚨 Dízimo em Atraso</h2>
            <p>Olá ${name},</p>
            <p>Seu dízimo de <strong>R$ ${amount}</strong> estava previsto para <strong>${dueDate}</strong> e está em atraso.</p>
            ${
              paymentLink
                ? `
              <div style="text-align: center; margin: 20px 0;">
                <a href="${paymentLink}" style="background: #e53e3e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  Regularizar Agora
                </a>
              </div>
            `
                : ''
            }
            <p>Por favor, regularize sua situação o quanto antes.</p>
            <p>Obrigado pela compreensão! 🙏</p>
            <hr style="margin: 20px 0;">
            <small style="color: #718096;">Esta é uma mensagem automática do sistema</small>
          </div>
        `
      }

      const emailResult = await this.email.sendEmail({ to: email, subject, html }, this.companyId)
      results.email = emailResult.success
      await this.logNotification(
        userId,
        'payment_overdue',
        'email',
        results.email,
        html,
        undefined,
        email,
        subject,
      )
    }

    return results
  }

  async sendPaymentReceived(
    userId: string,
    name: string,
    amount: string,
    paidAt: string,
    phone?: string,
    email?: string,
  ): Promise<{ whatsapp: boolean; email: boolean }> {
    const results = { whatsapp: false, email: false }
    const variables: TemplateVariables = {
      name,
      amount,
      paidAt,
      // aliases PT-BR
      nome_usuario: name,
      valor_transacao: amount,
      data_pagamento: paidAt,
    }

    const [template] = await db
      .select()
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.companyId, this.companyId),
          eq(messageTemplates.templateType, 'payment_received'),
          eq(messageTemplates.isActive, true),
        ),
      )
      .limit(1)

    if (phone && template?.whatsappTemplate) {
      const message = TemplateEngine.processTemplate(template.whatsappTemplate, variables)
      results.whatsapp = await this.whatsapp.sendMessage({ number: phone, text: message })
      await this.logNotification(userId, 'payment_received', 'whatsapp', results.whatsapp, message)
    }

    if (email && template?.emailSubjectTemplate && template?.emailHtmlTemplate) {
      const subject = TemplateEngine.processTemplate(template.emailSubjectTemplate, variables)
      const html = TemplateEngine.processTemplate(template.emailHtmlTemplate, variables)
      const emailResult = await this.email.sendEmail({ to: email, subject, html }, this.companyId)
      results.email = emailResult.success
      await this.logNotification(
        userId,
        'payment_received',
        'email',
        results.email,
        html,
        undefined,
        email,
        subject,
      )
    }

    return results
  }

  private async logNotification(
    userId: string,
    type: string,
    channel: string,
    success: boolean,
    content: string,
    error?: string,
    recipient?: string,
    subject?: string,
  ): Promise<void> {
    try {
      await db.insert(notificationLogs).values({
        companyId: this.companyId,
        userId,
        notificationType: type,
        channel,
        status: success ? 'sent' : 'failed',
        recipient,
        subject,
        messageContent: content,
        errorMessage: error,
      })
    } catch (logError) {
      safeError('[NOTIFICATION_LOG_ERROR]', logError)
    }
  }
}
