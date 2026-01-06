'use client'

import { TransactionDetailPage } from '@/components/transaction-detail-page'

export default function TransacaoDetalhePage() {
  return (
    <TransactionDetailPage
      apiEndpoint="/api/v1/igreja/transacoes"
      backUrl="/igreja/transacoes"
      backLabel="Voltar para Transações"
      // Igreja não precisa buscar informações de outra igreja, pois a transação já pertence a ela
    />
  )
}
