/**
 * @fileoverview Cron job para processar notificações automáticas
 */

import { NextRequest, NextResponse } from 'next/server'
import { runNotificationScheduler } from '@/lib/notification-scheduler'
import { timingSafeEqual } from 'crypto'

// ✅ CORRIGIDO: Validar CRON_SECRET no início
const CRON_SECRET = process.env.CRON_SECRET
if (!CRON_SECRET) {
  throw new Error('CRON_SECRET environment variable is required')
}

export async function GET(request: NextRequest) {
  try {
    // ✅ CORRIGIDO: Verificar autenticação com timing-safe comparison
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // ✅ CORRIGIDO: Usar timingSafeEqual para prevenir timing attacks
    const expectedToken = Buffer.from(CRON_SECRET)
    const receivedToken = Buffer.from(token)

    if (expectedToken.length !== receivedToken.length || 
        !timingSafeEqual(expectedToken, receivedToken)) {
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