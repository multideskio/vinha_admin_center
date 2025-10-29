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
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          Pagamento via PIX
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Use uma das opções abaixo para finalizar seu pagamento de {formatCurrency(amount)}
        </p>
      </div>

      {/* Layout em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
          <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
            {qrCodeSrc ? (
              <Image
                src={qrCodeSrc}
                width={200}
                height={200}
                alt="QR Code Pix"
                className="rounded-lg"
              />
            ) : (
              <Skeleton className="h-[200px] w-[200px] rounded-lg" />
            )}
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Escaneie com o app do seu banco
          </p>
        </div>

        {/* Chave PIX e Instruções */}
        <div className="flex flex-col justify-center space-y-4">
          {/* Chave PIX */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Chave PIX:
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={paymentDetails.QrCodeString || ''}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(paymentDetails.QrCodeString, 'Pix')}
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

          {/* Status Card */}
          <PaymentStatusCard
            status="pending"
            countdown={countdown}
            onManualCheck={onManualCheck}
            isChecking={isChecking}
          />

          {/* Instruções */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Como pagar:
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Abra o app do seu banco</li>
              <li>• Escolha "Pagar com PIX"</li>
              <li>• Escaneie o QR Code ou cole a chave</li>
              <li>• Confirme o pagamento</li>
            </ul>
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