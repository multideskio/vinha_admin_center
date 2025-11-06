/**
 * Componente de pagamento PIX
 */

import React from 'react'
import Image from 'next/image'
import { QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

import { PixPaymentProps } from '../types'
import { getFullQrCodeSrc, copyToClipboard, formatCurrency } from '../utils'
import PaymentStatusCard from '../ui/PaymentStatusCard'

export default function PixPayment({
  amount,
  transactionId,
  paymentDetails,
  countdown,
  onSuccess,
  onExpired,
  onBack,
  onManualCheck,
  isChecking = false
}: PixPaymentProps) {
  const { toast } = useToast()
  const qrCodeSrc = getFullQrCodeSrc(paymentDetails.QrCodeBase64Image)

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
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            Pagamento via PIX
          </h3>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Use uma das opções abaixo para finalizar seu pagamento de <span className="font-bold text-videira-cyan">{formatCurrency(amount)}</span>
        </p>
      </div>

      {/* Layout em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Premium */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-green-200 dark:border-green-800">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950" />
          <div className="relative flex flex-col items-center justify-center p-6">
            <div className="bg-white p-4 rounded-2xl shadow-xl mb-4 ring-2 ring-green-200">
            {qrCodeSrc ? (
              <Image
                src={qrCodeSrc}
                width={200}
                height={200}
                alt="QR Code Pix"
                className="rounded-lg"
              />
            ) : (
              <Skeleton className="h-[200px] w-[200px] rounded-2xl" />
            )}
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-green-700 dark:text-green-300">
                📱 Escaneie com o app do seu banco
              </p>
              <p className="text-xs text-muted-foreground">
                Ou copie o código Pix Copia e Cola
              </p>
            </div>
          </div>
        </div>

        {/* Chave PIX e Instruções */}
        <div className="flex flex-col justify-center space-y-4">
          {/* Chave PIX Premium */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-videira-cyan/30 bg-gradient-to-br from-videira-cyan/5 to-videira-blue/5 p-4">
            <Label className="text-sm font-bold text-videira-cyan mb-2 block">
              🔑 Pix Copia e Cola
            </Label>
            <div className="flex gap-2">
              <Input
                value={paymentDetails.QrCodeString || ''}
                readOnly
                className="font-mono text-xs border-2 bg-white dark:bg-black"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(paymentDetails.QrCodeString, 'Pix')}
                className="px-4 border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white font-bold transition-all"
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

          {/* Status Card */}
          <PaymentStatusCard
            status="pending"
            countdown={countdown}
            onManualCheck={onManualCheck}
            isChecking={isChecking}
          />

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
                  <span>Abra o app do seu banco</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <span>Escolha "Pagar com PIX"</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
                  <span>Escaneie o QR Code ou cole a chave</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">✓</div>
                  <span>Confirme o pagamento</span>
                </li>
              </ul>
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