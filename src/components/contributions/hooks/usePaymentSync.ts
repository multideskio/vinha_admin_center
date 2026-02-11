/**
 * Hook para sincronização automática e manual de pagamentos PIX
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { UsePaymentSyncOptions, UsePaymentSyncReturn } from '../types'
import {
  PIX_MAX_ATTEMPTS,
  PIX_INITIAL_DELAY,
  PIX_MIN_DELAY,
  PIX_MAX_DELAY,
  PIX_ERROR_DELAY,
  PIX_ERROR_MAX_DELAY,
} from '../types'
import { calculateBackoffDelay, calculateErrorDelay, devLog } from '../utils'

export default function usePaymentSync(options: UsePaymentSyncOptions): UsePaymentSyncReturn {
  const { transactionId, paymentMethod, pixStatus, onSuccess, onError } = options

  const { toast } = useToast()
  const [isChecking, setIsChecking] = useState(false)
  const attemptsRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout>()

  // Função para verificar status do pagamento
  const checkPaymentStatus = useCallback(async (): Promise<boolean> => {
    if (!transactionId) {
      devLog('No transaction ID available for sync')
      return false
    }

    try {
      devLog(`Checking payment status for transaction: ${transactionId}`)

      const res = await fetch(`/api/v1/transacoes/${transactionId}`)
      const data: { transaction?: { status?: string } } = await res.json()

      devLog('Payment status response:', { status: data.transaction?.status })

      // Verifica status normalizado (funciona para Cielo e Bradesco)
      if (data.transaction?.status === 'approved') {
        devLog('Payment confirmed!')
        onSuccess()
        return true
      }

      return false
    } catch (error) {
      devLog(
        'Payment status check failed:',
        error instanceof Error ? error.message : 'Erro desconhecido',
      )
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar pagamento'
      onError(errorMessage)
      return false
    }
  }, [transactionId, onSuccess, onError])

  // Sincronização automática
  useEffect(() => {
    // Limpa timer anterior
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // Reset attempts quando iniciar nova sincronização
    if (paymentMethod === 'pix' && pixStatus === 'pending' && transactionId) {
      attemptsRef.current = 0
      devLog('Starting automatic payment sync')

      const scheduleNextCheck = () => {
        if (attemptsRef.current >= PIX_MAX_ATTEMPTS) {
          devLog('Max attempts reached, stopping automatic sync')
          return
        }

        if (pixStatus !== 'pending') {
          devLog('PIX status changed, stopping automatic sync')
          return
        }

        const attempt = attemptsRef.current
        let delay: number

        if (attempt === 0) {
          // Primeira verificação após delay inicial
          delay = PIX_INITIAL_DELAY
        } else {
          // Backoff exponencial para tentativas subsequentes
          delay = calculateBackoffDelay(attempt, PIX_MIN_DELAY, PIX_MAX_DELAY)
        }

        devLog(`Scheduling next check in ${delay}ms (attempt ${attempt + 1}/${PIX_MAX_ATTEMPTS})`)

        timerRef.current = setTimeout(async () => {
          attemptsRef.current++

          try {
            const isConfirmed = await checkPaymentStatus()

            if (!isConfirmed && pixStatus === 'pending') {
              // Agenda próxima verificação
              scheduleNextCheck()
            }
          } catch (error) {
            devLog(
              'Error in automatic sync:',
              error instanceof Error ? error.message : 'Erro desconhecido',
            )

            // Em caso de erro, usa delay maior
            const errorDelay = calculateErrorDelay(attempt, PIX_ERROR_DELAY, PIX_ERROR_MAX_DELAY)

            if (attemptsRef.current < PIX_MAX_ATTEMPTS && pixStatus === 'pending') {
              devLog(`Scheduling retry after error in ${errorDelay}ms`)

              timerRef.current = setTimeout(() => {
                scheduleNextCheck()
              }, errorDelay)
            }
          }
        }, delay)
      }

      // Inicia o ciclo de verificação
      scheduleNextCheck()
    }

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [transactionId, paymentMethod, pixStatus, checkPaymentStatus])

  // Verificação manual
  const checkPaymentManually = useCallback(async () => {
    if (!transactionId) {
      toast({
        title: 'Erro',
        description: 'ID da transação não encontrado.',
        variant: 'destructive',
      })
      return
    }

    setIsChecking(true)
    devLog('Starting manual payment check')

    try {
      // Faz múltiplas tentativas com intervalo menor para verificação manual
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        devLog(`Manual check attempt ${attempts + 1}/${maxAttempts}`)

        const res = await fetch(`/api/v1/transacoes/${transactionId}`)
        const data: { transaction?: { status?: string } } = await res.json()

        if (data.transaction?.status === 'approved') {
          devLog('Manual check: Payment confirmed!')
          onSuccess()

          toast({
            title: 'Sucesso!',
            description: 'Pagamento via Pix confirmado com sucesso.',
            variant: 'default',
          })
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          // Aguarda 2 segundos entre tentativas
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }

      // Se chegou aqui, não conseguiu confirmar
      devLog('Manual check: Payment still pending')
      toast({
        title: 'Ainda Pendente',
        description:
          'Pagamento ainda não foi confirmado. Aguarde alguns instantes e tente novamente.',
        variant: 'default',
      })
    } catch (error) {
      devLog('Manual check failed:', error instanceof Error ? error.message : 'Erro desconhecido')
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'

      toast({
        title: 'Erro na Verificação',
        description:
          'Problema temporário na consulta ao gateway. Tente novamente em alguns instantes.',
        variant: 'destructive',
      })

      onError(errorMessage)
    } finally {
      setIsChecking(false)
    }
  }, [transactionId, onSuccess, onError, toast])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return {
    isChecking,
    checkPaymentManually,
  }
}
