/**
 * Componente de pagamento via boleto bancário
 */

import React from 'react'
import { Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

import { BoletoPaymentProps } from '../types'
import { copyToClipboard, formatCurrency } from '../utils'

export default function BoletoPayment({
  amount,
  paymentDetails,
  onBack
}: BoletoPaymentProps) {
  const { toast } = useToast()

  const handleCopy = async (code: string | undefined, type: string) => {
    if (!code) return
    
    const success = await copyToClipboard(code)
    if (success) {
      toast({
        title: 'Copiado!',
        description: `Código do ${type} copiado com sucesso.`,
      })
    } else {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o código.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <Banknote className="h-5 w-5 text-primary" />
          Boleto Bancário Gerado
        </h3>
        <p className="text-sm text-muted-foreground">
          Use uma das opções abaixo para efetuar o pagamento de {formatCurrency(amount)}
        </p>
      </div>

      {/* Layout em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Código de Barras */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-full w-fit mx-auto mb-3">
                <Banknote className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Código de Barras
              </h4>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium text-orange-700 dark:text-orange-300">
                Linha digitável:
              </Label>
              <div className="flex gap-2">
                <Input
                  value={paymentDetails.DigitableLine || ''}
                  readOnly
                  className="font-mono text-xs bg-white dark:bg-orange-950"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(paymentDetails.DigitableLine, 'Boleto')}
                  className="px-3"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções e Download */}
        <div className="flex flex-col justify-center space-y-4">
          {/* Instruções */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Como pagar:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Acesse o app ou site do seu banco</li>
              <li>• Escolha "Pagar boleto"</li>
              <li>• Digite o código ou baixe o PDF</li>
              <li>• Confirme o pagamento</li>
            </ul>
          </div>

          {/* Botão de Download */}
          <Button asChild className="w-full" size="lg">
            <a 
              href={paymentDetails.Url} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              Baixar Boleto PDF
            </a>
          </Button>

          {/* Aviso Importante */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg 
                className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                  Importante:
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Vencimento em 3 dias úteis. Confirmação em até 2 dias após pagamento.
                </p>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
            <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Informações do pagamento:
            </h5>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>• Valor: {formatCurrency(amount)}</p>
              <p>• Processamento: 1-2 dias úteis</p>
              <p>• Confirmação automática após compensação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Voltar */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Button>
      </div>
    </div>
  )
}