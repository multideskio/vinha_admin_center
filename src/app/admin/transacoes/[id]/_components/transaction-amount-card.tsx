'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { STATUS_MAP } from '@/lib/constants/transaction-maps'
import type { TransactionStatus } from '@/types/transaction'

interface TransactionAmountCardProps {
  amount: number
  status: TransactionStatus
  date: string
}

/**
 * Card destacado com valor da transação
 */
export function TransactionAmountCard({ amount, status, date }: TransactionAmountCardProps) {
  const statusConfig = STATUS_MAP[status]

  return (
    <Card className="border-2 border-videira-blue/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-videira-blue">
          <DollarSign className="h-5 w-5" />
          Valor da Transação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-4xl font-bold text-videira-blue">{formatCurrency(amount)}</p>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant={statusConfig.variant}>{statusConfig.text}</Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {date}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
