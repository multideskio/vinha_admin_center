'use client'

import * as React from 'react'
import Link from 'next/link'
import { Activity, RefreshCw, Save, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { TransactionStatus } from '@/lib/types'

type Transaction = {
  id: string
  name: string
  amount: number
  date: string
  status: TransactionStatus
  contributorId: string
  contributorRole: string
}

type TransactionsTableProps = {
  transactions: Transaction[]
  transactionsLoading: boolean
  onRefresh: () => void
  onExport: () => void
  hasData: boolean
}

const statusMap: {
  [key in TransactionStatus]: {
    text: string
    variant: 'success' | 'warning' | 'destructive' | 'outline'
  }
} = {
  approved: { text: 'Aprovada', variant: 'success' },
  pending: { text: 'Pendente', variant: 'warning' },
  refused: { text: 'Recusada', variant: 'destructive' },
  refunded: { text: 'Reembolsada', variant: 'outline' },
}

export function TransactionsTable({
  transactions,
  transactionsLoading,
  onRefresh,
  onExport,
  hasData,
}: TransactionsTableProps) {
  const roleMap: Record<string, string> = {
    manager: 'gerentes',
    supervisor: 'supervisores',
    pastor: 'pastores',
    church_account: 'igrejas',
  }

  return (
    <Card className="h-full shadow-lg border-t-4 border-t-videira-purple hover:shadow-xl transition-all">
      <CardHeader className="flex flex-col gap-4">
        <div className="min-w-0 flex-1">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-videira-purple flex-shrink-0" />
            <span className="truncate">Últimas Transações</span>
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            As 10 transações mais recentes.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            className="h-8 w-8 bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md flex-shrink-0"
            onClick={onRefresh}
            disabled={transactionsLoading}
          >
            <RefreshCw className={cn('h-4 w-4', transactionsLoading && 'animate-spin')} />
            <span className="sr-only">Atualizar transações</span>
          </Button>
          {hasData ? (
            <Button
              size="sm"
              onClick={onExport}
              className="bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md font-semibold whitespace-nowrap text-xs sm:text-sm"
            >
              <Save className="h-4 w-4 mr-1" /> CSV
            </Button>
          ) : (
            <Skeleton className="h-8 w-12 sm:w-16" />
          )}
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px] sm:min-w-[120px]">Contribuinte</TableHead>
                <TableHead className="text-right min-w-[80px] sm:min-w-[100px]">Valor</TableHead>
                <TableHead className="hidden sm:table-cell min-w-[80px]">Status</TableHead>
                <TableHead className="hidden md:table-cell min-w-[80px] sm:min-w-[100px]">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsLoading || !hasData
                ? // Skeleton loading para transações
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-20 sm:w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 sm:w-20 ml-auto" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-6 w-12 sm:w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-16 sm:w-24" />
                      </TableCell>
                    </TableRow>
                  ))
                : transactions.map((transaction) => {
                    const profilePath = roleMap[transaction.contributorRole]
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {profilePath ? (
                            <Link
                              href={`/admin/${profilePath}/${transaction.contributorId}`}
                              className="flex items-center gap-1 hover:underline text-primary"
                            >
                              <span className="truncate text-xs sm:text-sm">{transaction.name}</span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </Link>
                          ) : (
                            <span className="truncate text-xs sm:text-sm">{transaction.name}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          }).format(transaction.amount)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={statusMap[transaction.status]?.variant || 'default'} className="text-xs">
                            {statusMap[transaction.status]?.text || transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs sm:text-sm">
                          {transaction.date}
                        </TableCell>
                      </TableRow>
                    )
                  })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}