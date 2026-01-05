import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

const COMPANY_ID = process.env.COMPANY_INIT || ''

export async function GET() {
  try {
    const [config] = await db
      .select()
      .from(gatewayConfigurations)
      .where(
        and(
          eq(gatewayConfigurations.companyId, COMPANY_ID),
          eq(gatewayConfigurations.gatewayName, 'Cielo'),
          eq(gatewayConfigurations.isActive, true),
        ),
      )
      .limit(1)

    if (!config || !config.acceptedPaymentMethods) {
      return NextResponse.json({ methods: [] })
    }

    const methods = config.acceptedPaymentMethods
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)

    return NextResponse.json({ methods })
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json({ methods: [] })
  }
}
