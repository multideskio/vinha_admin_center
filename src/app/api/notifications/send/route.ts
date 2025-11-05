/**
 * @fileoverview API para envio manual de notificações
 */

import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notifications'
import { db } from '@/db/drizzle'
import { otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const sendNotificationSchema = z.object({
  type: z.enum(['welcome', 'payment_reminder']),
  companyId: z.string().uuid(),
  recipient: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
  data: z.object({
    churchName: z.string().optional(),
    amount: z.string().optional(),
    dueDate: z.string().optional(),
    paymentLink: z.string().url().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, companyId, recipient, data } = sendNotificationSchema.parse(body)

    // Buscar configurações da empresa
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, companyId))
      .limit(1)

    if (!settings) {
      return NextResponse.json(
        { error: 'Company settings not found' },
        { status: 404 }
      )
    }

    const notificationService = new NotificationService({
      companyId,
      whatsappApiUrl: settings.whatsappApiUrl || undefined,
      whatsappApiKey: settings.whatsappApiKey || undefined,
      whatsappApiInstance: settings.whatsappApiInstance || undefined,
      sesRegion: 'us-east-1', // ✅ CORRIGIDO: SES region fixa
      sesAccessKeyId: settings.smtpUser || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
      sesSecretAccessKey: settings.smtpPass || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
      fromEmail: settings.smtpFrom || undefined,
    })

    let result: { whatsapp: boolean; email: boolean }

    switch (type) {
      case 'welcome':
        result = await notificationService.sendWelcome(
          'temp-user-id', // TODO: Get actual user ID
          recipient.name,
          data?.churchName || 'Nossa Igreja',
          recipient.phone,
          recipient.email
        )
        break

      case 'payment_reminder':
        if (!data?.amount || !data?.dueDate) {
          return NextResponse.json(
            { error: 'Amount and dueDate are required for payment reminders' },
            { status: 400 }
          )
        }
        
        result = await notificationService.sendPaymentReminder(
          'temp-user-id', // TODO: Get actual user ID
          recipient.name,
          data.amount,
          data.dueDate,
          recipient.phone,
          recipient.email,
          data.paymentLink
        )
        break

      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      results: result,
      message: 'Notifications sent successfully',
    })

  } catch (error) {
    console.error('Notification send error:', error)
    
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