'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Clock } from 'lucide-react'

interface TransactionFraudAlertProps {
  fraudMarkedAt: string | null
  fraudReason: string | null
}

/**
 * Alerta de fraude com informações de auditoria
 */
export function TransactionFraudAlert({ fraudMarkedAt, fraudReason }: TransactionFraudAlertProps) {
  return (
    <Alert variant="destructive" className="border-2">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-bold">Transação Marcada como Fraude</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        {fraudReason && (
          <p>
            <span className="font-semibold">Motivo:</span> {fraudReason}
          </p>
        )}
        {fraudMarkedAt && (
          <p className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            Marcada em: {new Date(fraudMarkedAt).toLocaleString('pt-BR')}
          </p>
        )}
      </AlertDescription>
    </Alert>
  )
}
