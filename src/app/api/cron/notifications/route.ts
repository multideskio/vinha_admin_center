/**
 * @fileoverview Cron job para processar notificações automáticas
 */

import { NextRequest, NextResponse } from 'next/server'
import { runNotificationScheduler } from '@/lib/notification-scheduler'
import { timingSafeEqual } from 'crypto'
import { env } from '@/lib/env'
import { redis } from '@/lib/redis'

const LOCK_KEY = 'cron:scheduler:lock'
const LOCK_TTL_SECONDS = 120

export async function GET(request: NextRequest) {
  try {
    // ✅ CORRIGIDO: Validar CRON_SECRET via env.ts centralizado
    const CRON_SECRET = env.CRON_SECRET
    if (!CRON_SECRET) {
      console.error('[CRON] CRON_SECRET não configurado')
      return NextResponse.json({ error: 'Configuração do servidor inválida' }, { status: 500 })
    }

    // ✅ CORRIGIDO: Verificar autenticação com timing-safe comparison
    const authHeader = request.headers.get('authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // ✅ CORRIGIDO: Usar timingSafeEqual para prevenir timing attacks
    const expectedToken = Buffer.from(CRON_SECRET)
    const receivedToken = Buffer.from(token)

    if (
      expectedToken.length !== receivedToken.length ||
      !timingSafeEqual(expectedToken, receivedToken)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ CORRIGIDO: Distributed lock via Redis para prevenir execução paralela
    if (redis) {
      const lockAcquired = await redis.set(
        LOCK_KEY,
        Date.now().toString(),
        'EX',
        LOCK_TTL_SECONDS,
        'NX',
      )
      if (!lockAcquired) {
        return NextResponse.json({
          success: true,
          message: 'Cron já em execução por outra instância',
          skipped: true,
        })
      }
    }

    try {
      await runNotificationScheduler()

      return NextResponse.json({
        success: true,
        message: 'Notification scheduler executed successfully',
        timestamp: new Date().toISOString(),
      })
    } finally {
      // Liberar lock após execução (mesmo em caso de erro)
      if (redis) {
        await redis.del(LOCK_KEY).catch((err: Error) => {
          console.error('[CRON] Erro ao liberar lock:', err.message)
        })
      }
    }
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
