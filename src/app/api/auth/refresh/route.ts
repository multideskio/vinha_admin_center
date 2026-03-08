/**
 * @fileoverview Endpoint para renovação de token JWT.
 * Renova o token se ainda válido e próximo de expirar.
 * Chamado automaticamente pelo middleware ou manualmente pelo frontend.
 */

import { NextRequest, NextResponse } from 'next/server'
import { refreshTokenIfNeeded } from '@/lib/jwt'
import { rateLimitSync, rateLimitPresets, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Rate limiting: 10 requests/minuto por IP
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimitSync(`auth-refresh:${clientIP}`, rateLimitPresets.api)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente mais tarde.' },
        { status: 429 },
      )
    }

    const newToken = await refreshTokenIfNeeded()

    if (newToken) {
      return NextResponse.json({ success: true, refreshed: true })
    }

    return NextResponse.json({ success: true, refreshed: false })
  } catch (error) {
    console.error('[AUTH_REFRESH] Erro:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro ao renovar token' }, { status: 500 })
  }
}
