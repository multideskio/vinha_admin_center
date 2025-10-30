/**
 * Hook principal para gerenciamento de estado do sistema de contribuições
 */

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  ContributionFormData,
  PaymentState,
  CardState,
  ContributionData,
  CardData,
  PaymentStep,
  PixStatus,
  UseContributionOptions,
  UseContributionReturn,
  CieloPaymentResponse
} from '../types'
import { devLog, generateTransactionId } from '../utils'

const initialFormData: ContributionFormData = {
  amount: 0,
  paymentMethod: 'pix',
  contributionType: 'dizimo',
  description: ''
}

const initialPaymentState: PaymentState = {
  currentStep: 1,
  isProcessing: false,
  paymentDetails: null,
  transactionId: null,
  pixStatus: 'idle',
  countdown: 180,
  showPaymentDetails: false
}

const initialCardState: CardState = {
  number: '',
  expiry: '',
  cvc: '',
  name: '',
  focus: ''
}

export default function useContribution(options: UseContributionOptions = {}): UseContributionReturn {
  const { onSuccess, onError } = options
  const { toast } = useToast()

  // Estados
  const [formData, setFormData] = useState<ContributionFormData>(initialFormData)
  const [paymentState, setPaymentState] = useState<PaymentState>(initialPaymentState)
  const [cardState, setCardState] = useState<CardState>(initialCardState)

  // Ações de atualização de estado
  const updateFormData = useCallback((data: Partial<ContributionFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
    devLog('Form data updated:', data)
  }, [])

  const updateCardState = useCallback((state: Partial<CardState>) => {
    setCardState(prev => ({ ...prev, ...state }))
  }, [])

  const setCurrentStep = useCallback((step: PaymentStep) => {
    setPaymentState(prev => ({ ...prev, currentStep: step }))
    devLog('Step changed to:', step)
  }, [])

  const setPixStatus = useCallback((status: PixStatus) => {
    setPaymentState(prev => ({ ...prev, pixStatus: status }))
    devLog('PIX status changed to:', status)
  }, [])

  // Reset completo do formulário
  const handleReset = useCallback(() => {
    setFormData(initialFormData)
    setPaymentState(initialPaymentState)
    setCardState(initialCardState)
    devLog('Form reset completed')
  }, [])

  // Voltar para etapa anterior
  const handleBack = useCallback(() => {
    setPaymentState(prev => ({
      ...prev,
      currentStep: 1,
      showPaymentDetails: false,
      paymentDetails: null,
      transactionId: null,
      pixStatus: 'idle',
      countdown: 180
    }))
    devLog('Returned to step 1')
  }, [])

  // Submissão do formulário principal
  const handleFormSubmit = useCallback(async (data: ContributionData) => {
    devLog('Form submission started:', data)
    
    // Atualiza dados do formulário
    updateFormData(data)
    
    // Avança para etapa 2 (Pagamento)
    setCurrentStep(2)
    
    // Se for cartão, apenas mostra o formulário
    if (data.paymentMethod === 'credit_card') {
      setPaymentState(prev => ({ ...prev, showPaymentDetails: true }))
      return
    }

    // Para PIX e Boleto, processa o pagamento
    setPaymentState(prev => ({ ...prev, isProcessing: true, paymentDetails: null }))
    
    try {
      const payload = { ...data }
      const response = await fetch('/api/v1/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao processar o pagamento.')
      }

      devLog('Payment created successfully:', result)

      // Atualiza estado com dados do pagamento
      setPaymentState(prev => ({
        ...prev,
        paymentDetails: result.data,
        transactionId: result.transaction?.id || generateTransactionId(),
        showPaymentDetails: true,
        pixStatus: data.paymentMethod === 'pix' ? 'pending' : 'idle',
        countdown: data.paymentMethod === 'pix' ? 180 : prev.countdown
      }))

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      devLog('Payment creation failed:', errorMessage)
      
      toast({
        title: 'Erro no Pagamento',
        description: errorMessage,
        variant: 'destructive',
      })
      
      onError?.(errorMessage)
    } finally {
      setPaymentState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [updateFormData, setCurrentStep, toast, onError])

  // Pagamento com cartão
  const handleCardPayment = useCallback(async (cardData: CardData, installments?: number) => {
    devLog('Card payment started:', { holder: cardData.holder, installments })
    
    const payload = {
      ...formData,
      card: cardData,
      installments: installments || 1,
    }
    
    setPaymentState(prev => ({ ...prev, isProcessing: true }))
    
    try {
      const response = await fetch('/api/v1/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Falha ao processar o pagamento com cartão.')
      }

      devLog('Card payment successful:', result)

      // Avança para etapa 3 (Confirmação)
      setCurrentStep(3)
      
      toast({
        title: 'Sucesso!',
        description: 'Pagamento com cartão aprovado.',
        variant: 'default',
      })
      
      onSuccess?.(result.transaction)
      
      // Reset após sucesso
      setTimeout(() => {
        handleReset()
      }, 3000)

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      devLog('Card payment failed:', errorMessage)
      
      toast({
        title: 'Erro no Pagamento',
        description: errorMessage,
        variant: 'destructive'
      })
      
      onError?.(errorMessage)
    } finally {
      setPaymentState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [formData, setCurrentStep, toast, onSuccess, onError, handleReset])

  return {
    // Estado
    formData,
    paymentState,
    cardState,
    
    // Ações
    updateFormData,
    updateCardState,
    setCurrentStep,
    setPixStatus,
    
    // Handlers
    handleFormSubmit,
    handleCardPayment,
    handleReset,
    handleBack
  }
}