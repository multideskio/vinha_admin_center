import type { PaymentMethod, TransactionStatus } from '@/types/transaction'

/**
 * Mapas de configuração para transações
 */

export const STATUS_MAP: Record<
  TransactionStatus,
  { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
> = {
  approved: { text: 'Aprovada', variant: 'success' },
  pending: { text: 'Pendente', variant: 'warning' },
  refused: { text: 'Recusada', variant: 'destructive' },
  refunded: { text: 'Reembolsada', variant: 'outline' },
} as const

export const METHOD_MAP: Record<PaymentMethod, { text: string; color: string }> = {
  pix: { text: 'PIX', color: 'bg-videira-cyan/15 text-videira-cyan border-videira-cyan/30' },
  credit_card: {
    text: 'Cartão',
    color: 'bg-videira-blue/15 text-videira-blue border-videira-blue/30',
  },
  boleto: {
    text: 'Boleto',
    color: 'bg-videira-purple/15 text-videira-purple border-videira-purple/30',
  },
} as const
