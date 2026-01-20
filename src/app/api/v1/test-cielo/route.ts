import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { env } from '@/lib/env'

const COMPANY_ID = env.COMPANY_INIT

export async function GET() {
  try {
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
        companyId: COMPANY_ID,
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
      merchantIdLength: merchantId?.length || 0,
      merchantKeyLength: merchantKey?.length || 0,
      merchantIdPreview: merchantId?.substring(0, 8) + '...',
      acceptedMethods: config.acceptedPaymentMethods,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
