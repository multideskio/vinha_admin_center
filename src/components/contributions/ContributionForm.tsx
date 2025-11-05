/**
 * Componente principal do sistema de contribuições
 * Orquestra todos os componentes filhos e gerencia o fluxo completo
 */

import React from 'react'
import { DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// Hooks
import useContribution from './hooks/useContribution'
import usePaymentSync from './hooks/usePaymentSync'
import usePaymentTimer from './hooks/usePaymentTimer'

// Componentes
import ProgressIndicator from './ui/ProgressIndicator'
import ContributionDataForm from './forms/ContributionDataForm'
import PaymentMethodSelector from './forms/PaymentMethodSelector'
import PixPayment from './payments/PixPayment'
import CreditCardPayment from './payments/CreditCardPayment'
import BoletoPayment from './payments/BoletoPayment'
import PaymentSuccess from './payments/PaymentSuccess'

// Types
import { ContributionFormProps, ContributionData } from './types'
import { PIX_COUNTDOWN_SECONDS } from './types'

export default function ContributionForm({
  userRole,
  onSuccess,
  onError,
  className
}: ContributionFormProps) {
  // Hook principal de contribuição
  const {
    formData,
    paymentState,
    cardState,
    updateFormData,
    updateCardState,
    setCurrentStep,
    setPixStatus,
    handleFormSubmit,
    handleCardPayment,
    handleReset,
    handleBack
  } = useContribution({ onSuccess, onError })

  // Hook do timer PIX
  const { seconds: pixCountdown, reset: resetTimer } = usePaymentTimer({
    initialSeconds: PIX_COUNTDOWN_SECONDS,
    isActive: paymentState.pixStatus === 'pending',
    onExpired: () => setPixStatus('expired')
  })

  // Hook de sincronização PIX
  const { isChecking, checkPaymentManually } = usePaymentSync({
    transactionId: paymentState.transactionId,
    paymentMethod: formData.paymentMethod,
    pixStatus: paymentState.pixStatus,
    onSuccess: () => {
      setPixStatus('confirmed')
      setCurrentStep(3)
    },
    onError: (error) => onError?.(error)
  })

  // Handlers
  const handleDataFormSubmit = (data: ContributionData) => {
    updateFormData(data)
    handleFormSubmit(data)
  }

  const handlePaymentMethodChange = (method: typeof formData.paymentMethod) => {
    updateFormData({ paymentMethod: method })
  }

  const handlePixExpired = () => {
    setPixStatus('expired')
  }

  const handleNewContribution = () => {
    handleReset()
    resetTimer()
  }

  const handleBackToForm = () => {
    handleBack()
    resetTimer()
  }

  // Renderização condicional baseada no estado
  const renderContent = () => {
    // Etapa 3: Confirmação de sucesso
    if (paymentState.currentStep === 3 || paymentState.pixStatus === 'confirmed') {
      return (
        <PaymentSuccess
          amount={formData.amount}
          contributionType={formData.contributionType}
          onNewContribution={handleNewContribution}
        />
      )
    }

    // Etapa 2: Processamento de pagamento
    if (paymentState.currentStep === 2 && paymentState.showPaymentDetails) {
      if (formData.paymentMethod === 'pix' && paymentState.paymentDetails) {
        if (paymentState.pixStatus === 'expired') {
          return (
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full w-fit mx-auto mb-4">
                  <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Tempo Esgotado
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  O tempo para pagamento via PIX expirou. Gere um novo código para continuar.
                </p>
                <Button
                  onClick={handleBackToForm}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
                >
                  Gerar Novo PIX
                </Button>
              </div>
            </div>
          )
        }

        return (
          <PixPayment
            amount={formData.amount}
            transactionId={paymentState.transactionId!}
            paymentDetails={paymentState.paymentDetails}
            countdown={pixCountdown}
            onSuccess={() => {
              setPixStatus('confirmed')
              setCurrentStep(3)
            }}
            onExpired={handlePixExpired}
            onBack={handleBackToForm}
            onManualCheck={checkPaymentManually}
            isChecking={isChecking}
          />
        )
      }

      if (formData.paymentMethod === 'credit_card') {
        return (
          <CreditCardPayment
            amount={formData.amount}
            onSubmit={handleCardPayment}
            onBack={handleBackToForm}
            isLoading={paymentState.isProcessing}
          />
        )
      }

      if (formData.paymentMethod === 'boleto' && paymentState.paymentDetails) {
        return (
          <BoletoPayment
            amount={formData.amount}
            paymentDetails={paymentState.paymentDetails}
            onBack={handleBackToForm}
          />
        )
      }
    }

    // Etapa 1: Formulário de dados
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de dados */}
          <ContributionDataForm
            onSubmit={handleDataFormSubmit}
            onChange={updateFormData}
            isLoading={paymentState.isProcessing}
            defaultValues={formData}
          />

          {/* Seletor de método de pagamento */}
          <PaymentMethodSelector
            value={formData.paymentMethod}
            onChange={handlePaymentMethodChange}
            disabled={paymentState.isProcessing}
          />
        </div>

        <Separator />

        {/* Resumo e Botão */}
        {formData.amount > 0 && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="text-center sm:text-left">
                <p className="text-xs text-muted-foreground">Valor da contribuição:</p>
                <p className="text-xl font-bold text-foreground">R$ {Number(formData.amount).toFixed(2)}</p>
                {formData.contributionType && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {formData.contributionType}
                  </p>
                )}
              </div>
              <Button
                onClick={() => handleDataFormSubmit(formData)}
                size="lg"
                disabled={paymentState.isProcessing || !formData.amount || formData.amount <= 0}
                className="min-w-[180px] h-10 font-semibold"
              >
                {paymentState.isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Processando...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
                    </svg>
                    Prosseguir com Segurança
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Badges de Segurança */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">SSL 256-bit</span>
            </div>
            <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">PCI Compliant</span>
            </div>
            <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300">
              <div className="h-4 w-4 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">C</div>
              <span className="font-medium">Gateway Cielo</span>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            🔒 Dados protegidos por criptografia • Não armazenamos informações de cartão
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-4 max-w-6xl mx-auto", className)}>
      {/* Indicador de Progresso */}
      <ProgressIndicator currentStep={paymentState.currentStep} />

      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <div className="bg-primary/10 p-2 rounded-full">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Contribuição Segura
            </h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
              </svg>
              <span>Ambiente 100% seguro</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto">
          Realize sua contribuição de forma segura através de nosso sistema protegido.
        </p>
      </div>

      {/* Card Principal */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                {paymentState.currentStep === 1 && (
                  <>
                    <DollarSign className="h-4 w-4" />
                    Dados da Contribuição
                  </>
                )}
                {paymentState.currentStep === 2 && (
                  <>
                    {formData.paymentMethod === 'pix' && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" /></svg>}
                    {formData.paymentMethod === 'credit_card' && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
                    {formData.paymentMethod === 'boleto' && <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    {formData.paymentMethod === 'pix' && 'Pagamento via PIX'}
                    {formData.paymentMethod === 'credit_card' && 'Pagamento com Cartão'}
                    {formData.paymentMethod === 'boleto' && 'Pagamento via Boleto'}
                  </>
                )}
                {paymentState.currentStep === 3 && (
                  <>
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Pagamento Confirmado
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {paymentState.currentStep === 1 && "Preencha os dados e escolha o método de pagamento"}
                {paymentState.currentStep === 2 && formData.paymentMethod === 'pix' && "Escaneie o QR Code ou copie a chave PIX para finalizar o pagamento"}
                {paymentState.currentStep === 2 && formData.paymentMethod === 'credit_card' && "Preencha os dados do seu cartão para finalizar o pagamento"}
                {paymentState.currentStep === 2 && formData.paymentMethod === 'boleto' && "Seu boleto foi gerado com sucesso. Você pode baixar o PDF ou copiar o código de barras."}
                {paymentState.currentStep === 3 && "Sua contribuição foi processada com sucesso!"}
              </CardDescription>
            </div>
            
            {/* Botão Voltar (apenas na etapa 2) */}
            {paymentState.currentStep === 2 && paymentState.showPaymentDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToForm}
                className="flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}