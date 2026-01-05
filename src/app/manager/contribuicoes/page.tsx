/**
 * Página de contribuições do manager
 * Migrada para usar o sistema componentizado
 */

'use client'

import React from 'react'
import { ContributionForm } from '@/components/contributions'

export default function ContribuicoesPage() {
  const handleSuccess = (transaction: any) => {
    console.log('Manager contribution successful:', transaction)
    // Lógica específica do manager
    // Pode incluir notificações para supervisores, relatórios, etc.
  }

  const handleError = (error: string) => {
    console.warn('Manager contribution error:', error)
    // Lógica específica de erro para manager
  }

  return <ContributionForm userRole="manager" onSuccess={handleSuccess} onError={handleError} />
}
