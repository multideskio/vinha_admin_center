/**
 * @fileoverview API para verificar modo de manutenção do sistema
 * ✅ CORRIGIDO: Agora retorna campo maintenanceMode do banco de dados
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { companies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { env } from '@/lib/env'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 60 req/min por IP
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('maintenance-check', ip, 60, 60)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const companyId = env.COMPANY_INIT

    const [company] = await db
      .select({ maintenanceMode: companies.maintenanceMode })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1)

    return NextResponse.json({
      status: 'ok',
      maintenanceMode: company?.maintenanceMode || false,
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    })
  } catch (error) {
    console.error('Maintenance check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        maintenanceMode: false, // Fail-safe: permitir acesso em caso de erro
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
