'use client'

import * as React from 'react'
import { MoreHorizontal, CreditCard, Plus } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

type Gateway = {
  id: string
  name: string
  isActive: boolean
  acceptedPaymentMethods: string | null
  environment: 'production' | 'development'
  href: string
}

export default function GatewaysPage() {
  const [gateways, setGateways] = React.useState<Gateway[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  const fetchGateways = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/gateways')
      if (!response.ok) throw new Error('Falha ao carregar gateways.')
      const data = await response.json()
      const formattedGateways = data.gateways.map((g: Record<string, unknown>) => ({
        id: g.id,
        name: g.gatewayName,
        isActive: g.isActive,
        acceptedPaymentMethods: g.acceptedPaymentMethods,
        environment: g.environment,
        href: `/admin/gateways/${(g as Record<string, unknown>).gatewayName ? String((g as Record<string, unknown>).gatewayName).toLowerCase() : 'unknown'}`,
      }))
      setGateways(formattedGateways)
    } catch (error: unknown) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchGateways()
  }, [fetchGateways])

  return (
    <div className="flex flex-col gap-6">
      {/* Header Moderno com Gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                <CreditCard className="h-8 w-8" />
                Gateways de Pagamento
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Gerencie os gateways para processamento de transações
              </p>
              <p className="text-sm text-white/70 mt-1">
                {gateways.length}{' '}
                {gateways.length === 1 ? 'gateway configurado' : 'gateways configurados'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold gap-2">
                  <Plus className="h-5 w-5" />
                  Novo Gateway
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Selecione um Gateway</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/admin/gateways/cielo" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-videira-cyan" />
                      <span>Configurar Cielo</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/gateways/bradesco" className="cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-videira-blue" />
                      <span>Configurar Bradesco</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-t-4 border-t-videira-blue">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <CreditCard className="h-5 w-5 text-videira-blue" />
            </div>
            Gateways Configurados
          </CardTitle>
          <CardDescription>
            Gerencie credenciais e configure métodos de pagamento aceitos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-md border-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipos de Pagamento</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : gateways.length > 0 ? (
            <div className="rounded-md border-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipos de Pagamento</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gateways.map((gateway) => (
                    <TableRow key={gateway.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-lg">{gateway.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex flex-wrap gap-2">
                          {(gateway.acceptedPaymentMethods || '').split(',').map(
                            (method) =>
                              method.trim() && (
                                <Badge key={method} variant="secondary" className="font-medium">
                                  {method}
                                </Badge>
                              ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={gateway.environment === 'production' ? 'destructive' : 'warning'}
                          className="font-semibold"
                        >
                          {gateway.environment === 'production' ? 'Produção' : 'Desenvolvimento'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={gateway.isActive ? 'success' : 'secondary'}
                          className="font-semibold"
                        >
                          {gateway.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={gateway.href}>
                            <Button
                              size="sm"
                              className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                            >
                              Configurar
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem>
                                {gateway.isActive ? 'Desativar' : 'Ativar'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-12">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <CreditCard className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Nenhum Gateway Configurado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure um gateway de pagamento para começar a processar transações
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="bg-videira-blue hover:bg-videira-blue/90 text-white font-semibold">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Gateway
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-56">
                      <DropdownMenuLabel>Selecione um Gateway</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/gateways/cielo">Configurar Cielo</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/gateways/bradesco">Configurar Bradesco</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
