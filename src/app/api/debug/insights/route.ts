import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET() {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    // Verificar configuração no banco
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)

    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      user: {
        id: user.id,
        role: user.role,
        companyId: user.companyId,
      },
      database: {
        hasSettings: !!settings,
        settingsId: settings?.id,
        hasOpenAIKey: !!settings?.openaiApiKey,
        openAIKeyLength: settings?.openaiApiKey?.length || 0,
        openAIKeyPrefix: settings?.openaiApiKey?.substring(0, 7) + '...' || 'N/A',
      },
      environment_vars: {
        DATABASE_URL: !!(process.env.POSTGRES_URL || process.env.DATABASE_URL),
        REDIS_URL: !!process.env.REDIS_URL,
        NODE_ENV: process.env.NODE_ENV,
      },
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('[DEBUG_INSIGHTS] Error:', error)
    return NextResponse.json({
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    })
  }
}
