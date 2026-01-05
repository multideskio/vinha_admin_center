/**
 * Página de contribuições do pastor
 * Migrada para usar o sistema componentizado
 */

'use client'

import React from 'react'
import { ContributionForm } from '@/components/contributions'

export default function ContribuirPage() {
  const handleSuccess = (transaction: { id: string; amount: string; status: string }) => {
    console.log('Pastor contribution successful:', transaction)
    // Lógica específica do pastor
    // Pode incluir atualizações no perfil, histórico, etc.
  }

  const handleError = (error: string) => {
    console.warn('Pastor contribution error:', error)
    // Lógica específica de erro para pastor
  }

  return <ContributionForm userRole="pastor" onSuccess={handleSuccess} onError={handleError} />
}
