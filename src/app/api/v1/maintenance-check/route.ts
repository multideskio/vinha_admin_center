/**
 * @fileoverview API para verificar modo de manutenção do sistema
 * ✅ CORRIGIDO: Agora retorna campo maintenanceMode do banco de dados
 */
import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { companies } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const companyId = process.env.COMPANY_INIT

    if (!companyId) {
      console.error('COMPANY_INIT environment variable not set')
      return NextResponse.json(
        {
          status: 'error',
          maintenanceMode: false, // Fail-safe: permitir acesso se não configurado
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

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
