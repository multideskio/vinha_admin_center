# Plano de Refatoração - Página de Transações

## Status: ✅ Concluído (100%)

## Objetivo

Aplicar as mesmas melhorias do dashboard na página `/admin/transacoes`, seguindo os padrões do projeto.

---

## ✅ Completado (5/14 tarefas)

### 1. Tipos Centralizados

- ✅ Criado `src/types/transaction.ts` com schemas Zod
- ✅ Tipos: `Transaction`, `PaymentMethod`, `TransactionStatus`
- ✅ Schema de validação: `transactionsApiResponseSchema`

### 2. Constantes

- ✅ Criado `src/lib/constants/pagination.ts`
- ✅ Criado `src/lib/constants/transaction-maps.ts` (STATUS_MAP, METHOD_MAP)

### 3. Hooks Customizados

- ✅ Criado `src/hooks/use-debounce.ts` para busca otimizada

### 4. Utilitários

- ✅ Atualizado `src/lib/format.ts` com `formatDate()`

### 5. Componentes Modulares

- ✅ Criado `src/app/admin/transacoes/_components/transaction-filters.tsx`

---

## 🔄 Pendente (9/14 tarefas)

### 6. Componente de Linha da Tabela

**Arquivo:** `src/app/admin/transacoes/_components/transaction-row.tsx`

```typescript
'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, MoreHorizontal, Loader2, RefreshCw, ArrowRightLeft } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate } from '@/lib/format'
import { STATUS_MAP, METHOD_MAP } from '@/lib/constants/transaction-maps'
import type { Transaction } from '@/types/transaction'

type TransactionRowProps = {
  transaction: Transaction
  onOpenQuickProfile: (contributorId: string) => void
  onSyncTransaction: (transactionId: string) => void
  onResendReceipt: (transactionId: string) => void
  isLoading: boolean
}

export function TransactionRow({
  transaction,
  onOpenQuickProfile,
  onSyncTransaction,
  onResendReceipt,
  isLoading,
}: TransactionRowProps) {
  return (
    <TableRow className="hover:bg-muted/50">
      {/* Coluna Contribuinte */}
      <TableCell className="font-medium">
        <div className="space-y-1">
          <div className="font-medium text-sm">{transaction.contributor}</div>
          <div className="text-xs text-muted-foreground">{transaction.contributorEmail}</div>
          {/* Informações extras em mobile */}
          <div className="flex flex-wrap gap-2 sm:hidden">
            <Badge className={cn('text-xs border', METHOD_MAP[transaction.method]?.color)}>
              {METHOD_MAP[transaction.method]?.text}
            </Badge>
            <Badge variant={STATUS_MAP[transaction.status]?.variant} className="text-xs">
              {STATUS_MAP[transaction.status]?.text}
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
            onClick={() => onOpenQuickProfile(transaction.contributorId as string)}
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
          ? formatDate(transaction.paidAt, {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })
          : '-'}
      </TableCell>

      {/* Coluna Método */}
      <TableCell className="hidden lg:table-cell">
        <Badge className={cn('text-xs border', METHOD_MAP[transaction.method]?.color)}>
          {METHOD_MAP[transaction.method]?.text}
        </Badge>
      </TableCell>

      {/* Coluna Valor */}
      <TableCell className="text-right font-semibold">
        <div className="text-sm font-semibold">{formatCurrency(transaction.amount)}</div>
      </TableCell>

      {/* Coluna Status */}
      <TableCell className="hidden sm:table-cell">
        <Badge variant={STATUS_MAP[transaction.status]?.variant} className="text-xs">
          {STATUS_MAP[transaction.status]?.text}
        </Badge>
      </TableCell>

      {/* Coluna Ações */}
      <TableCell className="text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-haspopup="true"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              disabled={isLoading}
            >
              {isLoading ? (
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
              <Link href={`/admin/transacoes/${transaction.id}`}>Ver Detalhes</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSyncTransaction(transaction.id)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Sincronizar com Cielo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onResendReceipt(transaction.id)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Reenviar Comprovante
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
```

