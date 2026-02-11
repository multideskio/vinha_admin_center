'use client'

import { useState } from 'react'
import type { TransactionDetails } from '@/types/transaction'
import { TransactionHeader } from './transaction-header'
import { TransactionAmountCard } from './transaction-amount-card'
import { TransactionPaymentInfo } from './transaction-payment-info'
import { TransactionContributorCard } from './transaction-contributor-card'
import { TransactionChurchCard } from './transaction-church-card'
import { TransactionActions } from './transaction-actions'
import { TransactionFraudAlert } from './transaction-fraud-alert'
import dynamic from 'next/dynamic'

// Lazy load do modal de reembolso
const RefundModal = dynamic(() => import('./refund-modal').then((mod) => mod.RefundModal), {
  ssr: false,
})

type ActionType = 'resend' | 'sync' | 'fraud' | null

interface TransactionDetailsClientProps {
  transaction: TransactionDetails
}

/**
 * Componente Client Principal - Detalhes de Transação
 * Orquestra todos os sub-componentes e gerencia estado
 */
export function TransactionDetailsClient({ transaction }: TransactionDetailsClientProps) {
  const [loadingAction, setLoadingAction] = useState<ActionType>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState(transaction)

  return (
    <div className="flex flex-col gap-6">
      <TransactionHeader transactionId={currentTransaction.id} />

      {currentTransaction.isFraud && (
        <TransactionFraudAlert
          fraudMarkedAt={currentTransaction.fraudMarkedAt}
          fraudReason={currentTransaction.fraudReason}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <TransactionAmountCard
          amount={currentTransaction.amount}
          status={currentTransaction.status}
          date={currentTransaction.date}
        />

        <TransactionPaymentInfo
          method={currentTransaction.payment?.method || 'N/A'}
          details={currentTransaction.payment?.details || 'Não disponível'}
          gateway={currentTransaction.gateway}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {currentTransaction.contributor && (
          <TransactionContributorCard contributor={currentTransaction.contributor} />
        )}

        {currentTransaction.church && <TransactionChurchCard church={currentTransaction.church} />}
      </div>

      <TransactionActions
        transaction={currentTransaction}
        loadingAction={loadingAction}
        onResendReceipt={() => setLoadingAction('resend')}
        onSync={() => setLoadingAction('sync')}
        onMarkFraud={() => setLoadingAction('fraud')}
        onRequestRefund={() => setShowRefundModal(true)}
        onActionComplete={() => setLoadingAction(null)}
        onTransactionUpdate={setCurrentTransaction}
      />

      {showRefundModal && (
        <RefundModal
          transactionId={currentTransaction.id}
          amount={currentTransaction.amount}
          status={currentTransaction.status}
          onClose={() => setShowRefundModal(false)}
          onSuccess={(updatedTransaction) => {
            setCurrentTransaction(updatedTransaction)
            setShowRefundModal(false)
          }}
        />
      )}
    </div>
  )
}
