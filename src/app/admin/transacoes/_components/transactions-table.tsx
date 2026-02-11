'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ArrowRightLeft, ListFilter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { PaginationControls } from '../../_components/PaginationControls'
import { TransactionFilters } from './transaction-filters'
import { TransactionRow } from './transaction-row'
import { PAGINATION_DEFAULTS } from '@/lib/constants/pagination'
import { transactionsApiResponseSchema } from '@/types/transaction'
import type { Transaction, TransactionStatus } from '@/types/transaction'
import { z } from 'zod'

// Lazy load do modal pesado
const QuickProfileModal = dynamic(
  () =>
    import('@/components/ui/quick-profile-modal').then((mod) => ({
      default: mod.QuickProfileModal,
    })),
  {
    loading: () => <div>Carregando...</div>,
    ssr: false,
  },
)

type TransactionsTableProps = {
  initialData: Transaction[]
}

export function TransactionsTable({ initialData }: TransactionsTableProps) {
  const [transactions, setTransactions] = React.useState<Transaction[]>(initialData)
  const [isLoading, setIsLoading] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<TransactionStatus[]>([])
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [currentPage, setCurrentPage] = React.useState<number>(PAGINATION_DEFAULTS.DEFAULT_PAGE)
  const [quickProfileUserId, setQuickProfileUserId] = React.useState<string | null>(null)
  const [isQuickProfileOpen, setIsQuickProfileOpen] = React.useState(false)
  const [loadingActions, setLoadingActions] = React.useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())

      const response = await fetch(`/api/v1/transacoes?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao carregar as transações.')
      }

      const rawData = await response.json()
      const validatedData = transactionsApiResponseSchema.parse(rawData)
      setTransactions(validatedData.transactions)
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de Validação',
          description: 'Dados recebidos da API estão em formato inválido',
          variant: 'destructive',
        })
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [toast, dateRange])

  const handleStatusFilterChange = (status: TransactionStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
    setCurrentPage(PAGINATION_DEFAULTS.DEFAULT_PAGE)
  }

  const handleSearchChange = React.useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(PAGINATION_DEFAULTS.DEFAULT_PAGE)
  }, [])

  const handleDateRangeChange = React.useCallback(
    (range: { from: Date | undefined; to: Date | undefined }) => {
      setDateRange(range)
      setCurrentPage(PAGINATION_DEFAULTS.DEFAULT_PAGE)
    },
    [],
  )

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append('from', dateRange.from.toISOString())
      if (dateRange.to) params.append('to', dateRange.to.toISOString())

      const response = await fetch(`/api/v1/transacoes/export?${params.toString()}`)
      if (!response.ok) throw new Error('Falha ao exportar')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transacoes-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: 'Sucesso',
        description: 'Transações exportadas com sucesso',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao exportar transações',
        variant: 'destructive',
      })
    }
  }

  const handleSyncTransaction = async (transactionId: string) => {
    const actionKey = `sync-${transactionId}`
    setLoadingActions((prev) => new Set(prev).add(actionKey))

    try {
      const response = await fetch(`/api/v1/transacoes/${transactionId}/sync`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao sincronizar')
      }

      toast({
        title: 'Sucesso',
        description: 'Transação sincronizada com sucesso',
        variant: 'success',
      })

      fetchTransactions()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao sincronizar',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(actionKey)
        return newSet
      })
    }
  }

  const handleResendReceipt = async (transactionId: string) => {
    const actionKey = `resend-${transactionId}`
    setLoadingActions((prev) => new Set(prev).add(actionKey))

    try {
      const response = await fetch(`/api/v1/transacoes/${transactionId}/resend`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Falha ao reenviar comprovante')
      }

      toast({
        title: 'Sucesso',
        description: 'Comprovante reenviado com sucesso',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao reenviar comprovante',
        variant: 'destructive',
      })
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev)
        newSet.delete(actionKey)
        return newSet
      })
    }
  }

  // Filtrar transações
  const filteredTransactions = transactions
    .filter(
      (transaction) =>
        transaction.contributor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.contributorEmail.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((transaction) => statusFilter.length === 0 || statusFilter.includes(transaction.status))

  const totalPages = Math.ceil(filteredTransactions.length / PAGINATION_DEFAULTS.ITEMS_PER_PAGE)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGINATION_DEFAULTS.ITEMS_PER_PAGE,
    currentPage * PAGINATION_DEFAULTS.ITEMS_PER_PAGE,
  )

  return (
    <>
      <Card className="shadow-lg border-l-4 border-l-videira-blue">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                  <ListFilter className="h-5 w-5 text-videira-blue" />
                </div>
                Filtros e Busca
              </CardTitle>
              <CardDescription className="mt-1">
                {filteredTransactions.length} transações encontradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TransactionFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onRefresh={fetchTransactions}
            onExport={handleExportCSV}
            totalResults={filteredTransactions.length}
          />

          {/* Tabela */}
          <div className="rounded-md border overflow-hidden mt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
                    <TableHead className="font-semibold min-w-[200px]">Contribuinte</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-center min-w-[80px]">
                      Perfil
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-center min-w-[80px]">
                      Fraude
                    </TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold min-w-[120px]">
                      Igreja
                    </TableHead>
                    <TableHead className="hidden xl:table-cell font-semibold min-w-[120px]">
                      Data
                    </TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold min-w-[100px]">
                      Método
                    </TableHead>
                    <TableHead className="font-semibold text-right min-w-[100px]">Valor</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold min-w-[100px]">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-center min-w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          <Skeleton className="h-6 w-6 mx-auto" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-center">
                          <Skeleton className="h-6 w-16 mx-auto" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Skeleton className="h-6 w-16" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Skeleton className="h-6 w-20" />
                        </TableCell>
                        <TableCell className="text-center">
                          <Skeleton className="h-8 w-8 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((transaction) => (
                      <TransactionRow
                        key={transaction.id}
                        transaction={transaction}
                        onOpenQuickProfile={(id) => {
                          setQuickProfileUserId(id)
                          setIsQuickProfileOpen(true)
                        }}
                        onSyncTransaction={handleSyncTransaction}
                        onResendReceipt={handleResendReceipt}
                        isLoading={
                          loadingActions.has(`sync-${transaction.id}`) ||
                          loadingActions.has(`resend-${transaction.id}`)
                        }
                      />
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center h-24">
                        <div className="flex flex-col items-center gap-2 py-8">
                          <ArrowRightLeft className="h-12 w-12 text-muted-foreground" />
                          <p className="text-lg font-medium text-muted-foreground">
                            Nenhuma transação encontrada
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Paginação */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTransactions.length}
            itemsPerPage={PAGINATION_DEFAULTS.ITEMS_PER_PAGE}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Modal de Perfil Rápido */}
      <QuickProfileModal
        isOpen={isQuickProfileOpen}
        onClose={() => {
          setIsQuickProfileOpen(false)
          setQuickProfileUserId(null)
        }}
        userId={quickProfileUserId}
      />
    </>
  )
}
