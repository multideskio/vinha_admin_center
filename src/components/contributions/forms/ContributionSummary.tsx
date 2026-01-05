/**
 * Componente de resumo da contribuição
 */

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContributionSummaryProps } from '../types'
import { formatCurrency, getPaymentMethodLabel, getContributionTypeLabel } from '../utils'
import SecurityBadges from '../ui/SecurityBadges'

export default function ContributionSummary({
  data,
  onEdit,
  onSubmit,
  isLoading = false,
}: ContributionSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Resumo da Contribuição */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="text-center sm:text-left">
            <p className="text-xs text-muted-foreground">Valor da contribuição:</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(data.amount)}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {getContributionTypeLabel(data.contributionType)}
            </p>
            {data.description && (
              <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                &ldquo;{data.description}&rdquo;
              </p>
            )}
          </div>

          <div className="text-center sm:text-right">
            <p className="text-xs text-muted-foreground">Método de pagamento:</p>
            <p className="text-sm font-medium">{getPaymentMethodLabel(data.paymentMethod)}</p>
            <Button variant="ghost" size="sm" onClick={onEdit} className="text-xs mt-1 h-6 px-2">
              Alterar
            </Button>
          </div>
        </div>
      </div>

      {/* Badges de Segurança */}
      <SecurityBadges />

      {/* Botão de Prosseguir */}
      <Button
        onClick={onSubmit}
        size="lg"
        disabled={isLoading}
        className="w-full min-h-[48px] font-semibold"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z"
                clipRule="evenodd"
              />
            </svg>
            Prosseguir com Segurança
          </>
        )}
      </Button>

      {/* Informações de Segurança */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          🔒 Transação protegida por criptografia SSL 256-bit
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Seus dados estão seguros e não são armazenados em nossos servidores
        </p>
      </div>
    </div>
  )
}
