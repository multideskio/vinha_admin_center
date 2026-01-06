/**
 * @fileoverview Modal de perfil rápido do contribuinte
 * @version 1.0
 * @date 2026-01-06
 * @author Kiro
 */

'use client'

import * as React from 'react'
import { Search, User, Building2, Users, Crown, Calendar, CreditCard, MapPin } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type QuickProfileData = {
  user: {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }
  profile: Record<string, unknown> | null
  hierarchy: {
    manager?: { id: string; name: string; email: string }
    supervisor?: { id: string; name: string; email: string }
    pastor?: { id: string; name: string; email: string }
    region?: { id: string; name: string; color: string }
    churches?: Array<{ id: string; name: string; email: string }>
  } | null
  recentTransactions: Array<{
    id: string
    amount: number
    status: string
    paymentMethod: string
    date: string
  }>
}

interface QuickProfileModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
}

const roleMap: { [key: string]: { text: string; color: string; icon: React.ReactNode } } = {
  admin: {
    text: 'Administrador',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400',
    icon: <Crown className="h-3 w-3" />,
  },
  manager: {
    text: 'Gerente',
    color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400',
    icon: <Users className="h-3 w-3" />,
  },
  supervisor: {
    text: 'Supervisor',
    color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400',
    icon: <User className="h-3 w-3" />,
  },
  pastor: {
    text: 'Pastor',
    color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400',
    icon: <User className="h-3 w-3" />,
  },
  church_account: {
    text: 'Igreja',
    color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400',
    icon: <Building2 className="h-3 w-3" />,
  },
}

const methodMap: { [key: string]: { text: string; color: string } } = {
  pix: { text: 'PIX', color: 'bg-videira-cyan/15 text-videira-cyan border-videira-cyan/30' },
  credit_card: { text: 'Cartão', color: 'bg-videira-blue/15 text-videira-blue border-videira-blue/30' },
  boleto: { text: 'Boleto', color: 'bg-videira-purple/15 text-videira-purple border-videira-purple/30' },
}

export function QuickProfileModal({ isOpen, onClose, userId }: QuickProfileModalProps) {
  const [data, setData] = React.useState<QuickProfileData | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen && userId) {
      fetchQuickProfile()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId])

  const fetchQuickProfile = async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/v1/users/${userId}/quick-profile`)
      if (!response.ok) {
        throw new Error('Erro ao carregar perfil')
      }
      const profileData = await response.json()
      setData(profileData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setData(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        <div className="p-4 sm:p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Search className="h-5 w-5 text-videira-blue" />
              Perfil Rápido do Contribuinte
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 sm:h-6 w-32 sm:w-48" />
                  <Skeleton className="h-4 w-48 sm:w-64" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
              <Skeleton className="h-48 sm:h-64" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button onClick={fetchQuickProfile} className="mt-4">
                Tentar Novamente
              </Button>
            </div>
          ) : data ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-videira-blue to-videira-purple flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                      {data.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl truncate">{data.user.name}</CardTitle>
                      <CardDescription className="text-sm sm:text-base break-all">{data.user.email}</CardDescription>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={cn('text-xs border', roleMap[data.user.role]?.color)}>
                          {roleMap[data.user.role]?.icon}
                          <span className="ml-1">{roleMap[data.user.role]?.text}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          Desde {new Date(data.user.createdAt).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Hierarquia */}
                {data.hierarchy && (
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-videira-purple" />
                        Hierarquia
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {data.hierarchy.manager && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                          <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                            <Crown className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">Gerente</p>
                            <p className="text-sm text-muted-foreground truncate">{data.hierarchy.manager.name}</p>
                          </div>
                        </div>
                      )}
                      {data.hierarchy.region && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20">
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${data.hierarchy.region.color}20` }}
                          >
                            <MapPin className="h-4 w-4" style={{ color: data.hierarchy.region.color }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">Região</p>
                            <p className="text-sm text-muted-foreground truncate">{data.hierarchy.region.name}</p>
                          </div>
                        </div>
                      )}
                      {data.hierarchy.supervisor && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">Supervisor</p>
                            <p className="text-sm text-muted-foreground truncate">{data.hierarchy.supervisor.name}</p>
                          </div>
                        </div>
                      )}
                      {data.hierarchy.pastor && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                          <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">Pastor</p>
                            <p className="text-sm text-muted-foreground truncate">{data.hierarchy.pastor.name}</p>
                          </div>
                        </div>
                      )}
                      {data.hierarchy.churches && data.hierarchy.churches.length > 0 && (
                        <div className="space-y-2">
                          <p className="font-medium text-sm text-muted-foreground">Igrejas Supervisionadas:</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {data.hierarchy.churches.map((church) => (
                              <div key={church.id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="h-4 w-4 text-orange-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm">Igreja</p>
                                  <p className="text-sm text-muted-foreground truncate">{church.name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {!data.hierarchy.manager && !data.hierarchy.supervisor && !data.hierarchy.pastor && !data.hierarchy.region && (!data.hierarchy.churches || data.hierarchy.churches.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma hierarquia definida
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Estatísticas Rápidas */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-videira-cyan" />
                      Resumo Financeiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Contribuições Pagas</span>
                        <span className="font-semibold">{data.recentTransactions.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Valor Total (últimas 10 pagas)</span>
                        <span className="font-semibold text-green-600 text-sm sm:text-base">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(
                            data.recentTransactions.reduce((sum, t) => sum + t.amount, 0)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className="font-semibold text-green-600 text-sm">
                          Todas Aprovadas
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Últimas Transações */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-videira-blue" />
                    Últimas 10 Contribuições Pagas
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Histórico das transações aprovadas do contribuinte
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.recentTransactions.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {data.recentTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                              <CreditCard className="h-4 w-4 text-green-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-medium text-sm sm:text-base">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(transaction.amount)}
                                </span>
                                <Badge className={cn('text-xs border w-fit', methodMap[transaction.paymentMethod]?.color)}>
                                  {methodMap[transaction.paymentMethod]?.text}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="success" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 text-xs flex-shrink-0">
                            Paga
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma contribuição paga encontrada</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}