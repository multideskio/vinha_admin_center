import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { notificationLogs } from '@/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

const COMPANY_ID = process.env.COMPANY_INIT
if (!COMPANY_ID) {
  throw new Error('COMPANY_INIT é obrigatório')
}

// Type assertion para garantir que COMPANY_ID não é undefined após a validação
const companyId: string = COMPANY_ID

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channel = searchParams.get('channel')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = db
      .select()
      .from(notificationLogs)
      .where(eq(notificationLogs.companyId, companyId))
      .$dynamic()

    if (channel) {
      query = query.where(
        and(eq(notificationLogs.companyId, companyId), eq(notificationLogs.channel, channel)),
      )
    }

    const logs = await query.orderBy(desc(notificationLogs.sentAt)).limit(limit).offset(offset)

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notificationLogs)
      .where(
        channel
          ? and(eq(notificationLogs.companyId, companyId), eq(notificationLogs.channel, channel))
          : eq(notificationLogs.companyId, companyId),
      )

    return NextResponse.json({ logs, total: countResult[0]?.count || 0 })
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
