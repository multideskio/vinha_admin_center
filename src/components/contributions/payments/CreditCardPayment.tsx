/**
 * Componente de pagamento com cartão de crédito
 */

import React, { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import Cards, { Focused } from 'react-credit-cards-2'
import 'react-credit-cards-2/dist/es/styles-compiled.css'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCardPaymentProps, CardData } from '../types'
import { formatCardNumber, formatExpiryDate, formatCVC, formatCurrency, isValidCardData } from '../utils'

export default function CreditCardPayment({
  amount,
  onSubmit,
  onBack,
  isLoading = false
}: CreditCardPaymentProps) {
  const [cardState, setCardState] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    focus: '' as Focused,
  })
  const [installments, setInstallments] = useState(1)

  const handleInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target
    let formattedValue = value

    if (name === 'number') {
      formattedValue = value.replace(/\D/g, '').slice(0, 16)
    } else if (name === 'expiry') {
      formattedValue = formatExpiryDate(value)
    } else if (name === 'cvc') {
      formattedValue = formatCVC(value)
    }

    setCardState((prev) => ({ ...prev, [name]: formattedValue }))
  }

  const handleInputFocus = (evt: React.FocusEvent<HTMLInputElement>) => {
    setCardState((prev) => ({ ...prev, focus: evt.target.name as Focused }))
  }

  const handleSubmit = () => {
    const cardData: CardData = {
      number: cardState.number,
      holder: cardState.name,
      expirationDate: cardState.expiry,
      securityCode: cardState.cvc,
      brand: 'Visa', // Pode ser detectado automaticamente
    }

    onSubmit(cardData, installments)
  }

  const isFormValid = isValidCardData({
    number: cardState.number,
    holder: cardState.name,
    expirationDate: cardState.expiry,
    securityCode: cardState.cvc
  })

  return (
    <div className="space-y-6">
      {/* Header Premium */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="p-2 bg-gradient-to-br from-videira-blue to-videira-purple rounded-xl shadow-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-videira-blue to-videira-purple bg-clip-text text-transparent">
            Pagamento com Cartão
          </h3>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Preencha os dados do seu cartão de crédito • <span className="font-bold text-videira-cyan">Até 12x sem juros</span>
        </p>
      </div>

      {/* Layout em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualização do Cartão Premium */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-videira-blue/30">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" />
          <div className="relative flex justify-center items-center p-8">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <Cards
                number={cardState.number}
                expiry={cardState.expiry}
                cvc={cardState.cvc}
                name={cardState.name}
                focused={cardState.focus}
              />
            </div>
          </div>
        </div>

        {/* Formulário do Cartão Premium */}
        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-3">
            {/* Número do Cartão */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">Número do Cartão</Label>
              <Input
                type="text"
                name="number"
                placeholder="0000 0000 0000 0000"
                value={formatCardNumber(cardState.number)}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className="text-center font-mono text-lg h-12 border-2 focus:border-videira-cyan"
                maxLength={19}
              />
            </div>

            {/* Nome no Cartão */}
            <div>
              <Label className="text-xs font-bold text-muted-foreground mb-2 block">Nome no Cartão</Label>
              <Input
                type="text"
                name="name"
                placeholder="NOME COMO NO CARTÃO"
                value={cardState.name}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className="text-center uppercase h-12 border-2 focus:border-videira-cyan"
                maxLength={50}
              />
            </div>

            {/* Validade e CVC */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-muted-foreground mb-2 block">Validade</Label>
                <Input
                  type="text"
                  name="expiry"
                  placeholder="MM/AA"
                  value={cardState.expiry}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  className="text-center font-mono text-lg h-12 border-2 focus:border-videira-cyan"
                  maxLength={5}
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-muted-foreground mb-2 block">CVV</Label>
                <Input
                  type="text"
                  name="cvc"
                  placeholder="000"
                  value={cardState.cvc}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  className="text-center font-mono text-lg h-12 border-2 focus:border-videira-cyan"
                  maxLength={4}
                />
              </div>
            </div>
          </div>

          {/* Seletor de parcelas Premium */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-videira-cyan/30 bg-gradient-to-br from-videira-cyan/5 to-videira-blue/5 p-4">
            <Label className="text-sm font-bold text-videira-cyan mb-2 block">💳 Parcelamento</Label>
            <select
              value={installments}
              onChange={e => setInstallments(Number(e.target.value))}
              className="w-full rounded-lg px-4 py-3 border-2 border-muted focus:border-videira-cyan font-semibold bg-white dark:bg-black transition-all"
              disabled={isLoading}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {`${i + 1}x de R$ ${(amount / (i + 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} {i === 0 ? '(à vista)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Resumo do Pagamento Premium */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-green-200 dark:border-green-800">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950" />
            <div className="relative p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-green-700 dark:text-green-300">
                    Total a pagar
                  </p>
                  <p className="text-2xl font-black text-green-800 dark:text-green-200">
                    {formatCurrency(amount)}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-2 font-medium">
                    {installments}x de R$ {(amount / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-flex flex-col items-end gap-1 bg-green-100 dark:bg-green-900 px-3 py-2 rounded-lg">
                    <p className="text-xs font-bold text-green-600 dark:text-green-400">
                      ✓ Sem juros
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      até 12x
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de Pagamento Premium */}
          <Button
            onClick={handleSubmit}
            className="w-full h-14 text-lg font-black bg-gradient-to-r from-videira-cyan to-videira-blue hover:from-videira-cyan/90 hover:to-videira-blue/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            size="lg"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processando Pagamento...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                </svg>
                Pagar {formatCurrency(amount)}
              </>
            )}
          </Button>

          {/* Informações de Segurança Premium */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 dark:border-blue-800">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950" />
            <div className="relative p-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-1">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" 
                    clipRule="evenodd" 
                  />
                </svg>
                <span className="text-sm font-bold">Transação 100% Segura</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                🔒 Dados criptografados de ponta a ponta • Não armazenamos informações de cartão
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Voltar */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
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