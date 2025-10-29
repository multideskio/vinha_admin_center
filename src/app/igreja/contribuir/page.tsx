/**
 * Página de contribuições da igreja
 * Migrada para usar o sistema componentizado
 */

'use client'

import React from 'react'
import { ContributionForm } from '@/components/contributions'
import { useToast } from '@/hooks/use-toast'

export default function ContribuirPage() {
  const { toast } = useToast()

  const handleSuccess = (transaction: any) => {
    console.log('Igreja contribution successful:', transaction)
    // Lógica específica da igreja
    // Pode incluir atualizações no perfil da igreja, relatórios, etc.
  }

  const handleError = (error: string) => {
    console.error('Igreja contribution error:', error)
    // Lógica específica de erro para igreja
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Nova Contribuição</h1>
        <p className="text-sm text-muted-foreground">Realize uma nova contribuição.</p>
      </div>
      
      <ContributionForm
        userRole="igreja"
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  )
}