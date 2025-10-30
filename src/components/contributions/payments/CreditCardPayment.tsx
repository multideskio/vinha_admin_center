/**
 * Componente de pagamento com cartão de crédito
 */

import React, { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import Cards, { Focused } from 'react-credit-cards-2'
import 'react-credit-cards-2/dist/es/styles-compiled.css'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Pagamento com Cartão
        </h3>
        <p className="text-sm text-muted-foreground">
          Preencha os dados do seu cartão de crédito para finalizar o pagamento
        </p>
      </div>

      {/* Layout em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualização do Cartão */}
        <div className="flex justify-center items-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6">
          <Cards
            number={cardState.number}
            expiry={cardState.expiry}
            cvc={cardState.cvc}
            name={cardState.name}
            focused={cardState.focus}
          />
        </div>

        {/* Formulário do Cartão */}
        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-3">
            {/* Número do Cartão */}
            <Input
              type="text"
              name="number"
              placeholder="Número do Cartão"
              value={formatCardNumber(cardState.number)}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              className="text-center font-mono"
              maxLength={19} // 16 dígitos + 3 espaços
            />

            {/* Nome no Cartão */}
            <Input
              type="text"
              name="name"
              placeholder="Nome no Cartão"
              value={cardState.name}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              className="text-center uppercase"
              maxLength={50}
            />

            {/* Validade e CVC */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="text"
                name="expiry"
                placeholder="MM/AA"
                value={cardState.expiry}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className="text-center font-mono"
                maxLength={5}
              />
              <Input
                type="text"
                name="cvc"
                placeholder="CVC"
                value={cardState.cvc}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className="text-center font-mono"
                maxLength={4}
              />
            </div>
          </div>

          {/* Seletor de parcelas */}
          <div>
            <label className="block text-sm font-medium text-green-700 dark:text-green-300 mb-1">Parcelamento</label>
            <select
              value={installments}
              onChange={e => setInstallments(Number(e.target.value))}
              className="input w-full rounded px-3 py-2 border"
              disabled={isLoading}
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {`${i + 1}x de R$ ${(amount / (i + 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </option>
              ))}
            </select>
          </div>

          {/* Resumo do Pagamento */}
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Total a pagar
                </p>
                <p className="text-lg font-bold text-green-800 dark:text-green-200">
                  {formatCurrency(amount)}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-2">
                  {installments}x de R$ {(amount / installments).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600 dark:text-green-400">
                  Parcelamento disponível
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  até 12x sem juros
                </p>
              </div>
            </div>
          </div>

          {/* Botão de Pagamento */}
          <Button
            onClick={handleSubmit}
            className="w-full"
            size="lg"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              `Pagar ${formatCurrency(amount)}`
            )}
          </Button>

          {/* Informações de Segurança */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-xs font-medium">Transação 100% segura</span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Seus dados são criptografados e não ficam armazenados
            </p>
          </div>
        </div>
      </div>

      {/* Botão Voltar */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
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