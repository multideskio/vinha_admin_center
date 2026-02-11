'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/format'
import type { TransactionDetails, TransactionStatus } from '@/types/transaction'
import { AlertTriangle } from 'lucide-react'

interface RefundModalProps {
  transactionId: string
  amount: number
  status: TransactionStatus
  onClose: () => void
  onSuccess: (transaction: TransactionDetails) => void
}

/**
 * Modal para solicitar reembolso de transação
 */
export function RefundModal({
  transactionId,
  amount,
  status,
  onClose,
  onSuccess,
}: RefundModalProps) {
  const { toast } = useToast()
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Motivo Obrigatório',
        description: 'Por favor, informe o motivo do reembolso',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/v1/transacoes/${transactionId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Falha ao solicitar reembolso')
      }

      const data = await response.json()

      toast({
        title: 'Reembolso Solicitado',
        description: 'A solicitação de reembolso foi enviada com sucesso',
      })

      onSuccess(data.transaction)
    } catch (error) {
      console.error('[REFUND_ERROR]', {
        transactionId,
        error: error instanceof Error ? error.message : 'Unknown',
      })
      toast({
        title: 'Erro ao Solicitar Reembolso',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canRefund = status === 'approved'

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Reembolso</DialogTitle>
          <DialogDescription>
            Solicite o reembolso desta transação. O valor será devolvido ao contribuinte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!canRefund && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Reembolso Não Disponível</p>
                <p className="text-sm text-muted-foreground">
                  Apenas transações aprovadas podem ser reembolsadas.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Valor a ser reembolsado</p>
            <p className="text-2xl font-bold text-videira-blue">{formatCurrency(amount)}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do Reembolso *</Label>
            <Textarea
              id="reason"
              placeholder="Descreva o motivo do reembolso..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={!canRefund || isSubmitting}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Este motivo será registrado no histórico da transação.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canRefund || isSubmitting}>
            {isSubmitting ? 'Processando...' : 'Confirmar Reembolso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
