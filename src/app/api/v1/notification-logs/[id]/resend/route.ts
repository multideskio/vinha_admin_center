import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { sql } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { NotificationService } from '@/lib/notifications'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Validar autenticação
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: logId } = await params
    if (!logId) {
      return NextResponse.json({ error: 'ID do log é obrigatório' }, { status: 400 })
    }

    // Buscar o log original
    const logResult = await db.execute(sql`
      SELECT 
        nl.*,
        u.email as user_email,
        u.phone as user_phone,
        CASE 
          WHEN ap.first_name IS NOT NULL THEN ap.first_name || ' ' || ap.last_name
          WHEN mp.first_name IS NOT NULL THEN mp.first_name || ' ' || mp.last_name
          WHEN sp.first_name IS NOT NULL THEN sp.first_name || ' ' || sp.last_name
          WHEN pp.first_name IS NOT NULL THEN pp.first_name || ' ' || pp.last_name
          WHEN cp.nome_fantasia IS NOT NULL THEN cp.nome_fantasia
          WHEN u.email IS NOT NULL THEN split_part(u.email, '@', 1)
          ELSE 'N/A'
        END as user_name
      FROM notification_logs nl
      LEFT JOIN users u ON nl.user_id = u.id
      LEFT JOIN admin_profiles ap ON u.id = ap.user_id
      LEFT JOIN manager_profiles mp ON u.id = mp.user_id
      LEFT JOIN supervisor_profiles sp ON u.id = sp.user_id
      LEFT JOIN pastor_profiles pp ON u.id = pp.user_id
      LEFT JOIN church_profiles cp ON u.id = cp.user_id
      WHERE nl.id = ${logId} AND nl.company_id = ${user.companyId}
    `)

    if (logResult.rows.length === 0) {
      return NextResponse.json({ error: 'Log não encontrado' }, { status: 404 })
    }

    interface NotificationLogRow {
      user_id: string
      user_email: string
      user_phone: string
      channel: string
      subject: string
      message_content: string
      recipient: string
    }

    const log = logResult.rows[0] as unknown as NotificationLogRow
    let success = false
    let errorMessage = ''
    let messageContent = ''
    let subject = ''

    try {
      // Criar instância do NotificationService buscando configurações do banco
      const notificationService = await NotificationService.createFromDatabase(user.companyId)

      // Usar o conteúdo original do log ao invés de gerar novo
      messageContent = log.message_content || 'Conteúdo não disponível'
      subject = log.subject || 'Lembrete de Dízimo'

      if (log.channel === 'email') {
        // Reenviar email usando o conteúdo original
        const emailResult = await notificationService.sendEmail({
          to: log.user_email,
          subject: subject,
          html: messageContent.replace(/\n/g, '<br>'),
        })
        success = emailResult
        if (!success) {
          throw new Error('Falha no envio do email')
        }
      } else if (log.channel === 'whatsapp') {
        // Reenviar WhatsApp usando o conteúdo original
        const whatsappResult = await notificationService.sendWhatsApp({
          phone: log.user_phone,
          message: messageContent,
        })
        success = whatsappResult
        if (!success) {
          throw new Error('Falha no envio do WhatsApp')
        }
      } else {
        throw new Error(`Canal não suportado: ${log.channel}`)
      }
    } catch (error) {
      success = false
      errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      messageContent = `Erro ao reenviar: ${errorMessage}`
    }

    // Criar novo log do reenvio com notification_type limitado a 50 chars
    const newLogId = crypto.randomUUID()

    // Gerar notification_type curto para evitar limite de 50 chars - usar apenas 'resend' + canal
    const newNotificationType = `resend_${log.channel}`.substring(0, 50)

    await db.execute(sql`
      INSERT INTO notification_logs (
        id, company_id, user_id, notification_type, channel, status, 
        recipient, subject, message_content, error_message, sent_at
      ) VALUES (
        ${newLogId}, ${user.companyId}, ${log.user_id}, 
        ${newNotificationType}, ${log.channel}, 
        ${success ? 'sent' : 'failed'}, ${log.recipient || log.user_email || log.user_phone}, 
        ${subject || log.subject}, ${messageContent}, 
        ${success ? null : errorMessage}, NOW()
      )
    `)

    return NextResponse.json({
      success,
      message: success
        ? `Notificação reenviada com sucesso via ${log.channel}`
        : `Falha ao reenviar: ${errorMessage}`,
      newLogId,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao reenviar notificação:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Erro ao reenviar notificação', details: errorMessage },
      { status: 500 },
    )
  }
}
