/**
 * Utilitários para o sistema de contribuições
 * @lastReview 2025-01-05 15:30
 */

import { PaymentMethod, ContributionType } from './types'

/**
 * Formata valor monetário para exibição
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata input de dinheiro em tempo real
 */
export const formatMoneyInput = (value: string): string => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '')

  // Se não há números, retorna vazio
  if (!numbers) return ''

  // Converte para centavos
  const amount = parseInt(numbers) / 100

  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Converte string formatada para número
 */
export const parseMoneyInput = (value: string): number => {
  // Remove formatação e converte para número
  const numbers = value.replace(/[^\d]/g, '')
  if (!numbers) return 0
  return parseInt(numbers) / 100
}

/**
 * Valida valor monetário
 */
export const validateMoneyAmount = (amount: number): string | null => {
  if (amount <= 0) return 'Valor deve ser maior que zero'
  if (amount > 100000) return 'Valor muito alto. Entre em contato conosco'
  if (amount < 1) return 'Valor mínimo é R$ 1,00'
  return null
}

/**
 * Formata tempo em segundos para MM:SS
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Formata número do cartão com espaços
 */
export const formatCardNumber = (value: string): string => {
  return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * Formata data de expiração MM/YY
 */
export const formatExpiryDate = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .slice(0, 5)
}

/**
 * Formata CVC removendo caracteres não numéricos
 */
export const formatCVC = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 4)
}

/**
 * Valida se QR Code base64 tem prefixo correto
 */
export const getFullQrCodeSrc = (qrCodeBase64?: string): string | null => {
  if (!qrCodeBase64) return null

  if (qrCodeBase64.startsWith('data:image/png;base64,')) {
    return qrCodeBase64
  }

  return `data:image/png;base64,${qrCodeBase64}`
}

/**
 * Copia texto para clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error)
    return false
  }
}

/**
 * Calcula delay para backoff exponencial
 */
export const calculateBackoffDelay = (
  attempt: number,
  baseDelay: number = 8000,
  maxDelay: number = 15000,
): number => {
  return Math.min(baseDelay + attempt * 2000, maxDelay)
}

/**
 * Calcula delay para erro com backoff
 */
export const calculateErrorDelay = (
  attempt: number,
  baseDelay: number = 12000,
  maxDelay: number = 20000,
): number => {
  return Math.min(baseDelay + attempt * 3000, maxDelay)
}

/**
 * Valida se valor é um número positivo
 */
export const isValidAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount > 0
}

/**
 * Valida dados básicos do cartão
 */
export const isValidCardData = (cardData: {
  number: string
  holder: string
  expirationDate: string
  securityCode: string
}): boolean => {
  return (
    cardData.number.replace(/\D/g, '').length >= 13 &&
    cardData.holder.trim().length >= 2 &&
    cardData.expirationDate.length === 5 &&
    cardData.securityCode.length >= 3
  )
}

/**
 * Gera ID único para transação (fallback)
 */
export const generateTransactionId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Determina se deve mostrar alerta de tempo (últimos 30 segundos)
 */
export const shouldShowTimeAlert = (seconds: number): boolean => {
  return seconds <= 30 && seconds > 0
}

/**
 * Converte método de pagamento para label amigável
 */
export const getPaymentMethodLabel = (method: PaymentMethod): string => {
  const labels: Record<PaymentMethod, string> = {
    pix: 'PIX',
    credit_card: 'Cartão de Crédito',
    boleto: 'Boleto Bancário',
  }
  return labels[method] || method
}

/**
 * Converte tipo de contribuição para label amigável
 */
export const getContributionTypeLabel = (type: ContributionType): string => {
  const labels: Record<ContributionType, string> = {
    dizimo: 'Dízimo',
    oferta: 'Oferta',
  }
  return labels[type] || type
}

/**
 * Sanitiza entrada de texto (prevenção XSS básica)
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .trim()
    .slice(0, 500) // Limita tamanho
}

/**
 * Debounce para funções
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Verifica se é ambiente de desenvolvimento
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

/**
 * Log condicional (apenas em desenvolvimento)
 */
export const devLog = (message: string, ...args: unknown[]): void => {
  if (isDevelopment()) {
    console.log(`[CONTRIBUTIONS] ${message}`, ...args)
  }
}
