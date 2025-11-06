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
        "relative overflow-hidden rounded-2xl border-2 border-green-200 dark:border-green-800",
        className
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950" />
        <div className="relative p-4">
          <div className="flex items-center gap-3 text-green-700 dark:text-green-300">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold">✓ Pagamento confirmado!</span>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-red-200 dark:border-red-800",
        className
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950" />
        <div className="relative p-4">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm font-bold">⏰ Tempo esgotado</span>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
            Gere um novo código PIX para continuar
          </p>
        </div>
      </div>
    )
  }

  // Status 'pending'
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border-2 border-videira-cyan/30",
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-videira-cyan/5 to-videira-blue/5" />
      <div className="relative p-4">
        <CountdownTimer 
          seconds={countdown}
          className="mb-4"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium">
              💡 <strong>Dica:</strong> Já fez o pagamento?
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onManualCheck}
            disabled={isChecking}
            className="border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white font-bold h-8 px-3"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </div>
  )
}