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

// ✅ CORRIGIDO: Lista de hosts permitidos para prevenir host header injection
const ALLOWED_HOSTS = [
  'vinha.com',
  'app.vinha.com',
  'www.vinha.com',
  'localhost:3000',
  'localhost:9002',
  '127.0.0.1:3000',
]

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(
      `forgot-password:${clientIP}`,
      rateLimitPresets.forgotPassword
    )
    
    if (!rateLimitResult.allowed) {
      const resetInMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { error: `Muitas tentativas. Tente novamente em ${resetInMinutes} minutos.` },
        { status: 429 }
      )
    }

    const { email } = await request.json()
    if (!email) return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })

    // Busca usuário
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user) {
      // Retorna OK para não expor se email existe
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
    const [settings] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, user.companyId)).limit(1)
    if (!settings) return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 500 })

    // ✅ CORRIGIDO: Preparar link com validação de host seguro
    let host = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    
    if (!host) {
      const requestHost = request.headers.get('host')
      
      // Validar se o host está na lista de permitidos
      if (requestHost && ALLOWED_HOSTS.includes(requestHost)) {
        host = requestHost
      } else {
        // Fallback seguro para domínio padrão
        host = 'app.vinha.com'
        console.warn(`[FORGOT_PASSWORD] Host não permitido: ${requestHost}. Usando fallback: ${host}`)
      }
    }

    const resetLink = `https://${host}/auth/redefinir-senha/${token}`
    const html = createPasswordResetEmail({
      companyName: settings.smtpFrom || 'Equipe Vinha',
      userName: user.email,
      resetLink,
    })
    const emailService = new EmailService({
      sesRegion: 'us-east-1', // ✅ CORRIGIDO: SES region fixa
      sesAccessKeyId: settings.smtpUser || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
      sesSecretAccessKey: settings.smtpPass || undefined, // ✅ CORRIGIDO: Usar credenciais SES, não S3
      fromEmail: settings.smtpFrom || undefined,
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
