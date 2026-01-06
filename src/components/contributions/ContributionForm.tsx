/**
 * Componente principal do sistema de contribuições
 * Orquestra todos os componentes filhos e gerencia o fluxo completo
 * @lastReview 2025-01-05 15:30
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
  userRole: _userRole, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSuccess,
  onError,
  className,
}: ContributionFormProps) {
  const [availablePaymentMethods, setAvailablePaymentMethods] = React.useState<string[]>([])
  const [isLoadingMethods, setIsLoadingMethods] = React.useState(true)

  // Busca métodos disponíveis no mount
  React.useEffect(() => {
    const fetchMethods = async () => {
      try {
        const response = await fetch('/api/v1/payment-methods')
        if (response.ok) {
          const data = await response.json()
          setAvailablePaymentMethods(data.methods || [])
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error)
      } finally {
        setIsLoadingMethods(false)
      }
    }
    fetchMethods()
  }, [])

  // Hook principal de contribuição
  const {
    formData,
    paymentState,
    cardState: _cardState, // eslint-disable-line @typescript-eslint/no-unused-vars
    updateFormData,
    updateCardState: _updateCardState, // eslint-disable-line @typescript-eslint/no-unused-vars
    setCurrentStep,
    setPixStatus,
    handleFormSubmit,
    handleCardPayment,
    handleReset,
    handleBack,
  } = useContribution({ onSuccess, onError })

  // Hook do timer PIX
  const { seconds: pixCountdown, reset: resetTimer } = usePaymentTimer({
    initialSeconds: PIX_COUNTDOWN_SECONDS,
    isActive: paymentState.pixStatus === 'pending',
    onExpired: () => setPixStatus('expired'),
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
    onError: (error) => onError?.(error),
  })

  // Handlers
  const handleDataFormSubmit = (data: ContributionData) => {
    // Valida se o método de pagamento está disponível
    if (!availablePaymentMethods.includes(data.paymentMethod)) {
      onError?.(
        `Método de pagamento "${data.paymentMethod}" não está disponível. Configure em Admin > Gateways.`,
      )
      return
    }

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
              <div className="relative overflow-hidden rounded-2xl border-2 border-red-200 dark:border-red-800 shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-400/20 rounded-full blur-3xl" />
                <div className="relative z-10 p-8">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-red-500/30 rounded-full blur-2xl animate-pulse" />
                    <div className="relative bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-full w-fit mx-auto shadow-2xl">
                      <svg
                        className="h-12 w-12 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-red-800 dark:text-red-200 mb-3">
                    ⏰ Tempo Esgotado
                  </h3>
                  <p className="text-base text-red-700 dark:text-red-300 mb-6 font-medium">
                    O tempo para pagamento via PIX expirou.
                    <br />
                    Gere um novo código para continuar sua contribuição.
                  </p>
                  <Button
                    onClick={handleBackToForm}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold shadow-lg h-12 px-6"
                  >
                    🔄 Gerar Novo PIX
                  </Button>
                </div>
              </div>
            </div>
          )
        }

        if (!paymentState.transactionId) {
          onError?.('Transaction ID não encontrado')
          return null
        }

        return (
          <PixPayment
            amount={formData.amount}
            transactionId={paymentState.transactionId}
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
      <div className="space-y-6">
        {/* Layout responsivo otimizado */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Formulário de dados - 2 colunas */}
          <div className="xl:col-span-2">
            <ContributionDataForm
              onSubmit={handleDataFormSubmit}
              onChange={updateFormData}
              isLoading={paymentState.isProcessing}
              defaultValues={formData}
            />
          </div>

          {/* Seletor de método de pagamento - 1 coluna */}
          <div className="xl:col-span-1">
            <PaymentMethodSelector
              value={formData.paymentMethod}
              onChange={handlePaymentMethodChange}
              disabled={paymentState.isProcessing}
            />
          </div>
        </div>

        <Separator />

        {/* Resumo Premium Sticky */}
        {formData.amount > 0 && (
          <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur-sm border-t-2 border-videira-cyan/20 p-4">
            <div className="w-full">
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10" />
                <div className="relative p-6 backdrop-blur-sm">
                  <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                    <div className="text-center lg:text-left space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <p className="text-sm text-muted-foreground font-medium">
                          Total da Contribuição
                        </p>
                        {formData.contributionType && (
                          <div className="inline-flex items-center gap-2 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-videira-cyan animate-pulse" />
                            <p className="text-xs font-semibold capitalize">
                              {formData.contributionType}
                            </p>
                          </div>
                        )}
                      </div>
                      <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-videira-cyan to-videira-blue bg-clip-text text-transparent">
                        R$ {Number(formData.amount).toFixed(2)}
                      </p>
                      {formData.description && (
                        <p className="text-xs text-muted-foreground max-w-md">
                          &ldquo;{formData.description}&rdquo;
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleDataFormSubmit(formData)}
                      size="lg"
                      disabled={
                        isLoadingMethods ||
                        paymentState.isProcessing ||
                        !formData.amount ||
                        formData.amount <= 0 ||
                        availablePaymentMethods.length === 0 ||
                        !availablePaymentMethods.includes(formData.paymentMethod)
                      }
                      className="min-w-[220px] h-12 font-bold text-base bg-gradient-to-r from-videira-cyan to-videira-blue hover:from-videira-cyan/90 hover:to-videira-blue/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                      {isLoadingMethods ? (
                        <>
                          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                          Verificando métodos...
                        </>
                      ) : paymentState.isProcessing ? (
                        <>
                          <div className="mr-2 h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent" />
                          Processando...
                        </>
                      ) : availablePaymentMethods.length === 0 ? (
                        <>
                          <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Métodos Indisponíveis
                        </>
                      ) : (
                        <>
                          <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges de Segurança Premium */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-green-200 dark:border-green-800">
          <div className="absolute inset-0 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 dark:from-green-950 dark:via-blue-950 dark:to-purple-950" />
          <div className="relative p-4">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="flex flex-col items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg
                    className="h-5 w-5 text-green-700 dark:text-green-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs font-bold text-green-700 dark:text-green-300">
                  SSL 256-bit
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg
                    className="h-5 w-5 text-blue-700 dark:text-blue-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">PCI-DSS</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <div className="h-5 w-5 bg-gradient-to-br from-purple-600 to-purple-700 rounded text-white text-sm flex items-center justify-center font-black">
                    C
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  Cielo
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">
                Dados criptografados ponta a ponta • Não armazenamos informações de cartão
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Indicador de Progresso com Videira */}
      <div className="relative overflow-hidden rounded-2xl p-1">
        <div className="absolute inset-0 videira-gradient opacity-20" />
        <div className="relative bg-background rounded-xl p-4">
          <ProgressIndicator currentStep={paymentState.currentStep} />
        </div>
      </div>

      {/* Header Premium */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 videira-gradient opacity-20 blur-xl rounded-full" />
            <div className="relative bg-gradient-to-br from-videira-cyan to-videira-blue p-3 rounded-2xl shadow-lg">
              <DollarSign className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-videira-cyan via-videira-blue to-videira-purple bg-clip-text text-transparent">
              Contribuição Segura
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">SSL 256-bit</span>
              </div>
              <span>•</span>
              <span className="font-medium">Cielo Gateway</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Sistema de pagamento certificado PCI-DSS com criptografia de ponta a ponta. Seus dados
          estão 100% protegidos.
        </p>
      </div>

      {/* Card Principal com Videira */}
      <Card className="shadow-2xl border-t-4 border-t-videira-cyan relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-videira-cyan/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-videira-purple/5 to-transparent rounded-full blur-3xl" />

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                {paymentState.currentStep === 1 && (
                  <>
                    <DollarSign className="h-4 w-4" />
                    Dados da Contribuição
                  </>
                )}
                {paymentState.currentStep === 2 && (
                  <>
                    {formData.paymentMethod === 'pix' && (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4"
                        />
                      </svg>
                    )}
                    {formData.paymentMethod === 'credit_card' && (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    )}
                    {formData.paymentMethod === 'boleto' && (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    )}
                    {formData.paymentMethod === 'pix' && 'Pagamento via PIX'}
                    {formData.paymentMethod === 'credit_card' && 'Pagamento com Cartão'}
                    {formData.paymentMethod === 'boleto' && 'Pagamento via Boleto'}
                  </>
                )}
                {paymentState.currentStep === 3 && (
                  <>
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Pagamento Confirmado
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {paymentState.currentStep === 1 &&
                  'Preencha os dados e escolha o método de pagamento'}
                {paymentState.currentStep === 2 &&
                  formData.paymentMethod === 'pix' &&
                  'Escaneie o QR Code ou copie a chave PIX para finalizar o pagamento'}
                {paymentState.currentStep === 2 &&
                  formData.paymentMethod === 'credit_card' &&
                  'Preencha os dados do seu cartão para finalizar o pagamento'}
                {paymentState.currentStep === 2 &&
                  formData.paymentMethod === 'boleto' &&
                  'Seu boleto foi gerado com sucesso. Você pode baixar o PDF ou copiar o código de barras.'}
                {paymentState.currentStep === 3 && 'Sua contribuição foi processada com sucesso!'}
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Voltar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  )
}
