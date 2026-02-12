import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, passwordResetTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'
import { addHours } from 'date-fns'
import { createPasswordResetEmail } from '@/lib/email-templates'
import { EmailService } from '@/lib/notifications'
import { otherSettings } from '@/db/schema'
import { rateLimit, rateLimitPresets, getClientIP } from '@/lib/rate-limiter'
import { z } from 'zod'
import { env } from '@/lib/env'

// Schema Zod para validação do forgot-password
const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(
      `forgot-password:${clientIP}`,
      rateLimitPresets.forgotPassword,
    )

    if (!rateLimitResult.allowed) {
      const resetInMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${resetInMinutes} minutos.` },
        { status: 429 },
      )
    }

    const body = await request.json()

    // ✅ Validação Zod do payload
    const parseResult = forgotPasswordSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parseResult.error.errors },
        { status: 400 },
      )
    }

    const { email } = parseResult.data

    // Busca usuário
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) {
      // Retorna OK para não expor se email existe
      return NextResponse.json({ success: true })
    }

    // Verificar se o usuário está bloqueado - não enviar email de reset
    if (user.blockedAt) {
      // Retorna OK para não expor que a conta está bloqueada
      return NextResponse.json({ success: true })
    }

    // Apaga tokens anteriores não usados desse usuário (segurança)
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))

    // Gera token seguro
    const token = randomBytes(32).toString('hex')
    const expiresAt = addHours(new Date(), 24)
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    })
    // Busca settings da empresa
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, user.companyId))
      .limit(1)
    if (!settings)
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 500 })

    // ✅ CORRIGIDO: Usar URL validada via env.ts
    const host = env.NEXT_PUBLIC_APP_URL

    if (!host) {
      console.error('[FORGOT_PASSWORD] NEXT_PUBLIC_APP_URL não configurada no .env')
      return NextResponse.json({ error: 'Configuração do sistema inválida' }, { status: 500 })
    }

    const resetLink = `https://${host}/auth/redefinir-senha/${token}`
    const html = createPasswordResetEmail({
      companyName: settings.smtpFrom || 'Equipe Vinha',
      userName: user.email,
      resetLink,
    })
    const emailService = new EmailService({
      companyId: 'system', // Para operações do sistema
      sesRegion: 'us-east-1', // ✅ CORRIGIDO: SES region fixa
      sesAccessKeyId: settings.smtpUser || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
      sesSecretAccessKey: settings.smtpPass || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
      fromEmail: settings.smtpFrom || undefined,
      // SMTP config
      smtpHost: settings.smtpHost || undefined,
      smtpPort: settings.smtpPort || undefined,
      smtpUser: settings.smtpUser || undefined,
      smtpPass: settings.smtpPass || undefined,
      smtpFrom: settings.smtpFrom || undefined,
    })
    await emailService.sendEmail({
      to: user.email,
      subject: 'Redefinir senha - Vinha',
      html,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro em forgot-password:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
