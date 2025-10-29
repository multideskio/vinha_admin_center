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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

type Transaction = {
  id: string
  contributor: string
  contributorEmail: string
  church: string | null
  amount: number
  method: 'pix' | 'credit_card' | 'boleto'
  status: 'approved' | 'pending' | 'refused' | 'refunded'
  date: string
  paidAt: string | null
  refundRequestReason?: string | null
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
  [key: string]: { text: string; variant: 'default' | 'secondary' | 'outline' } 
} = {
  pix: { text: 'PIX', variant: 'default' },
  credit_card: { text: 'Cartão', variant: 'secondary' },
  boleto: { text: 'Boleto', variant: 'outline' },
}

export default function TransacoesPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])
  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
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

  React.useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleDateRangeChange = React.useCallback((range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range)
  }, [])

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    )
  }

  const filteredTransactions = transactions
    .filter((transaction) =>
      transaction.contributor.toLowerCase().includes(searchTerm.toLowerCase()),
    )
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Transações</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie todas as transações financeiras da plataforma.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 pb-4">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por contribuinte..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 flex-1">
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only">Filtro</span>
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
                variant="outline" 
                className="gap-1 flex-1"
                onClick={async () => {
                  try {
                    const params = new URLSearchParams()
                    if (dateRange.from) params.append('from', dateRange.from.toISOString())
                    if (dateRange.to) params.append('to', dateRange.to.toISOString())
                    params.append('export', 'csv')
                    
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
                    })
                  } catch (error) {
                    toast({
                      title: 'Erro',
                      description: 'Erro ao exportar transações',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                <Download className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Exportar</span>
              </Button>
            </div>
            <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contribuinte</TableHead>
                <TableHead className="hidden lg:table-cell">Igreja</TableHead>
                <TableHead className="hidden xl:table-cell">Data Pagamento</TableHead>
                <TableHead className="hidden xl:table-cell">Forma Pagamento</TableHead>
                <TableHead className="hidden md:table-cell text-right">Valor</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
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
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{transaction.contributor}</span>
                        <span className="text-xs text-muted-foreground">{transaction.contributorEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {transaction.church || 'N/A'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground">
                      {transaction.paidAt
                        ? new Date(transaction.paidAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '-'}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Badge variant={methodMap[transaction.method]?.variant || 'default'}>
                        {methodMap[transaction.method]?.text || transaction.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/transacoes/${transaction.id}`}>Ver Detalhes</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/v1/transacoes/${transaction.id}/sync`, {
                                  method: 'POST',
                                })
                                if (!response.ok) throw new Error('Falha ao sincronizar')
                                toast({
                                  title: 'Sucesso',
                                  description: 'Transação sincronizada com sucesso',
                                })
                                fetchTransactions()
                              } catch (error) {
                                toast({
                                  title: 'Erro',
                                  description: error instanceof Error ? error.message : 'Erro ao sincronizar',
                                  variant: 'destructive',
                                })
                              }
                            }}
                          >
                            Sincronizar com Cielo
                          </DropdownMenuItem>
                          <DropdownMenuItem>Reenviar Comprovante</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    Nenhuma transação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
