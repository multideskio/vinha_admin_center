import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { env } from '@/lib/env'
import { validateRequest } from '@/lib/jwt'

const COMPANY_ID = env.COMPANY_INIT

export async function GET() {
  try {
    const { user } = await validateRequest()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const [config] = await db
      .select()
      .from(gatewayConfigurations)
      .where(
        and(
          eq(gatewayConfigurations.companyId, COMPANY_ID),
          eq(gatewayConfigurations.gatewayName, 'Cielo'),
        ),
      )
      .limit(1)

    if (!config) {
      return NextResponse.json({
        error: 'Cielo não configurada no banco',
      })
    }

    const merchantId =
      config.environment === 'production' ? config.prodClientId : config.devClientId
    const merchantKey =
      config.environment === 'production' ? config.prodClientSecret : config.devClientSecret

    return NextResponse.json({
      exists: true,
      isActive: config.isActive,
      environment: config.environment,
      hasMerchantId: !!merchantId,
      hasMerchantKey: !!merchantKey,
      acceptedMethods: config.acceptedPaymentMethods,
    })
  } catch (error) {
    console.error(
      '[TEST_CIELO_ERROR]',
      error instanceof Error ? error.message : 'Erro desconhecido',
    )
    return NextResponse.json(
      {
        error: 'Erro ao verificar configuração Cielo',
      },
      { status: 500 },
    )
  }
}
