'use client'

import * as React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { TransactionDetailLayout } from '@/components/transaction-detail-layout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Transaction = {
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
  }
  payment: {
    method: string
    details: string
  }
  refundRequestReason?: string | null
}

export default function TransacaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params)
  const [transaction, setTransaction] = React.useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  React.useEffect(() => {
    const fetchTransaction = async () => {
      try {
        console.log('Fetching transaction:', id)
        const response = await fetch(`/api/v1/manager/transacoes/${id}`)
        if (!response.ok) {
          throw new Error('Falha ao carregar a transação.')
        }
        const data = await response.json()
        if (!data.transaction) {
          throw new Error('Transação não encontrada')
        }
        setTransaction(data.transaction)
        console.log('Transaction loaded successfully:', id)
      } catch (error) {
        console.error('Error fetching transaction:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransaction()
  }, [id, toast])

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
          <Link href="/manager/transacoes">Voltar para Transações</Link>
        </Button>
      </div>
    )
  }

  return (
    <TransactionDetailLayout
      transaction={transaction}
      backUrl="/manager/transacoes"
      backLabel="Voltar para Transações"
    />
  )
}