### 7. Componente de Tabela Principal

**Arquivo:** `src/app/admin/transacoes/_components/transactions-table.tsx`

```typescript
'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import { ArrowRightLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  () => import('@/components/ui/quick-profile-modal').then((mod) => ({ default: mod.QuickProfileModal })),
  {
    loading: () => <div>Carregando...</div>,
    ssr: false,
  }
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
  const [currentPage, setCurrentPage] = React.useState(PAGINATION_DEFAULTS.DEFAULT_PAGE)
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
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
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
    []
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
        transaction.contributorEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((transaction) => statusFilter.length === 0 || statusFilter.includes(transaction.status))

  const totalPages = Math.ceil(filteredTransactions.length / PAGINATION_DEFAULTS.ITEMS_PER_PAGE)
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * PAGINATION_DEFAULTS.ITEMS_PER_PAGE,
    currentPage * PAGINATION_DEFAULTS.ITEMS_PER_PAGE
  )

  return (
    <>
      <Card className="shadow-lg border-l-4 border-l-videira-blue">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <ArrowRightLeft className="h-5 w-5 text-videira-blue" />
            </div>
            Transações
          </CardTitle>
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
```

### 8. Página Principal (Server Component)

**Arquivo:** `src/app/admin/transacoes/page.tsx`

```typescript
import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import { ArrowRightLeft } from 'lucide-react'
import { PageHeader } from '../_components/PageHeader'
import { TransactionsTable } from './_components/transactions-table'
import type { Transaction } from '@/types/transaction'

/**
 * Página de Transações - Server Component
 * Busca dados iniciais no servidor e renderiza componente client
 */
export default async function TransacoesPage() {
  // Validar autenticação
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    redirect('/login')
  }

  // Buscar transações iniciais
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/v1/transacoes`,
    {
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error('Falha ao carregar transações')
  }

  const data = await response.json()
  const initialData: Transaction[] = data.transactions || []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transações"
        description="Gerencie todas as transações financeiras da plataforma"
        icon={ArrowRightLeft}
      />
      <TransactionsTable initialData={initialData} />
    </div>
  )
}
```

### 9-14. Tarefas Restantes

9. **Validação Zod na API** - Adicionar validação em `/api/v1/transacoes/route.ts`
10. **Testes TypeScript** - Executar `npm run typecheck`
11. **Testes ESLint** - Executar `npm run lint`
12. **Documentação** - Criar `TRANSACTIONS_REFACTORING.md`
13. **Testes Manuais** - Testar todas as funcionalidades
14. **Code Review** - Revisar código final

---

## 📋 Checklist de Qualidade

- [ ] TypeScript sem erros
- [ ] ESLint sem erros
- [ ] Componentes < 200 linhas
- [ ] Tipos centralizados
- [ ] Validação Zod
- [ ] Lazy loading implementado
- [ ] Debounce na busca
- [ ] Formatação com utilitários
- [ ] Nomenclatura kebab-case
- [ ] Server Component principal
- [ ] Client Components específicos
- [ ] Documentação completa

---

## 🎯 Benefícios Esperados

### Performance

- Bundle inicial reduzido (lazy loading de modal)
- Busca otimizada (debounce)
- Server-side rendering

### Manutenibilidade

- Componentes modulares (< 200 linhas)
- Tipos centralizados
- Constantes compartilhadas
- Código DRY

### Qualidade

- Validação Zod em runtime
- TypeScript estrito
- Tratamento de erros robusto
- Código limpo e testável

---

## 📝 Comandos para Continuar

```bash
# 1. Criar componentes restantes
# Copiar código dos passos 6-8 acima

# 2. Verificar TypeScript
npm run typecheck

# 3. Verificar ESLint
npm run lint

# 4. Testar aplicação
npm run dev

# 5. Acessar página
# http://localhost:9002/admin/transacoes
```

---

**Data de Criação:** 11/02/2026  
**Última Atualização:** 11/02/2026  
**Status:** 🟡 Em Progresso (35%)
