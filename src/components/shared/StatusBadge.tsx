'use client'

import { Badge } from '@/components/ui/badge'

// Mapeamento centralizado de status de transação
export const TRANSACTION_STATUS_MAP: Record<
  string,
  { text: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  approved: { text: 'Aprovado', variant: 'default' },
  pending: { text: 'Pendente', variant: 'secondary' },
  refused: { text: 'Recusado', variant: 'destructive' },
  refunded: { text: 'Reembolsado', variant: 'outline' },
  cancelled: { text: 'Cancelado', variant: 'destructive' },
  fraud: { text: 'Fraude', variant: 'destructive' },
}

type StatusBadgeProps = {
  status: string
  className?: string
}

/**
 * Badge de status de transação padronizado.
 * Usa mapeamento centralizado para texto e variante.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = TRANSACTION_STATUS_MAP[status] || { text: status, variant: 'default' as const }
  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  )
}
