/**
 * @lastReview 2026-01-05 14:30 - Sistema de transações admin revisado
 */
'use client'

import * as React from 'react'
import {
  Download,
  ListFilter,
  MoreHorizontal,
  Search,
  ArrowRightLeft,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { QuickProfileModal } from '@/components/ui/quick-profile-modal'
import { PaginationControls } from '../_components/PaginationControls'
import { PageHeader } from '../_components/PageHeader'

type Transaction = {
  id: string
  contributor: string
  contributorEmail: string
  contributorId?: string
  church: string | null
  amount: number
  method: 'pix' | 'credit_card' | 'boleto'
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  date: string
  paidAt: string | null
  refundRequestReason?: string | null
  isFraud?: boolean
}

const statusMap: {
  [key: string]: { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
} = {
  approved: { text: 'Aprovada', variant: 'success' },
  pending: { text: 'Pendente', variant: 'warning' },
  refused: { text: 'Recusada', variant: 'destructive' },
  refunded: { text: 'Reembolsada', variant: 'outline' },
}

const methodMap: {
  [key: string]: { text: string; color: string }
} = {
  pix: { text: 'PIX', color: 'bg-videira-cyan/15 text-videira-cyan border-videira-cyan/30' },
  credit_card: {
    text: 'Cartão',
    color: 'bg-videira-blue/15 text-videira-blue border-videira-blue/30',
  },
  boleto: {
    text: 'Boleto',
    color: 'bg-videira-purple/15 text-videira-purple border-videira-purple/30',
  },
}

export default function TransacoesPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [currentPage, setCurrentPage] = React.useState(1)
  const [quickProfileUserId, setQuickProfileUserId] = React.useState<string | null>(null)
  const [isQuickProfileOpen, setIsQuickProfileOpen] = React.useState(false)
  const [loadingActions, setLoadingActions] = React.useState<Set<string>>(new Set())
  const [openDropdowns, setOpenDropdowns] = React.useState<Set<string>>(new Set())
  const itemsPerPage = 20 // Aumentado de 10 para 20
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
      const data = await response.json()
      setTransactions(data.transactions)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, dateRange])

  // Carregar dados iniciais apenas uma vez
  React.useEffect(() => {
    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDateRangeChange = React.useCallback(
    (range: { from: Date | undefined; to: Date | undefined }) => {
      setDateRange(range)
      setCurrentPage(1) // Reset para página 1 ao mudar filtro
    },
    [],
  )

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
    setCurrentPage(1) // Reset para página 1 ao mudar filtro
  }

  const filteredTransactions = transactions
    .filter(
      (transaction) =>
        transaction.contributor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.contributorEmail.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((transaction) => statusFilter.length === 0 || statusFilter.includes(transaction.status))

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
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

  const handleOpenQuickProfile = (contributorId: string) => {
    setQuickProfileUserId(contributorId)
    setIsQuickProfileOpen(true)
  }

  const handleCloseQuickProfile = () => {
    setIsQuickProfileOpen(false)
    setQuickProfileUserId(null)
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
      // Fechar dropdown após a ação
      setOpenDropdowns((prev) => {
        const newSet = new Set(prev)
        newSet.delete(transactionId)
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
      // Fechar dropdown após a ação
      setOpenDropdowns((prev) => {
        const newSet = new Set(prev)
        newSet.delete(transactionId)
        return newSet
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transações"
        description="Gerencie todas as transações financeiras da plataforma"
        icon={ArrowRightLeft}
      />

      {/* Filtros e Tabela */}
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
            <Button
              onClick={fetchTransactions}
              size="icon"
              className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-3 pb-6">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por contribuinte ou email..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md font-semibold gap-2"
                  >
                    <ListFilter className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only">
                      Filtro {statusFilter.length > 0 && `(${statusFilter.length})`}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(statusMap).map(([key, { text }]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={statusFilter.includes(key)}
                      onCheckedChange={() => handleStatusFilterChange(key)}
                    >
                      {text}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                onClick={handleExportCSV}
                className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Exportar CSV</span>
              </Button>
            </div>
            <DateRangePicker
              value={{ from: dateRange.from, to: dateRange.to }}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>

          {/* Tabela Responsiva */}
          <div className="rounded-md border overflow-hidden">
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
                      <TableRow key={transaction.id} className="hover:bg-muted/50">
                        {/* Coluna Contribuinte */}
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{transaction.contributor}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.contributorEmail}
                            </div>
                            {/* Informações extras em mobile */}
                            <div className="flex flex-wrap gap-2 sm:hidden">
                              <Badge
                                className={cn(
                                  'text-xs border',
                                  methodMap[transaction.method]?.color,
                                )}
                              >
                                {methodMap[transaction.method]?.text}
                              </Badge>
                              <Badge
                                variant={statusMap[transaction.status]?.variant || 'default'}
                                className="text-xs"
                              >
                                {statusMap[transaction.status]?.text}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>

                        {/* Coluna Perfil Rápido */}
                        <TableCell className="hidden sm:table-cell text-center">
                          {transaction.contributorId ? (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-videira-blue/10 hover:text-videira-blue"
                              onClick={() =>
                                handleOpenQuickProfile(transaction.contributorId as string)
                              }
                              title="Ver perfil rápido"
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Coluna Fraude */}
                        <TableCell className="hidden sm:table-cell text-center">
                          {transaction.isFraud ? (
                            <Badge
                              variant="destructive"
                              className="text-xs px-2 py-1 bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
                            >
                              🚨<span className="sr-only">Alerta de fraude</span>
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* Coluna Igreja */}
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {transaction.church || 'N/A'}
                        </TableCell>

                        {/* Coluna Data */}
                        <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                          {transaction.paidAt
                            ? new Date(transaction.paidAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit',
                              })
                            : '-'}
                        </TableCell>

                        {/* Coluna Método */}
                        <TableCell className="hidden lg:table-cell">
                          <Badge
                            className={cn('text-xs border', methodMap[transaction.method]?.color)}
                          >
                            {methodMap[transaction.method]?.text || transaction.method}
                          </Badge>
                        </TableCell>

                        {/* Coluna Valor */}
                        <TableCell className="text-right font-semibold">
                          <div className="text-sm font-semibold">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(transaction.amount)}
                          </div>
                        </TableCell>

                        {/* Coluna Status */}
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant={statusMap[transaction.status]?.variant || 'default'}
                            className="text-xs"
                          >
                            {statusMap[transaction.status]?.text || transaction.status}
                          </Badge>
                        </TableCell>

                        {/* Coluna Ações */}
                        <TableCell className="text-center">
                          <DropdownMenu
                            open={openDropdowns.has(transaction.id)}
                            onOpenChange={(open) => {
                              setOpenDropdowns((prev) => {
                                const newSet = new Set(prev)
                                if (open) {
                                  newSet.add(transaction.id)
                                } else {
                                  // Só fecha se não estiver carregando
                                  if (
                                    !loadingActions.has(`sync-${transaction.id}`) &&
                                    !loadingActions.has(`resend-${transaction.id}`)
                                  ) {
                                    newSet.delete(transaction.id)
                                  }
                                }
                                return newSet
                              })
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                disabled={
                                  loadingActions.has(`sync-${transaction.id}`) ||
                                  loadingActions.has(`resend-${transaction.id}`)
                                }
                              >
                                {loadingActions.has(`sync-${transaction.id}`) ||
                                loadingActions.has(`resend-${transaction.id}`) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                                <span className="sr-only">Menu de ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/transacoes/${transaction.id}`}>
                                  Ver Detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleSyncTransaction(transaction.id)
                                }}
                                disabled={loadingActions.has(`sync-${transaction.id}`)}
                                className="flex items-center gap-2"
                              >
                                {loadingActions.has(`sync-${transaction.id}`) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                                Sincronizar com Cielo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault()
                                  handleResendReceipt(transaction.id)
                                }}
                                disabled={loadingActions.has(`resend-${transaction.id}`)}
                                className="flex items-center gap-2"
                              >
                                {loadingActions.has(`resend-${transaction.id}`) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <ArrowRightLeft className="h-4 w-4" />
                                )}
                                Reenviar Comprovante
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
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
            itemsPerPage={itemsPerPage}
            isLoading={isLoading}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Modal de Perfil Rápido */}
      <QuickProfileModal
        isOpen={isQuickProfileOpen}
        onClose={handleCloseQuickProfile}
        userId={quickProfileUserId}
      />
    </div>
  )
}
