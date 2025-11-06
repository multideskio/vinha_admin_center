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
    <Card className="relative overflow-hidden shadow-2xl border-t-4 border-t-green-500">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 dark:from-green-950 dark:via-emerald-950 dark:to-cyan-950" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-400/20 to-transparent rounded-full blur-3xl" />
      
      <CardContent className="relative z-10 flex flex-col items-center justify-center p-10 text-center">
        {/* Ícone de Sucesso Animado */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
          <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-full shadow-2xl">
            <CheckCircle className="h-20 w-20 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Título Premium */}
        <h2 className="text-4xl font-black mb-3 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
          Pagamento Confirmado!
        </h2>

        {/* Detalhes da Contribuição */}
        <div className="mb-8 space-y-3">
          <p className="text-lg text-green-700 dark:text-green-300 font-medium">
            Sua contribuição de{' '}
            <span className="font-black text-2xl bg-gradient-to-r from-videira-cyan to-videira-blue bg-clip-text text-transparent">
              {formatCurrency(amount)}
            </span>{' '}
            foi recebida!
          </p>
          
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-black/30 px-4 py-2 rounded-full border-2 border-green-200 dark:border-green-800">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-bold text-green-700 dark:text-green-300 capitalize">
              {getContributionTypeLabel(contributionType)}
            </span>
          </div>
          
          <p className="text-base text-green-600 dark:text-green-400 font-semibold mt-4">
            🙏 Obrigado por contribuir com o ministério!
          </p>
        </div>

        {/* Informações Adicionais Premium */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-green-200 dark:border-green-800 mb-8 max-w-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-green-50 dark:from-black dark:to-green-950" />
          <div className="relative p-6">
            <h3 className="font-bold text-lg text-green-800 dark:text-green-200 mb-4 flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Próximos Passos
            </h3>
            <ul className="text-sm text-green-700 dark:text-green-300 space-y-3 text-left font-medium">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
                <span>Contribuição registrada no sistema</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
                <span>Recibo enviado por email (se configurado)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">✓</div>
                <span>Valor direcionado para o ministério</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Botão Nova Contribuição Premium */}
        <Button
          onClick={onNewContribution}
          size="lg"
          className="min-w-[240px] h-12 font-bold bg-gradient-to-r from-videira-cyan to-videira-blue hover:from-videira-cyan/90 hover:to-videira-blue/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
        >
          Fazer Nova Contribuição
        </Button>

        {/* Mensagem de Gratidão Premium */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-videira-purple/30 mt-8 max-w-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-videira-purple/5 to-videira-blue/5" />
          <div className="relative p-6">
            <p className="text-base text-foreground italic font-medium leading-relaxed">
              "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, 
              pois Deus ama quem dá com alegria."
            </p>
            <p className="text-sm text-videira-purple font-bold mt-3">
              — 2 Coríntios 9:7
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}