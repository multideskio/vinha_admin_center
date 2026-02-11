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
