import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, passwordResetTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'
import { rateLimit, rateLimitPresets, getClientIP } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(
      `reset-password:${clientIP}`,
      rateLimitPresets.resetPassword
    )
    
    if (!rateLimitResult.allowed) {
      const resetInMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${resetInMinutes} minutos.` },
        { status: 429 }
      )
    }

    const { token, password } = await request.json()
    if (!token || !password) return NextResponse.json({ error: 'Token e senha obrigatórios' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Senha muito curta' }, { status: 400 })

    const [reset] = await db.select().from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.token, token), eq(passwordResetTokens.used, false))).limit(1)
    if (!reset) return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    if (new Date(reset.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 })
    }

    // Atualiza a senha
    const hashed = await bcrypt.hash(password, 10)
    await db.update(users).set({ password: hashed }).where(eq(users.id, reset.userId))
    await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, reset.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro em reset-password:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
