import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, passwordResetTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'
import { rateLimit, rateLimitPresets, getClientIP } from '@/lib/rate-limiter'
import { z } from 'zod'

// Schema Zod para validação do reset-password
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`reset-password:${clientIP}`, rateLimitPresets.resetPassword)

    if (!rateLimitResult.allowed) {
      const resetInMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${resetInMinutes} minutos.` },
        { status: 429 },
      )
    }

    const body = await request.json()

    // ✅ Validação Zod do payload
    const parseResult = resetPasswordSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parseResult.error.errors },
        { status: 400 },
      )
    }

    const { token, password } = parseResult.data

    const [reset] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(eq(passwordResetTokens.token, token), eq(passwordResetTokens.used, false)))
      .limit(1)
    if (!reset) return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
    if (new Date(reset.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 })
    }

    // Verificar se o usuário está bloqueado
    const [targetUser] = await db
      .select({ blockedAt: users.blockedAt })
      .from(users)
      .where(eq(users.id, reset.userId))
      .limit(1)

    if (targetUser?.blockedAt) {
      return NextResponse.json(
        { error: 'Sua conta foi bloqueada. Entre em contato com o administrador.' },
        { status: 403 },
      )
    }

    // Atualiza a senha
    const hashed = await bcrypt.hash(password, 10)
    await db.update(users).set({ password: hashed }).where(eq(users.id, reset.userId))
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, reset.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro em reset-password:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
