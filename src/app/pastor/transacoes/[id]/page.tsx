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
      const response = await fetch(`/api/v1/pastor/transacoes/${id}`)
      if (!response.ok) throw new Error('Falha ao carregar detalhes da transação')
      const data = await response.json()

      const cieloData = data.transaction
      const payment = cieloData.Payment

      // Mapear status da Cielo
      let status: 'approved' | 'pending' | 'refused' | 'refunded' = 'pending'
      if (payment.Status === 2) status = 'approved'
      else if (payment.Status === 3) status = 'refused'
      else if (payment.Status === 10 || payment.Status === 11) status = 'refunded'

      const formattedData: TransactionDetail = {
        id: payment.PaymentId,
        date: payment.ReceivedDate
          ? format(parseISO(payment.ReceivedDate), 'dd/MM/yyyy HH:mm:ss')
          : 'N/A',
        amount: payment.Amount / 100,
        status,
        contributor: {
          name: cieloData.Customer?.Name || 'N/A',
          email: cieloData.Customer?.Email || 'N/A',
        },
        church: null,
        payment: {
          method:
            payment.Type === 'CreditCard'
              ? 'Cartão de Crédito'
              : payment.Type === 'Pix'
                ? 'Pix'
                : 'Boleto',
          details:
            payment.Type === 'CreditCard' && payment.CreditCard
              ? `${payment.CreditCard.Brand} final ${payment.CreditCard.CardNumber.slice(-4)}`
              : payment.ProofOfSale || 'N/A',
        },
        refundRequestReason: payment.VoidReason || null,
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
          <Link href="/pastor/transacoes">Voltar para Transações</Link>
        </Button>
      </div>
    )
  }

  return (
    <TransactionDetailLayout
      transaction={transaction}
      backUrl="/pastor/transacoes"
      backLabel="Voltar para Transações"
    />
  )
}
