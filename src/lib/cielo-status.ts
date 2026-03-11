/**
 * Mapeamento de status da API Cielo para status do sistema.
 * Documentação: https://developercielo.github.io/manual/cielo-ecommerce
 *
 * Status Cielo: 0=NotFinished, 1=Authorized, 2=PaymentConfirmed, 3=Denied,
 * 10=Voided, 11=Refunded, 12=Pending, 13=Aborted, 20=Scheduled
 */
export function mapCieloStatus(status: number): 'approved' | 'pending' | 'refused' | 'refunded' {
  if (status === 2) return 'approved' // Pago
  if (status === 1) return 'approved' // Autorizado (cartão)
  if (status === 3 || status === 13) return 'refused' // Negado/Abortado
  if (status === 10 || status === 11) return 'refunded' // Cancelado/Estornado
  return 'pending' // 0, 12, 20 e outros
}
