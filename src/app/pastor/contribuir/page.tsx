/**
 * Página de contribuições do pastor
 * Migrada para usar o sistema componentizado
 */

'use client'

import React from 'react'
import { ContributionForm } from '@/components/contributions'
import { useToast } from '@/hooks/use-toast'

export default function ContribuirPage() {
  const { toast } = useToast()

  const handleSuccess = (transaction: any) => {
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
