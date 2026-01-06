'use client'

import { TransactionDetailPage } from '@/components/transaction-detail-page'

export default function TransacaoDetalhePage() {
  // Pastor é perfil PF (CPF) e Igreja é perfil PJ (CNPJ) - são perfis separados
  // Pastor não tem igrejas associadas, então não buscamos informações de igreja
  return (
    <TransactionDetailPage
      apiEndpoint="/api/v1/pastor/transacoes"
      backUrl="/pastor/transacoes"
      backLabel="Voltar para Transações"
    />
  )
}
