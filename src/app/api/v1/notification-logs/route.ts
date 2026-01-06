import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { sql } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const companyId = user.companyId
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Query simples primeiro - apenas logs básicos
    const logsResult = await db.execute(sql`
      SELECT 
        id,
        user_id,
        notification_type,
        channel,
        status,
        recipient,
        subject,
        message_content,
        error_message,
        sent_at
      FROM notification_logs
      WHERE company_id = ${companyId}
      ORDER BY sent_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    // Contar total
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int as count
      FROM notification_logs
      WHERE company_id = ${companyId}
    `)

    // Estatísticas
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

    // Buscar dados dos usuários separadamente
    const userIds = [...new Set(logsResult.rows.map((row: any) => row.user_id))]
    const usersMap = new Map()

    // Buscar usuários um por vez para evitar problemas com arrays
    for (const userId of userIds) {
      try {
        const userResult = await db.execute(sql`
          SELECT id, email FROM users WHERE id = ${userId}
        `)
        if (userResult.rows.length > 0) {
          usersMap.set(userId, userResult.rows[0])
        }
      } catch (error) {
        console.error(`Erro ao buscar usuário ${userId}:`, error)
      }
    }

    // Processar resultados
    const logs = logsResult.rows.map((row: any) => {
      const userData = usersMap.get(row.user_id)
      return {
        id: row.id,
        userId: row.user_id,
        userEmail: userData?.email || 'N/A',
        userName: userData?.email ? userData.email.split('@')[0] : 'N/A',
        notificationType: row.notification_type,
        channel: row.channel,
        status: row.status,
        recipient: row.recipient || '',
        subject: row.subject || '',
        messageContent: row.message_content || '',
        errorMessage: row.error_message || '',
        createdAt: row.sent_at,
      }
    })

    const total = countResult.rows[0]?.count || 0
    const stats = statsResult.rows[0] || {
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
    console.error('Erro ao buscar logs:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Erro ao buscar logs', details: errorMessage },
      { status: 500 },
    )
  }
}
