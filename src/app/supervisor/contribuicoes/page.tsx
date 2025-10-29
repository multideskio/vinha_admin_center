/**
 * Página de contribuições do supervisor
 * Migrada para usar o sistema componentizado
 */

'use client'

import React from 'react'
import { ContributionForm } from '@/components/contributions'
import { useToast } from '@/hooks/use-toast'

export default function ContribuicoesPage() {
  const { toast } = useToast()

  const handleSuccess = (transaction: any) => {
    console.log('Contribution successful:', transaction)
    // Aqui poderia adicionar lógica específica do supervisor
    // como atualizar dashboards, enviar notificações, etc.
  }

  const handleError = (error: string) => {
    console.error('Contribution error:', error)
    // Lógica específica de erro para supervisor
  }

  return (
    <ContributionForm
      userRole="supervisor"
      onSuccess={handleSuccess}
      onError={handleError}
    />
  )
}