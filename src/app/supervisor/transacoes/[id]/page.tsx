/**
 * @fileoverview Página de detalhes de transação individual (visão do supervisor).
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 18:30
 */

'use client'

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useParams } from 'next/navigation'
import { TransactionDetailLayout } from '@/components/transaction-detail-layout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'

type TransactionDetail = {
  id: string
  date: string
  amount: number
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  contributor: {
    name: string
    email: string
  }
  church: {
    name: string
    address: string
  } | null
  payment: {
    method: string
    details: string
  }
  refundRequestReason?: string | null
}

export default function TransacaoDetalhePage() {
  const [transaction, setTransaction] = React.useState<TransactionDetail | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const params = useParams()
  const { id } = params
  const { toast } = useToast()

  const fetchTransaction = React.useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/v1/supervisor/transacoes/${id}`)
      if (!response.ok) throw new Error('Falha ao carregar detalhes da transação')
      const data = await response.json()

      const cieloData = data.transaction

      // Mapear status da Cielo: 0=Pendente, 1=Autorizado, 2=Pago, 3=Negado, 10=Cancelado, 13=Estornado
      const mapCieloStatus = (status: number): 'approved' | 'pending' | 'refused' | 'refunded' => {
        if (status === 2) return 'approved'
        if (status === 3) return 'refused'
        if (status === 10 || status === 13) return 'refunded'
        return 'pending'
      }

      const formattedData: TransactionDetail = {
        id: cieloData.Payment.PaymentId,
        date: format(parseISO(cieloData.Payment.ReceivedDate), 'dd/MM/yyyy HH:mm:ss'),
        amount: cieloData.Payment.Amount / 100,
        status: mapCieloStatus(cieloData.Payment.Status),
        contributor: {
          name: cieloData.Customer.Name,
          email: 'email@naodisponivel.com',
        },
        church: null,
        payment: {
          method: cieloData.Payment.Type,
          details:
            cieloData.Payment.Type === 'CreditCard'
              ? `Cartão final ${cieloData.Payment.CreditCard.CardNumber.slice(-4)}`
              : cieloData.Payment.ProofOfSale,
        },
        refundRequestReason: cieloData.Payment.VoidReason,
      }

      setTransaction(formattedData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [id, toast])

  React.useEffect(() => {
    fetchTransaction()
  }, [fetchTransaction])

  if (isLoading) {
    return (
      <div className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="mx-auto grid max-w-5xl flex-1 auto-rows-max gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-24 ml-auto" />
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <p className="text-muted-foreground">Transação não encontrada.</p>
        <Button asChild>
          <Link href="/supervisor/transacoes">Voltar para Transações</Link>
        </Button>
      </div>
    )
  }

  return (
    <TransactionDetailLayout
      transaction={transaction}
      backUrl="/supervisor/transacoes"
      backLabel="Voltar para Transações"
    />
  )
}
