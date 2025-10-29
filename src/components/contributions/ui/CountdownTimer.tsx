/**
 * Componente de timer com countdown visual para pagamentos PIX
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { CountdownTimerProps } from '../types'
import { formatTime, shouldShowTimeAlert } from '../utils'

export default function CountdownTimer({ 
  seconds, 
  onExpired, 
  className 
}: CountdownTimerProps) {
  const isAlertTime = shouldShowTimeAlert(seconds)
  const progressPercentage = (seconds / 180) * 100 // 180 = 3 minutos

  // Chama onExpired quando chegar a 0
  React.useEffect(() => {
    if (seconds === 0 && onExpired) {
      onExpired()
    }
  }, [seconds, onExpired])

  return (
    <div className={cn("space-y-2", className)}>
      {/* Timer Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Aguardando pagamento
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <svg 
            className="h-4 w-4 text-blue-600 dark:text-blue-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <span className={cn(
            "text-sm font-mono font-bold",
            isAlertTime 
              ? "text-red-600 dark:text-red-400" 
              : "text-blue-700 dark:text-blue-300"
          )}>
            {formatTime(seconds)}
          </span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1.5">
        <div 
          className={cn(
            "h-1.5 rounded-full transition-all duration-1000 ease-linear",
            isAlertTime ? "bg-red-500" : "bg-blue-500"
          )}
          style={{ width: `${Math.max(0, progressPercentage)}%` }}
        />
      </div>

      {/* Status Message */}
      <p className="text-xs text-blue-600 dark:text-blue-400">
        {isAlertTime 
          ? "⚠️ Tempo quase esgotado! Complete o pagamento rapidamente."
          : "Verificando automaticamente na Cielo a cada poucos segundos..."
        }
      </p>
    </div>
  )
}