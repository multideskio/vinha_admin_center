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
      {/* Header Premium */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
            <Banknote className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            Boleto Bancário Gerado
          </h3>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Use uma das opções abaixo para efetuar o pagamento de <span className="font-bold text-videira-cyan">{formatCurrency(amount)}</span>
        </p>
      </div>

      {/* Layout em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Código de Barras Premium */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-orange-200 dark:border-orange-800">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900" />
          <div className="relative p-6 space-y-4">
            <div className="text-center">
              <div className="relative mb-3">
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl" />
                <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-2xl w-fit mx-auto shadow-lg">
                  <Banknote className="h-10 w-10 text-white" />
                </div>
              </div>
              <h4 className="font-bold text-lg text-orange-800 dark:text-orange-200">
                Código de Barras
              </h4>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-bold text-orange-700 dark:text-orange-300 block">
                📋 Linha digitável:
              </Label>
              <div className="flex gap-2">
                <Input
                  value={paymentDetails.DigitableLine || ''}
                  readOnly
                  className="font-mono text-xs bg-white dark:bg-orange-950 border-2"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(paymentDetails.DigitableLine, 'Boleto')}
                  className="px-4 border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white font-bold transition-all"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
                    />
                  </svg>
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções e Download */}
        <div className="flex flex-col justify-center space-y-4">
          {/* Instruções Premium */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 dark:border-blue-800">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950" />
            <div className="relative p-4">
              <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Como pagar:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2 font-medium">
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
                  <span>Acesse o app ou site do seu banco</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <span>Escolha "Pagar boleto"</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                  <span>Digite o código ou baixe o PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">✓</div>
                  <span>Confirme o pagamento</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Botão de Download Premium */}
          <Button asChild className="w-full h-12 font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105" size="lg">
            <a 
              href={paymentDetails.Url} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Aviso Importante Premium */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-200 dark:border-amber-800">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950" />
            <div className="relative p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg flex-shrink-0">
                  <svg 
                    className="h-5 w-5 text-amber-600 dark:text-amber-400" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                    ⏱️ Importante:
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mt-1">
                    Vencimento em <span className="font-bold">3 dias úteis</span>. Confirmação em até 2 dias após pagamento.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais Premium */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-videira-cyan/30">
            <div className="absolute inset-0 bg-gradient-to-br from-videira-cyan/5 to-videira-blue/5" />
            <div className="relative p-4">
              <h5 className="text-sm font-bold text-videira-cyan mb-2 flex items-center gap-2">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Informações:
              </h5>
              <div className="text-sm text-muted-foreground space-y-1 font-medium">
                <p>• Valor: <span className="font-bold text-videira-cyan">{formatCurrency(amount)}</span></p>
                <p>• Processamento: 1-2 dias úteis</p>
                <p>• Confirmação automática após compensação</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Voltar */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 border-2 hover:border-videira-cyan"
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