/**
 * Componente de confirmação de pagamento bem-sucedido
 */

import React from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

import { PaymentSuccessProps } from '../types'
import { formatCurrency, getContributionTypeLabel } from '../utils'

export default function PaymentSuccess({
  amount,
  contributionType,
  onNewContribution
}: PaymentSuccessProps) {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950 dark:to-green-900 dark:border-green-800">
      <CardContent className="flex flex-col items-center justify-center p-10 text-center">
        {/* Ícone de Sucesso */}
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full mb-6">
          <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold mb-2 text-green-800 dark:text-green-200">
          Pagamento Confirmado!
        </h2>

        {/* Detalhes da Contribuição */}
        <div className="mb-6 space-y-2">
          <p className="text-green-700 dark:text-green-300">
            Sua contribuição de{' '}
            <span className="font-semibold">{formatCurrency(amount)}</span>{' '}
            foi recebida com sucesso.
          </p>
          
          <p className="text-sm text-green-600 dark:text-green-400">
            Tipo: {getContributionTypeLabel(contributionType)}
          </p>
          
          <p className="text-sm text-green-600 dark:text-green-400">
            Obrigado por contribuir com o ministério!
          </p>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 max-w-md">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            O que acontece agora?
          </h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 text-left">
            <li>• Sua contribuição foi registrada no sistema</li>
            <li>• Um recibo será enviado por email (se disponível)</li>
            <li>• O valor será direcionado para o ministério</li>
            <li>• Você pode fazer uma nova contribuição a qualquer momento</li>
          </ul>
        </div>

        {/* Botão Nova Contribuição */}
        <Button
          onClick={onNewContribution}
          size="lg"
          className="min-w-[200px]"
        >
          Fazer Nova Contribuição
        </Button>

        {/* Mensagem de Gratidão */}
        <div className="mt-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300 italic">
            "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, 
            pois Deus ama quem dá com alegria."
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            2 Coríntios 9:7
          </p>
        </div>
      </CardContent>
    </Card>
  )
}