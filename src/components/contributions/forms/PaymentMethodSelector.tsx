/**
 * Componente seletor de métodos de pagamento
 */

import React from 'react'
import { Banknote, CreditCard, QrCode, Loader2, AlertCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { PaymentMethodSelectorProps } from '../types'
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
  const [availableMethods, setAvailableMethods] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchAvailableMethods = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/v1/payment-methods')
        if (!response.ok) throw new Error('Falha ao carregar métodos de pagamento')
        const data = await response.json()
        
        if (!data.methods || data.methods.length === 0) {
          setError('Nenhum método de pagamento está configurado. Configure em Admin > Gateways.')
        } else {
          setAvailableMethods(data.methods)
          // Se o método selecionado não está disponível, seleciona o primeiro disponível
          if (!data.methods.includes(value)) {
            onChange(data.methods[0])
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar métodos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailableMethods()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executa apenas uma vez no mount

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-lg mb-1">Método de Pagamento</h3>
          <p className="text-sm text-muted-foreground">Carregando métodos disponíveis...</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || availableMethods.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-lg mb-1">Método de Pagamento</h3>
          <p className="text-sm text-muted-foreground">Escolha como deseja contribuir</p>
        </div>
        <Alert variant="destructive" className="border-2">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="font-medium">
            {error || 'Nenhum método de pagamento disponível no momento.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const filteredPaymentMethods = Object.entries(PAYMENT_METHODS).filter(([method]) => 
    availableMethods.includes(method)
  )

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-lg mb-1">Método de Pagamento</h3>
        <p className="text-sm text-muted-foreground">Escolha como deseja contribuir • {filteredPaymentMethods.length} opções disponíveis</p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className="space-y-3"
      >
        {filteredPaymentMethods.map(([method, config]) => {
          const IconComponent = iconMap[config.icon as keyof typeof iconMap]
          
          return (
            <Label
              key={method}
              className={cn(
                'group relative flex items-center gap-4 rounded-2xl border-2 bg-card p-4 cursor-pointer transition-all duration-300 overflow-hidden',
                'hover:shadow-xl hover:scale-[1.02] hover:border-videira-cyan/50',
                value === method && 'border-videira-cyan bg-gradient-to-r from-videira-cyan/10 via-videira-blue/5 to-transparent shadow-lg scale-[1.02] ring-2 ring-videira-cyan/20',
                !value || value !== method && 'border-muted',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
              )}
            >
              {/* Glow effect on selected */}
              {value === method && (
                <div className="absolute inset-0 bg-gradient-to-r from-videira-cyan/20 to-videira-blue/20 blur-xl" />
              )}
              
              <RadioGroupItem value={method} disabled={disabled} className="relative z-10" />
              
              <div className={cn(
                "relative z-10 p-3 rounded-xl transition-all duration-300",
                value === method ? "bg-gradient-to-br from-videira-cyan to-videira-blue shadow-lg" : "bg-muted/50 group-hover:bg-videira-cyan/20"
              )}>
                <IconComponent className={cn(
                  "h-7 w-7 flex-shrink-0 transition-all duration-300",
                  value === method ? "text-white" : "text-videira-cyan group-hover:scale-110"
                )} />
              </div>
              
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "font-bold text-base transition-colors",
                    value === method && "text-videira-cyan"
                  )}>{config.label}</span>
                  
                  {/* Badges específicos por método */}
                  {method === 'pix' && (
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md animate-pulse">
                      ⚡ Instantâneo
                    </span>
                  )}
                  
                  {method === 'credit_card' && (
                    <div className="flex gap-1.5">
                      <div className="w-6 h-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded shadow-md text-white text-xs flex items-center justify-center font-black">
                        V
                      </div>
                      <div className="w-6 h-4 bg-gradient-to-br from-red-600 to-red-700 rounded shadow-md text-white text-xs flex items-center justify-center font-black">
                        M
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground font-medium">
                  {config.description}
                </p>
              </div>
              
              {/* Informações adicionais */}
              <div className="text-right relative z-10">
                {method === 'pix' && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-black text-green-600">Grátis</span>
                    <span className="text-xs text-muted-foreground">Sem taxas</span>
                  </div>
                )}
                {method === 'credit_card' && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-black text-videira-blue">12x</span>
                    <span className="text-xs text-muted-foreground">Sem juros</span>
                  </div>
                )}
                {method === 'boleto' && (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-lg font-black text-videira-purple">3 dias</span>
                    <span className="text-xs text-muted-foreground">Compensação</span>
                  </div>
                )}
              </div>
            </Label>
          )
        })}
      </RadioGroup>
    </div>
  )
}