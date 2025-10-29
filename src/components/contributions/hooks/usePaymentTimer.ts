/**
 * Hook para gerenciamento do timer de countdown do PIX
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  UsePaymentTimerOptions,
  UsePaymentTimerReturn,
  PIX_COUNTDOWN_SECONDS
} from '../types'
import { formatTime, devLog } from '../utils'

export default function usePaymentTimer(options: UsePaymentTimerOptions): UsePaymentTimerReturn {
  const {
    initialSeconds = PIX_COUNTDOWN_SECONDS,
    isActive,
    onExpired
  } = options

  const [seconds, setSeconds] = useState(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const hasExpiredRef = useRef(false)

  // Inicia/para o timer baseado no estado ativo
  useEffect(() => {
    if (isActive && seconds > 0 && !isExpired) {
      devLog(`Starting PIX timer: ${seconds} seconds`)
      
      intervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => {
          const newSeconds = prevSeconds - 1
          
          if (newSeconds <= 0) {
            devLog('PIX timer expired')
            setIsExpired(true)
            
            // Chama onExpired apenas uma vez
            if (!hasExpiredRef.current) {
              hasExpiredRef.current = true
              onExpired?.()
            }
            
            return 0
          }
          
          return newSeconds
        })
      }, 1000)
    } else {
      // Para o timer se não estiver ativo
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = undefined
      }
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, seconds, isExpired, onExpired])

  // Reset do timer
  const reset = useCallback((newSeconds: number = initialSeconds) => {
    devLog(`Resetting PIX timer to ${newSeconds} seconds`)
    
    setSeconds(newSeconds)
    setIsExpired(false)
    hasExpiredRef.current = false
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
  }, [initialSeconds])

  // Formatação do tempo
  const formatTimeCallback = useCallback((timeInSeconds: number): string => {
    return formatTime(timeInSeconds)
  }, [])

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    seconds,
    isExpired,
    reset,
    formatTime: formatTimeCallback
  }
}