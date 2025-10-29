/**
 * Componente de card de status para pagamentos PIX
 */

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PaymentStatusCardProps } from '../types'
import CountdownTimer from './CountdownTimer'

export default function PaymentStatusCard({
  status,
  countdown,
  onManualCheck,
  isChecking = false,
  className
}: PaymentStatusCardProps) {
  if (status === 'idle') {
    return null
  }

  if (status === 'confirmed') {
    return (
      <div className={cn(
        "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3",
        className
      )}>
        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm font-medium">Pagamento confirmado!</span>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className={cn(
        "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3",
        className
      )}>
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <span className="text-sm font-medium">Tempo esgotado</span>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          Gere um novo código PIX para continuar
        </p>
      </div>
    )
  }

  // Status 'pending'
  return (
    <div className={cn(
      "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3",
      className
    )}>
      <CountdownTimer 
        seconds={countdown}
        className="mb-3"
      />

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            💡 <strong>Dica:</strong> Já fez o pagamento? Clique em "Verificar" para consultar o status na Cielo
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onManualCheck}
          disabled={isChecking}
          className="ml-2 text-xs px-2 py-1 h-6"
        >
          {isChecking ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              Verificar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}