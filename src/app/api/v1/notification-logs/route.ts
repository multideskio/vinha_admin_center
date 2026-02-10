import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { sql } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

interface NotificationLogRow {
  id: string
  user_id: string
  notification_type: string
  channel: string
  status: string
  recipient: string | null
  subject: string | null
  message_content: string | null
  error_message: string | null
  sent_at: string
}

interface CountRow {
  count: number
}

interface StatsRow {
  total: number
  sent: number
  failed: number
  email: number
  whatsapp: number
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const companyId = user.companyId
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Query com JOIN para evitar N+1 queries
    const logsResult = await db.execute(sql`
      SELECT 
        nl.id,
        nl.user_id,
        nl.notification_type,
        nl.channel,
        nl.status,
        nl.recipient,
        nl.subject,
        nl.message_content,
        nl.error_message,
        nl.sent_at,
        u.email as user_email
      FROM notification_logs nl
      LEFT JOIN users u ON u.id = nl.user_id
      WHERE nl.company_id = ${companyId}
      ORDER BY nl.sent_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int as count
      FROM notification_logs
      WHERE company_id = ${companyId}
    `)

    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END)::int as sent,
        COUNT(CASE WHEN status = 'failed' THEN 1 END)::int as failed,
        COUNT(CASE WHEN channel = 'email' THEN 1 END)::int as email,
        COUNT(CASE WHEN channel = 'whatsapp' THEN 1 END)::int as whatsapp
      FROM notification_logs
      WHERE company_id = ${companyId}
    `)

    const logs = (
      logsResult.rows as unknown as (NotificationLogRow & { user_email: string | null })[]
    ).map((row) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email || 'N/A',
      userName: row.user_email ? row.user_email.split('@')[0] : 'N/A',
      notificationType: row.notification_type,
      channel: row.channel,
      status: row.status,
      recipient: row.recipient || '',
      subject: row.subject || '',
      messageContent: row.message_content || '',
      errorMessage: row.error_message || '',
      createdAt: row.sent_at,
    }))

    const total = (countResult.rows[0] as CountRow | undefined)?.count || 0
    const stats = (statsResult.rows[0] as StatsRow | undefined) || {
      total: 0,
      sent: 0,
      failed: 0,
      email: 0,
      whatsapp: 0,
    }

    return NextResponse.json({
      logs,
      total,
      stats,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[NOTIFICATION_LOGS_ERROR]', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json({ error: 'Erro ao buscar logs de notificação' }, { status: 500 })
  }
}
