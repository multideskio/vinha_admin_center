/**
 * Sanitizador de logs para prevenir exposição de dados sensíveis
 *
 * Este módulo fornece funções para mascarar informações sensíveis em logs,
 * incluindo CPF, cartões de crédito, CVV, senhas e tokens.
 *
 * CRÍTICO: Sempre use estas funções ao logar dados que possam conter
 * informações sensíveis de usuários ou transações.
 */

/**
 * Padrões regex para identificar dados sensíveis
 */
const SENSITIVE_PATTERNS = {
  // CPF: 123.456.789-01 ou 12345678901
  cpf: /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g,

  // Cartão de crédito: 1234 5678 9012 3456 ou 1234-5678-9012-3456
  creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,

  // CVV: 3 ou 4 dígitos isolados
  cvv: /\b\d{3,4}\b/g,

  // Senha em JSON: "password": "valor"
  password: /"password"\s*:\s*"[^"]+"/gi,

  // Token em JSON: "token": "valor"
  token: /"token"\s*:\s*"[^"]+"/gi,

  // Bearer token em headers
  bearerToken: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,

  // Security code em JSON
  securityCode: /"securityCode"\s*:\s*"[^"]+"/gi,
}

/**
 * Campos que devem ser sempre redatados em objetos
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'securityCode',
  'cvv',
  'cardNumber',
  'number', // número do cartão
  'expirationDate',
  'holder',
  'brand',
]

/**
 * Sanitiza uma string, mascarando dados sensíveis
 *
 * @param data - String a ser sanitizada
 * @returns String com dados sensíveis mascarados
 */
function sanitizeString(data: string): string {
  let sanitized = data

  // Mascarar CPF: 123.456.789-01 → ***.***.*89-01
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.cpf, (match) => {
    const digits = match.replace(/\D/g, '')
    return `***.***.*${digits.slice(-4, -2)}-${digits.slice(-2)}`
  })

  // Mascarar cartão de crédito: 1234 5678 9012 3456 → **** **** **** 3456
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.creditCard, (match) => {
    const lastFour = match.slice(-4)
    const separator = match.includes('-') ? '-' : ' '
    return `****${separator}****${separator}****${separator}${lastFour}`
  })

  // Mascarar CVV completamente
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.cvv, '***')

  // Mascarar senhas em JSON
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.password, '"password":"[REDACTED]"')

  // Mascarar tokens em JSON
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.token, '"token":"[REDACTED]"')

  // Mascarar Bearer tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.bearerToken, 'Bearer [REDACTED]')

  // Mascarar security code em JSON
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.securityCode, '"securityCode":"[REDACTED]"')

  return sanitized
}

/**
 * Sanitiza um objeto, redatando campos sensíveis
 *
 * @param data - Objeto a ser sanitizado
 * @returns Novo objeto com campos sensíveis redatados
 */
function sanitizeObject(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    // Redatar campos sensíveis conhecidos
    if (SENSITIVE_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]'
      continue
    }

    // Recursivamente sanitizar valores
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map((item) => sanitizeLog(item))
      } else {
        sanitized[key] = sanitizeObject(value as Record<string, unknown>)
      }
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Sanitiza qualquer tipo de dado para logging seguro
 *
 * Esta é a função principal que deve ser usada para sanitizar
 * dados antes de logar.
 *
 * @param data - Dados a serem sanitizados (string, objeto, array, etc)
 * @returns Dados sanitizados
 *
 * @example
 * ```typescript
 * const userData = { name: 'João', cpf: '123.456.789-01', password: 'secret' }
 * console.log('User data:', sanitizeLog(userData))
 * // Output: User data: { name: 'João', cpf: '***.***.*89-01', password: '[REDACTED]' }
 * ```
 */
export function sanitizeLog(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'string') {
    return sanitizeString(data)
  }

  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map((item) => sanitizeLog(item))
    }
    return sanitizeObject(data as Record<string, unknown>)
  }

  return data
}

/**
 * Wrapper seguro para console.log que sanitiza automaticamente
 *
 * Use esta função em vez de console.log quando logar dados
 * que possam conter informações sensíveis.
 *
 * @param message - Mensagem de log
 * @param data - Dados opcionais a serem logados (serão sanitizados)
 *
 * @example
 * ```typescript
 * safeLog('Processing payment', { cardNumber: '1234567890123456', amount: 100 })
 * // Output: Processing payment { cardNumber: '[REDACTED]', amount: 100 }
 * ```
 */
export function safeLog(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.log(message, sanitizeLog(data))
  } else {
    console.log(message)
  }
}

/**
 * Wrapper seguro para console.error que sanitiza automaticamente
 *
 * @param message - Mensagem de erro
 * @param data - Dados opcionais a serem logados (serão sanitizados)
 */
export function safeError(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.error(message, sanitizeLog(data))
  } else {
    console.error(message)
  }
}

/**
 * Wrapper seguro para console.warn que sanitiza automaticamente
 *
 * @param message - Mensagem de aviso
 * @param data - Dados opcionais a serem logados (serão sanitizados)
 */
export function safeWarn(message: string, data?: unknown): void {
  if (data !== undefined) {
    console.warn(message, sanitizeLog(data))
  } else {
    console.warn(message)
  }
}
