'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw, AlertTriangle, DollarSign } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { TransactionDetails } from '@/types/transaction'

type ActionType = 'resend' | 'sync' | 'fraud' | null

interface TransactionActionsProps {
  transaction: TransactionDetails
  loadingAction: ActionType
  onResendReceipt: () => void
  onSync: () => void
  onMarkFraud: () => void
  onRequestRefund: () => void
  onActionComplete: () => void
  onTransactionUpdate: (transaction: TransactionDetails) => void
}

/**
 * Card com botões de ação para a transação
 */
export function TransactionActions({
  transaction,
  loadingAction,
  onResendReceipt,
  onSync,
  onMarkFraud,
  onRequestRefund,
  onActionComplete,
  onTransactionUpdate,
}: TransactionActionsProps) {
  const { toast } = useToast()

  const handleResendReceipt = async () => {
    onResendReceipt()
    try {
      const response = await fetch(`/api/v1/transacoes/${transaction.id}/resend`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Falha ao reenviar comprovante')
      }

      toast({
        title: 'Comprovante Reenviado',
        description: 'O comprovante foi enviado para o email do contribuinte',
      })
    } catch (error) {
      console.error('[RESEND_RECEIPT_ERROR]', {
        transactionId: transaction.id,
        error: error instanceof Error ? error.message : 'Unknown',
      })
      toast({
        title: 'Erro ao Reenviar',
        description: 'Não foi possível reenviar o comprovante',
        variant: 'destructive',
      })
    } finally {
      onActionComplete()
    }
  }

  const handleSync = async () => {
    onSync()
    try {
      const response = await fetch(`/api/v1/transacoes/${transaction.id}/sync`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Falha ao sincronizar')
      }

      const data = await response.json()
      onTransactionUpdate(data.transaction)

      toast({
        title: 'Sincronização Concluída',
        description: 'Status atualizado com sucesso',
      })
    } catch (error) {
      console.error('[SYNC_ERROR]', {
        transactionId: transaction.id,
        error: error instanceof Error ? error.message : 'Unknown',
      })
      toast({
        title: 'Erro ao Sincronizar',
        description: 'Não foi possível sincronizar com o gateway',
        variant: 'destructive',
      })
    } finally {
      onActionComplete()
    }
  }

  const handleMarkFraud = async () => {
    if (!confirm('Tem certeza que deseja marcar esta transação como fraude?')) {
      return
    }

    onMarkFraud()
    try {
      const response = await fetch(`/api/v1/transacoes/${transaction.id}/fraud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'Marcada manualmente pelo administrador',
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao marcar como fraude')
      }

      const data = await response.json()
      onTransactionUpdate(data.transaction)

      toast({
        title: 'Marcada como Fraude',
        description: 'A transação foi marcada como fraudulenta',
      })
    } catch (error) {
      console.error('[MARK_FRAUD_ERROR]', {
        transactionId: transaction.id,
        error: error instanceof Error ? error.message : 'Unknown',
      })
      toast({
        title: 'Erro ao Marcar Fraude',
        description: 'Não foi possível marcar a transação',
        variant: 'destructive',
      })
    } finally {
      onActionComplete()
    }
  }

  const canRequestRefund = transaction.status === 'approved' && !transaction.isFraud

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handleResendReceipt}
          disabled={loadingAction === 'resend'}
        >
          <Mail className="mr-2 h-4 w-4" />
          {loadingAction === 'resend' ? 'Enviando...' : 'Reenviar Comprovante'}
        </Button>

        <Button variant="outline" onClick={handleSync} disabled={loadingAction === 'sync'}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {loadingAction === 'sync' ? 'Sincronizando...' : 'Sincronizar Status'}
        </Button>

        {!transaction.isFraud && (
          <Button
            variant="outline"
            onClick={handleMarkFraud}
            disabled={loadingAction === 'fraud'}
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {loadingAction === 'fraud' ? 'Marcando...' : 'Marcar como Fraude'}
          </Button>
        )}

        {canRequestRefund && (
          <Button variant="outline" onClick={onRequestRefund}>
            <DollarSign className="mr-2 h-4 w-4" />
            Solicitar Reembolso
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
