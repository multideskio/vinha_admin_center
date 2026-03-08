/**
 * @fileoverview Validação de segurança para webhooks de gateways de pagamento.
 * Verifica IP de origem e aplica rate limiting para prevenir abuso.
 */

import { NextRequest } from 'next/server'
import { rateLimitSync, getClientIP } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

/**
 * IPs conhecidos da Cielo para envio de webhooks (notificações).
 * Fonte: Documentação Cielo - https://developercielo.github.io/manual/cielo-ecommerce
 * Em produção, a Cielo envia de ranges específicos.
 * Se a lista mudar, atualizar aqui.
 */
const CIELO_ALLOWED_IPS = [
  // Cielo Production IPs (Notificação Post)
  '209.134.48.', // Range Cielo
  '198.199.83.', // Range Cielo
  '52.8.', // Range AWS Cielo
  '54.183.', // Range AWS Cielo
  '107.23.', // Range AWS Cielo
  '54.224.', // Range AWS Cielo
]

/**
 * IPs conhecidos do Bradesco para envio de webhooks PIX/Boleto.
 * Fonte: Documentação Bradesco Open Banking
 */
const BRADESCO_ALLOWED_IPS = [
  '170.84.', // Range Bradesco
  '200.155.', // Range Bradesco
  '200.219.', // Range Bradesco
]

/**
 * Verifica se o IP de origem é de um gateway confiável.
 * Em desenvolvimento, permite qualquer IP.
 * Em produção, valida contra a lista de IPs conhecidos.
 */
function isAllowedIP(clientIP: string, allowedPrefixes: string[]): boolean {
  // Em desenvolvimento, permitir qualquer IP
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  // Verificar se o IP começa com algum dos prefixos permitidos
  return allowedPrefixes.some((prefix) => clientIP.startsWith(prefix))
}

/**
 * Valida a origem de um webhook da Cielo.
 * Retorna true se a requisição é válida, false caso contrário.
 */
export function validateCieloWebhook(request: NextRequest): {
  valid: boolean
  reason?: string
  clientIP: string
} {
  const clientIP = getClientIP(request)

  // Rate limiting: máximo 100 webhooks por minuto por IP
  const rateLimitResult = rateLimitSync(`webhook-cielo:${clientIP}`, {
    maxAttempts: 100,
    windowMs: 60 * 1000,
  })

  if (!rateLimitResult.allowed) {
    logger.warn('Webhook Cielo rate limited', { clientIP })
    return { valid: false, reason: 'Rate limit exceeded', clientIP }
  }

  // Validação de IP de origem
  if (!isAllowedIP(clientIP, CIELO_ALLOWED_IPS)) {
    logger.warn('Webhook Cielo de IP não autorizado', { clientIP })
    return { valid: false, reason: `IP não autorizado: ${clientIP}`, clientIP }
  }

  return { valid: true, clientIP }
}

/**
 * Valida a origem de um webhook do Bradesco.
 * Retorna true se a requisição é válida, false caso contrário.
 */
export function validateBradescoWebhook(request: NextRequest): {
  valid: boolean
  reason?: string
  clientIP: string
} {
  const clientIP = getClientIP(request)

  // Rate limiting: máximo 100 webhooks por minuto por IP
  const rateLimitResult = rateLimitSync(`webhook-bradesco:${clientIP}`, {
    maxAttempts: 100,
    windowMs: 60 * 1000,
  })

  if (!rateLimitResult.allowed) {
    logger.warn('Webhook Bradesco rate limited', { clientIP })
    return { valid: false, reason: 'Rate limit exceeded', clientIP }
  }

  // Validação de IP de origem
  if (!isAllowedIP(clientIP, BRADESCO_ALLOWED_IPS)) {
    logger.warn('Webhook Bradesco de IP não autorizado', { clientIP })
    return { valid: false, reason: `IP não autorizado: ${clientIP}`, clientIP }
  }

  return { valid: true, clientIP }
}
