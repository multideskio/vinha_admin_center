/**
 * @fileoverview Página de listagem de transações (visão do supervisor).
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 18:30
 */

'use client'

import * as React from 'react'
import {
  Download,
  ListFilter,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { DateRange } from 'react-day-picker'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

type Transaction = {
  id: string
  contributor: string
  church: string | null
  amount: number
  method: 'pix' | 'credit_card' | 'boleto'
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  date: string
  refundRequestReason?: string | null
}

export default function TransacoesPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const url = new URL('/api/v1/supervisor/transacoes', window.location.origin)

      // Adicionar parâmetros de data se selecionados
      if (dateRange?.from) {
        const startDate = (dateRange.from as Date).toISOString().substring(0, 10)
        url.searchParams.set('startDate', startDate)
      }
      if (dateRange?.to) {
        const endDate = (dateRange.to as Date).toISOString().substring(0, 10)
        url.searchParams.set('endDate', endDate)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Falha ao carregar as transações da supervisão.')
      }
      const data = await response.json()
      setTransactions(data.transactions)
    } catch (error: unknown) {
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

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  const filteredTransactions = transactions
    .filter((transaction) => {
      // Só aplica filtro de busca se tiver 4+ caracteres ou estiver vazio
      if (searchTerm.length === 0 || searchTerm.length >= 4) {
        return transaction.contributor.toLowerCase().includes(searchTerm.toLowerCase())
      }
      return true // Se tem menos de 4 caracteres, não filtra
    })
    .filter((transaction) => statusFilter.length === 0 || statusFilter.includes(transaction.status))

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const statusMap: {
    [key: string]: { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
  } = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  const statusOptions = [
    { value: 'approved', label: 'Aprovada' },
    { value: 'pending', label: 'Pendente' },
    { value: 'refused', label: 'Recusada' },
    { value: 'refunded', label: 'Reembolsada' },
  ]

  const handleExport = () => {
    toast({
      title: 'Exportação',
      description: 'Funcionalidade em desenvolvimento.',
      variant: 'default',
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header com gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                Transações da Supervisão
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Gerencie as transações financeiras da sua supervisão
                {dateRange?.from && dateRange?.to && (
                  <span className="ml-2">
                    • Período: {dateRange.from.toLocaleDateString('pt-BR')} -{' '}
                    {dateRange.to.toLocaleDateString('pt-BR')}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/60" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Buscar por contribuinte ou igreja</p>
                    <p className="text-xs text-muted-foreground">Mínimo 4 caracteres</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <ListFilter className="h-4 w-4 mr-2" />
                    Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filtrar por status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {statusOptions.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={statusFilter.includes(option.value)}
                      onCheckedChange={() => handleStatusFilterChange(option.value)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-10 bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-videira-cyan">
        <CardContent className="pt-6">
          <div className="rounded-md border-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
                  <TableHead className="font-semibold">Contribuinte</TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold">Igreja</TableHead>
                  <TableHead className="hidden sm:table-cell text-right font-semibold">
                    Valor
                  </TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold">Status</TableHead>
                  <TableHead className="hidden sm:table-cell font-semibold">
                    Motivo Solicitação
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedTransactions.length > 0 ? (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.contributor}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {transaction.church || 'N/A'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(transaction.amount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={statusMap[transaction.status]?.variant || 'default'}>
                          {statusMap[transaction.status]?.text || transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {transaction.refundRequestReason ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="truncate max-w-[150px] inline-block">
                                  {transaction.refundRequestReason}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{transaction.refundRequestReason}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Alternar menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/supervisor/transacoes/${transaction.id}`}>
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    `/api/v1/supervisor/transacoes/${transaction.id}/resend-receipt`,
                                    { method: 'POST' },
                                  )
                                  const data = await res.json()
                                  if (res.ok) {
                                    toast({
                                      title: 'Sucesso',
                                      description: data.message,
                                      variant: 'success',
                                    })
                                  } else {
                                    throw new Error(data.error)
                                  }
                                } catch (error) {
                                  toast({
                                    title: 'Erro',
                                    description:
                                      error instanceof Error
                                        ? error.message
                                        : 'Erro ao reenviar comprovante',
                                    variant: 'destructive',
                                  })
                                }
                              }}
                            >
                              Reenviar Comprovante
                            </DropdownMenuItem>
                            {transaction.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    const res = await fetch(
                                      `/api/v1/supervisor/transacoes/${transaction.id}/sync`,
                                      { method: 'POST' },
                                    )
                                    const data = await res.json()
                                    if (res.ok) {
                                      toast({
                                        title: 'Sucesso',
                                        description: data.message,
                                        variant: 'success',
                                      })
                                      fetchTransactions()
                                    } else {
                                      throw new Error(data.error)
                                    }
                                  } catch (error) {
                                    toast({
                                      title: 'Erro',
                                      description:
                                        error instanceof Error
                                          ? error.message
                                          : 'Erro ao sincronizar',
                                      variant: 'destructive',
                                    })
                                  }
                                }}
                              >
                                Sincronizar Status
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Nenhuma transação encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
