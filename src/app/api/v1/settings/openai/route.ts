import { NextRequest, NextResponse } from 'next/server'
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
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const { openaiApiKey } = await request.json()
    if (typeof openaiApiKey !== 'string') {
      return NextResponse.json({ error: 'openaiApiKey inválida' }, { status: 400 })
    }
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
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
