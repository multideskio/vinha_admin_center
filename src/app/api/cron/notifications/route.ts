/**
 * @fileoverview Cron job para processar notificações automáticas
 */

import { NextRequest, NextResponse } from 'next/server'
import { runNotificationScheduler } from '@/lib/notification-scheduler'

export async function GET(request: NextRequest) {
  try {
    // Verificar se é uma requisição autorizada (pode implementar auth aqui)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await runNotificationScheduler()

    return NextResponse.json({
      success: true,
      message: 'Notification scheduler executed successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}