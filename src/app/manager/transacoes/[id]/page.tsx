'use client'

// @lastReview 2025-01-05 21:30

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
      <div className="flex flex-col gap-6">
        {/* Header Skeleton com gradiente */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          <div className="absolute inset-0 videira-gradient opacity-90" />
          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <Skeleton className="h-6 w-32 bg-white/20" />
                <Skeleton className="h-10 w-80 bg-white/20" />
                <Skeleton className="h-5 w-96 bg-white/20" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="h-8 w-24 bg-white/20 rounded-full" />
                <Skeleton className="h-10 w-36 bg-white/20 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
          {/* Main Content Column */}
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            {/* Transaction Info Card */}
            <div className="rounded-lg border shadow-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center py-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center py-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center py-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="rounded-lg border shadow-lg p-6 space-y-4">
              <Skeleton className="h-6 w-44" />
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center py-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            {/* Contributor Card */}
            <div className="rounded-lg border shadow-lg p-6 space-y-4">
              <Skeleton className="h-6 w-28" />
              <div className="space-y-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="h-px bg-border" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            </div>

            {/* Church Card (conditional) */}
            <div className="rounded-lg border shadow-lg p-6 space-y-4">
              <Skeleton className="h-6 w-16" />
              <div className="space-y-3">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="h-px bg-border" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </div>
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
