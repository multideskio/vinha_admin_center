import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { rateLimit } from '@/lib/rate-limit'
import { env } from '@/lib/env'
import { getCache, setCache } from '@/lib/cache'

// @lastReview 2025-01-05 21:45

const COMPANY_ID = env.COMPANY_INIT

/** TTL de 15 minutos — métodos de pagamento mudam quase nunca */
const PAYMENT_METHODS_CACHE_TTL = 900

export async function GET(request: Request) {
  try {
    // Rate limiting: 30 requests per minute for GET
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('payment-methods-get', ip, 30, 60) // 30 requests per minute
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    const cacheKey = `payment-methods:${COMPANY_ID}`
    const cached = await getCache<{ methods: string[] }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

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
      const response = { methods: [] as string[] }
      await setCache(cacheKey, response, PAYMENT_METHODS_CACHE_TTL)
      return NextResponse.json(response)
    }

    const methods = config.acceptedPaymentMethods
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)

    const response = { methods }
    await setCache(cacheKey, response, PAYMENT_METHODS_CACHE_TTL)
    return NextResponse.json(response)
  } catch (error) {
    console.error('[PAYMENT_METHODS_GET_ERROR]', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json({ methods: [] })
  }
}
