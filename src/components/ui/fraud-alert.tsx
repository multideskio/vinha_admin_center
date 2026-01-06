/**
 * @fileoverview Componente de alerta de fraude para perfis de usuários
 * @version 1.0
 * @date 2025-01-06
 */

'use client'

import * as React from 'react'
import { AlertTriangle, Shield, Eye, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface FraudStats {
  totalFraudTransactions: number
  totalFraudAmount: number
  totalTransactions: number
  fraudPercentage: number
  firstFraudDate: string | null
  lastFraudDate: string | null
}

interface FraudTransaction {
  id: string
  amount: number
  fraudMarkedAt: string
  fraudReason: string
  paymentMethod: string
  gatewayTransactionId: string | null
}

interface FraudAlertProps {
  userId: string
  userName: string
  className?: string
}

export function FraudAlert({ userId, userName, className }: FraudAlertProps) {
  const [stats, setStats] = React.useState<FraudStats | null>(null)
  const [fraudTransactions, setFraudTransactions] = React.useState<FraudTransaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchFraudStats = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/v1/users/${userId}/fraud-stats`)
        if (!response.ok) {
          throw new Error('Falha ao carregar estatísticas de fraude')
        }
        const data = await response.json()
        setStats(data.stats)
        setFraudTransactions(data.fraudTransactions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFraudStats()
  }, [userId])

  if (isLoading) {
    return (
      <Card className={cn('shadow-lg border-t-4 border-t-orange-500', className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-lg" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('shadow-lg border-t-4 border-t-red-500', className)}>
        <CardContent className="pt-6">
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Erro ao carregar dados de fraude: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Se não há fraudes, não exibir o componente
  if (!stats || stats.totalFraudTransactions === 0) {
    return null
  }

  const riskLevel =
    stats.fraudPercentage >= 50 ? 'high' : stats.fraudPercentage >= 20 ? 'medium' : 'low'

  const riskConfig = {
    high: {
      color: 'border-t-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-600',
      badgeVariant: 'destructive' as const,
      label: 'Alto Risco',
    },
    medium: {
      color: 'border-t-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      textColor: 'text-orange-800 dark:text-orange-200',
      iconColor: 'text-orange-600',
      badgeVariant: 'secondary' as const,
      label: 'Risco Médio',
    },
    low: {
      color: 'border-t-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-600',
      badgeVariant: 'outline' as const,
      label: 'Baixo Risco',
    },
  }

  const config = riskConfig[riskLevel]

  return (
    <Card className={cn('shadow-lg border-t-4', config.color, className)}>
      <CardHeader className={config.bgColor}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-lg', config.bgColor, 'ring-2 ring-current/30')}>
              <Shield className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <span className={config.textColor}>Alerta de Fraude</span>
          </div>
          <Badge variant={config.badgeVariant} className="font-bold">
            {config.label}
          </Badge>
        </CardTitle>
        <CardDescription className={config.textColor}>
          {userName} possui {stats.totalFraudTransactions} transação(ões) marcada(s) como fraude
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas Resumidas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total de Fraudes</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalFraudTransactions}</p>
            <p className="text-xs text-muted-foreground">
              de {stats.totalTransactions} transações ({stats.fraudPercentage}%)
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(stats.totalFraudAmount)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Período das Fraudes */}
        {stats.firstFraudDate && stats.lastFraudDate && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período das Fraudes
            </p>
            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">Primeira:</span>{' '}
                {new Date(stats.firstFraudDate).toLocaleDateString('pt-BR')}
              </p>
              <p>
                <span className="font-medium">Última:</span>{' '}
                {new Date(stats.lastFraudDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}

        {/* Transações Recentes */}
        {fraudTransactions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Transações Fraudulentas Recentes
            </p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {fraudTransactions.slice(0, 3).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                >
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-muted-foreground">
                      {transaction.id.slice(0, 8)}...
                    </p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(transaction.amount)}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.fraudMarkedAt).toLocaleDateString('pt-BR')}
                    </p>
                    <Link href={`/admin/transacoes/${transaction.id}`}>
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {fraudTransactions.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{fraudTransactions.length - 3} transação(ões) adicional(is)
              </p>
            )}
          </div>
        )}

        {/* Ação Recomendada */}
        <Alert className={cn('border-2', config.color.replace('border-t-', 'border-'))}>
          <AlertTriangle className={cn('h-4 w-4', config.iconColor)} />
          <AlertDescription className={config.textColor}>
            <strong>Ação Recomendada:</strong> Monitore de perto as transações deste usuário e
            considere implementar verificações adicionais antes de aprovar novos pagamentos.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
