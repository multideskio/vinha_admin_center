/**
 * Página de contribuições do manager
 * Migrada para usar o sistema componentizado
 */

'use client'

import React from 'react'
import { ContributionForm } from '@/components/contributions'
import { useToast } from '@/hooks/use-toast'

export default function ContribuicoesPage() {
  const { toast } = useToast()

  const handleSuccess = (transaction: any) => {
    console.log('Manager contribution successful:', transaction)
    // Lógica específica do manager
    // Pode incluir notificações para supervisores, relatórios, etc.
  }

  const handleError = (error: string) => {
    console.error('Manager contribution error:', error)
    // Lógica específica de erro para manager
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Nova Contribuição</h1>
        <p className="text-sm text-muted-foreground">Realize uma nova contribuição.</p>
      </div>
      
      <ContributionForm
        userRole="manager"
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </div>
  )
}