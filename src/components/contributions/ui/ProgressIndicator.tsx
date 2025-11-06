/**
 * Componente de indicador de progresso para o fluxo de contribuições
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { ProgressIndicatorProps } from '../types'

const steps = [
  { number: 1, label: 'Dados' },
  { number: 2, label: 'Pagamento' },
  { number: 3, label: 'Confirmação' }
] as const

export default function ProgressIndicator({ currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("max-w-2xl mx-auto w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step Circle and Label */}
            <div className="flex flex-col items-center gap-2 relative">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative z-10",
                  currentStep >= step.number
                    ? "bg-gradient-to-br from-videira-cyan to-videira-blue text-white shadow-lg scale-110"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.number ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              {currentStep === step.number && (
                <div className="absolute inset-0 bg-gradient-to-br from-videira-cyan to-videira-blue rounded-full blur-lg opacity-50 animate-pulse" />
              )}
              <span
                className={cn(
                  "text-xs transition-all duration-300 whitespace-nowrap",
                  currentStep >= step.number
                    ? "font-bold text-videira-cyan"
                    : "font-medium text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 mx-3 rounded-full overflow-hidden bg-muted relative">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    currentStep > step.number
                      ? "w-full bg-gradient-to-r from-videira-cyan to-videira-blue"
                      : "w-0"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}