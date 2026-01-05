/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitOptions {
  maxAttempts: number
  windowMs: number
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = identifier
  
  const entry = rateLimitStore.get(key)
  
  // Se não existe entrada ou já expirou, cria nova
  if (!entry || now > entry.resetAt) {
    const resetAt = now + options.windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    
    // Cleanup de entradas antigas (garbage collection simples)
    if (rateLimitStore.size > 10000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now > v.resetAt) {
          rateLimitStore.delete(k)
        }
      }
    }
    
    return {
      allowed: true,
      remaining: options.maxAttempts - 1,
      resetAt,
    }
  }
  
  // Incrementa contador
  entry.count++
  
  if (entry.count > options.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }
  
  return {
    allowed: true,
    remaining: options.maxAttempts - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Rate limit presets para diferentes endpoints
 */
export const rateLimitPresets = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas a cada 15 minutos
  forgotPassword: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 tentativas por hora
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 tentativas por hora
  resetPassword: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 tentativas a cada 15 minutos
}

/**
 * Extrai IP do request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}



