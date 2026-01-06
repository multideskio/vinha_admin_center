/**
 * @fileoverview API para verificar status do perfil do manager.
 * @version 1.1
 * @date 2024-08-07
 * @author PH
 * @lastReview 2025-01-05 22:00
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { managerProfiles } from '@/db/schema'
import { validateRequest } from '@/lib/jwt'
import { eq } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: Request) {
  try {
    // Rate limiting
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('manager-profile-status', ip, 30, 60) // 30 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const { user } = await validateRequest()

    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [profile] = await db
      .select()
      .from(managerProfiles)
      .where(eq(managerProfiles.userId, user.id))
      .limit(1)

    if (!profile) {
      return NextResponse.json({ complete: false })
    }

    const complete = !!(
      profile.firstName &&
      profile.lastName &&
      profile.cpf &&
      profile.cep &&
      profile.state &&
      profile.city &&
      profile.address
    )

    return NextResponse.json({ complete })
  } catch (error) {
    // Structured logging instead of console.error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[MANAGER_PROFILE_STATUS_ERROR]', {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ complete: false })
  }
}
