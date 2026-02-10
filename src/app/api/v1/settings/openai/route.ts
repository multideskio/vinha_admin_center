import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { z } from 'zod'

// Schema Zod para validação da chave OpenAI
const openaiSettingsSchema = z.object({
  openaiApiKey: z.string().min(1, 'Chave da OpenAI é obrigatória'),
})

export async function GET() {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)
    const masked = settings?.openaiApiKey ? settings.openaiApiKey.replace(/.(?=.{4})/g, '*') : ''
    return NextResponse.json({
      openaiApiKey: masked,
      hasKey: !!settings?.openaiApiKey,
      updatedAt: null,
    })
  } catch (e) {
    console.error('[OPENAI_SETTINGS_GET] Erro ao buscar configurações:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const body = await request.json()

    // ✅ Validação Zod do payload
    const parseResult = openaiSettingsSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parseResult.error.errors },
        { status: 400 },
      )
    }

    const { openaiApiKey } = parseResult.data

    const [existing] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)
    if (existing) {
      await db
        .update(otherSettings)
        .set({ openaiApiKey })
        .where(eq(otherSettings.companyId, user.companyId))
    } else {
      await db.insert(otherSettings).values({ companyId: user.companyId, openaiApiKey })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[OPENAI_SETTINGS_PUT] Erro ao atualizar configurações:', e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
