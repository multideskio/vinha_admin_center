import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { passwordResetTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 })

    const [reset] = await db.select().from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.token, token), eq(passwordResetTokens.used, false)))
      .limit(1)
    if (!reset) return NextResponse.json({ valid: false }, { status: 400 })
    if (new Date(reset.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }
    return NextResponse.json({ valid: true, userId: reset.userId })
  } catch (error) {
    console.error('Erro em verify-token:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
