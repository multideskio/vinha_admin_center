/**
 * Sistema de Logging Estruturado
 *
 * Fornece logging centralizado com contexto e sanitização de dados sensíveis.
 * Formato JSON para facilitar parsing e análise em produção.
 */

interface LogContext {
  userId?: string
  transactionId?: string
  operation?: string
  churchId?: string
  role?: string
  [key: string]: string | undefined
}

interface LogEntry {
  level: 'error' | 'warn' | 'info'
  message: string
  timestamp: string
  context?: LogContext
  data?: unknown
  error?: string
  stack?: string
}

/**
 * Sanitização básica de dados sensíveis em logs
 * NOTA: Esta é uma implementação temporária. Será substituída por
 * importação de log-sanitizer.ts quando a tarefa 12 for concluída.
 */
function sanitizeLogData(data: unknown): unknown {
  if (typeof data === 'string') {
    let sanitized = data
    // Mascarar CPF
    sanitized = sanitized.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '***.***.***-**')
    // Mascarar cartão de crédito
    sanitized = sanitized.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '****-****-****-****')
    // Mascarar CVV
    sanitized = sanitized.replace(/\b\d{3,4}\b/g, '***')
    // Mascarar senha em JSON
    sanitized = sanitized.replace(/"password"\s*:\s*"[^"]+"/g, '"password":"[REDACTED]"')
    // Mascarar token em JSON
    sanitized = sanitized.replace(/"token"\s*:\s*"[^"]+"/g, '"token":"[REDACTED]"')
    return sanitized
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => sanitizeLogData(item))
    }

    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data)) {
      // Campos sensíveis que devem ser sempre redacted
      const sensitiveFields = [
        'password',
        'token',
        'securityCode',
        'cvv',
        'cardNumber',
        'cardholderName',
        'expirationDate',
        'jwt',
        'secret',
        'apiKey',
      ]

      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeLogData(value)
      }
    }
    return sanitized
  }

  return data
}

/**
 * Classe Logger com suporte a contexto e sanitização
 */
export class Logger {
  private context: LogContext = {}

  /**
   * Define ou atualiza o contexto do logger
   * Útil para adicionar informações como userId, operation, etc.
   */
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Limpa o contexto do logger
   */
  clearContext(): void {
    this.context = {}
  }

  /**
   * Obtém o contexto atual
   */
  getContext(): LogContext {
    return { ...this.context }
  }

  /**
   * Loga erro crítico
   * Use para erros inesperados que requerem atenção imediata
   */
  error(message: string, error?: unknown, additionalData?: unknown): void {
    const logEntry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context: Object.keys(this.context).length > 0 ? this.context : undefined,
    }

    if (error instanceof Error) {
      logEntry.error = error.message
      logEntry.stack = error.stack
    } else if (error) {
      logEntry.error = String(error)
    }

    if (additionalData) {
      logEntry.data = sanitizeLogData(additionalData)
    }

    console.error(JSON.stringify(logEntry))
  }

  /**
   * Loga aviso
   * Use para situações anormais que não são erros críticos
   */
  warn(message: string, data?: unknown): void {
    const logEntry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context: Object.keys(this.context).length > 0 ? this.context : undefined,
    }

    if (data) {
      logEntry.data = sanitizeLogData(data)
    }

    console.warn(JSON.stringify(logEntry))
  }

  /**
   * Loga informação
   * Use para eventos importantes do sistema
   */
  info(message: string, data?: unknown): void {
    const logEntry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context: Object.keys(this.context).length > 0 ? this.context : undefined,
    }

    if (data) {
      logEntry.data = sanitizeLogData(data)
    }

    console.log(JSON.stringify(logEntry))
  }

  /**
   * Cria uma nova instância do logger com contexto específico
   * Útil para criar loggers isolados por módulo ou operação
   */
  child(context: Partial<LogContext>): Logger {
    const childLogger = new Logger()
    childLogger.setContext({ ...this.context, ...context })
    return childLogger
  }
}

/**
 * Instância singleton do logger para uso global
 *
 * Exemplo de uso:
 * ```typescript
 * import { logger } from '@/lib/logger'
 *
 * // Definir contexto no início da operação
 * logger.setContext({ userId: user.id, operation: 'create-payment' })
 *
 * // Logar eventos
 * logger.info('Iniciando criação de pagamento', { amount: 100 })
 * logger.error('Falha ao processar pagamento', error)
 *
 * // Limpar contexto ao final
 * logger.clearContext()
 * ```
 */
export const logger = new Logger()
