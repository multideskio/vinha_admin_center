/**
 * Componente de timer com countdown visual para pagamentos PIX
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { CountdownTimerProps } from '../types'
import { formatTime, shouldShowTimeAlert } from '../utils'

export default function CountdownTimer({ seconds, onExpired, className }: CountdownTimerProps) {
  const isAlertTime = shouldShowTimeAlert(seconds)
  const progressPercentage = (seconds / 180) * 100 // 180 = 3 minutos

  // Chama onExpired quando chegar a 0
  React.useEffect(() => {
    if (seconds === 0 && onExpired) {
      onExpired()
    }
  }, [seconds, onExpired])

  return (
    <div className={cn('space-y-3', className)}>
      {/* Timer Display Premium */}
      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full animate-pulse',
              isAlertTime ? 'bg-red-500' : 'bg-videira-cyan',
            )}
          />
          <span
            className={cn(
              'text-sm font-bold',
              isAlertTime ? 'text-red-700 dark:text-red-300' : 'text-videira-cyan',
            )}
          >
            {isAlertTime ? '⚠️ Tempo quase acabando!' : '⏱️ Aguardando pagamento'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <svg
            className={cn(
              'h-5 w-5',
              isAlertTime ? 'text-red-600 dark:text-red-400' : 'text-videira-cyan',
            )}
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
          <span
            className={cn(
              'text-lg font-mono font-black',
              isAlertTime ? 'text-red-600 dark:text-red-400' : 'text-videira-cyan',
            )}
          >
            {formatTime(seconds)}
          </span>
        </div>
      </div>

      {/* Progress Bar Premium */}
      <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-1000 ease-linear',
            isAlertTime
              ? 'bg-gradient-to-r from-red-500 to-orange-500'
              : 'bg-gradient-to-r from-videira-cyan to-videira-blue',
          )}
          style={{ width: `${Math.max(0, progressPercentage)}%` }}
        />
        {!isAlertTime && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        )}
      </div>

      {/* Status Message Premium */}
      <div
        className={cn(
          'text-center p-2 rounded-lg',
          isAlertTime ? 'bg-red-50 dark:bg-red-950' : 'bg-videira-cyan/5',
        )}
      >
        <p
          className={cn(
            'text-xs font-medium',
            isAlertTime ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground',
          )}
        >
          {isAlertTime
            ? '⚠️ Complete o pagamento rapidamente!'
            : '🔄 Verificando automaticamente na Cielo...'}
        </p>
      </div>
    </div>
  )
}
