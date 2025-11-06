'use client'

import * as React from 'react'
import {
  Download,
  ListFilter,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowRightLeft,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
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
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/manager/transacoes')
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
  }, [toast])

  React.useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

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

  const statusMap: {
    [key: string]: { text: string; variant: 'success' | 'warning' | 'destructive' | 'outline' }
  } = {
    approved: { text: 'Aprovada', variant: 'success' },
    pending: { text: 'Pendente', variant: 'warning' },
    refused: { text: 'Recusada', variant: 'destructive' },
    refunded: { text: 'Reembolsada', variant: 'outline' },
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header com gradiente Videira */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg">
          <div className="absolute inset-0 videira-gradient opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
          
          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                  <ArrowRightLeft className="h-8 w-8" />
                  Transações
                </h1>
                <p className="text-base text-white/90 mt-2 font-medium">
                  Visualize todas as transações financeiras da sua rede
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-lg border-t-4 border-t-videira-cyan">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center gap-2 pb-4">
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por contribuinte..."
                  className="pl-9 w-full border-2 focus:border-videira-cyan"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 flex-1 border-2 hover:border-videira-cyan">
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
                <Button size="sm" variant="outline" className="gap-1 flex-1 border-2 hover:border-videira-cyan">
                  <Download className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Exportar</span>
                </Button>
              </div>
              <DateRangePicker />
            </div>
            <div className="rounded-md border-2">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
                    <TableHead className="font-semibold">Contribuinte</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold">Igreja</TableHead>
                    <TableHead className="hidden md:table-cell text-right font-semibold">Valor</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold">Status</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold">Data</TableHead>
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
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-24" />
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
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {transaction.church || 'N/A'}
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
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          asChild
                        >
                          <Link href={`/manager/transacoes/${transaction.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalhes</span>
                          </Link>
                        </Button>
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
            <div className="flex items-center justify-between px-2 py-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages || 1}
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                  className="border-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || isLoading}
                  className="border-2"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
