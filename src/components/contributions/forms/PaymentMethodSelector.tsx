/**
 * Componente seletor de métodos de pagamento
 */

import React from 'react'
import { Banknote, CreditCard, QrCode } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { PaymentMethodSelectorProps, PaymentMethod } from '../types'
import { PAYMENT_METHODS } from '../types'

// Mapeamento de ícones
const iconMap = {
  QrCode,
  CreditCard,
  Banknote
} as const

export default function PaymentMethodSelector({
  value,
  onChange,
  disabled = false
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Método de Pagamento</h3>
        <p className="text-xs text-muted-foreground">Escolha como deseja contribuir</p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className="space-y-3"
      >
        {Object.entries(PAYMENT_METHODS).map(([method, config]) => {
          const IconComponent = iconMap[config.icon as keyof typeof iconMap]
          
          return (
            <Label
              key={method}
              className={cn(
                'flex items-center gap-3 rounded-lg border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200 hover:shadow-md',
                value === method && 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RadioGroupItem value={method} disabled={disabled} />
              
              <IconComponent className="h-8 w-8 text-primary flex-shrink-0" />
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{config.label}</span>
                  
                  {/* Badges específicos por método */}
                  {method === 'pix' && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  )}
                  
                  {method === 'credit_card' && (
                    <div className="flex gap-1">
                      <div className="w-5 h-3 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                        V
                      </div>
                      <div className="w-5 h-3 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">
                        M
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config.description}
                </p>
              </div>
              
              {/* Informações adicionais */}
              <div className="text-right text-xs">
                {method === 'pix' && (
                  <div className="font-medium text-green-600">Grátis</div>
                )}
                {method === 'credit_card' && (
                  <div className="font-medium">até 12x</div>
                )}
                {method === 'boleto' && (
                  <div className="font-medium">3 dias</div>
                )}
              </div>
            </Label>
          )
        })}
      </RadioGroup>
    </div>
  )
}