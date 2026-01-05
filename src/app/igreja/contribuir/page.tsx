/**
 * Página de contribuições da igreja
 * Migrada para usar o sistema componentizado
 */

'use client'

import React from 'react'
import { ContributionForm } from '@/components/contributions'

export default function ContribuirPage() {

  const handleSuccess = (transaction: any) => {
    console.log('Igreja contribution successful:', transaction)
    // Lógica específica da igreja
    // Pode incluir atualizações no perfil da igreja, relatórios, etc.
  }

  const handleError = (error: string) => {
    console.warn('Igreja contribution error:', error)
    // Lógica específica de erro para igreja
  }

  return <ContributionForm userRole="igreja" onSuccess={handleSuccess} onError={handleError} />
}
