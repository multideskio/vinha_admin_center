/**
 * Componente de indicador de progresso para o fluxo de contribuições
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { ProgressIndicatorProps, PaymentStep } from '../types'

const steps = [
  { number: 1, label: 'Dados' },
  { number: 2, label: 'Pagamento' },
  { number: 3, label: 'Confirmação' }
] as const

export default function ProgressIndicator({ currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("max-w-sm mx-auto w-full mb-2", className)}>
      <div className="flex items-center justify-between text-xs">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            {/* Step Circle and Label */}
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-200",
                  currentStep >= step.number
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.number}
              </div>
              <span
                className={cn(
                  "transition-all duration-200",
                  currentStep >= step.number
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-px mx-2 transition-all duration-200",
                  currentStep > step.number
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}