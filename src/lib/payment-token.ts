/**
 * Sistema de tokens temporários para links de pagamento
 * Permite que usuários acessem a página de contribuição
 * diretamente via link (email/WhatsApp) sem precisar fazer login manual.
 */

import { randomBytes } from 'crypto'
import { db } from '@/db/drizzle'
import { paymentTokens, users } from '@/db/schema'
import { eq, lt } from 'drizzle-orm'
import { env } from '@/lib/env'

const TOKEN_EXPIRY_HOURS = 48
const TOKEN_LENGTH = 48 // 48 bytes = 64 chars em hex

interface GenerateTokenParams {
  userId: string
  companyId: string
}

interface TokenValidationResult {
  valid: boolean
  userId?: string
  companyId?: string
  error?: string
}

/**
 * Gera um token seguro e único para link de pagamento
 */
export async function generatePaymentToken({
  userId,
  companyId,
}: GenerateTokenParams): Promise<string> {
  const token = randomBytes(TOKEN_LENGTH).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

  await db.insert(paymentTokens).values({
    userId,
    companyId,
    token,
    expiresAt,
  })

  return token
}

/**
 * Valida um token de pagamento e retorna os dados do usuário
 */
export async function validatePaymentToken(token: string): Promise<TokenValidationResult> {
  if (!token || token.length < 10) {
    return { valid: false, error: 'Token inválido' }
  }

  const [record] = await db
    .select({
      id: paymentTokens.id,
      userId: paymentTokens.userId,
      companyId: paymentTokens.companyId,
      expiresAt: paymentTokens.expiresAt,
      usedAt: paymentTokens.usedAt,
    })
    .from(paymentTokens)
    .where(eq(paymentTokens.token, token))
    .limit(1)

  if (!record) {
    return { valid: false, error: 'Token não encontrado' }
  }

  if (new Date() > record.expiresAt) {
    return { valid: false, error: 'Token expirado' }
  }

  // Verificar se o usuário ainda existe e está ativo
  const [user] = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.id, record.userId))
    .limit(1)

  if (!user || user.status !== 'active') {
    return { valid: false, error: 'Usuário não encontrado ou inativo' }
  }

  // Marcar como usado (mas não invalida — pode ser reutilizado até expirar)
  if (!record.usedAt) {
    await db
      .update(paymentTokens)
      .set({ usedAt: new Date() })
      .where(eq(paymentTokens.id, record.id))
  }

  return {
    valid: true,
    userId: record.userId,
    companyId: record.companyId,
  }
}

/**
 * Gera a URL completa do link de pagamento com token
 */
export async function generatePaymentLink(userId: string, companyId: string): Promise<string> {
  const token = await generatePaymentToken({ userId, companyId })
  const baseUrl = env.NEXT_PUBLIC_APP_URL || ''
  return `${baseUrl}/contribuir?token=${token}`
}

/**
 * Limpa tokens expirados (para uso em cron/manutenção)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await db.delete(paymentTokens).where(lt(paymentTokens.expiresAt, new Date()))

  return result.rowCount ?? 0
}
