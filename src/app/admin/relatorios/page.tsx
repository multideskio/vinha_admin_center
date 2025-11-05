'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  FileText,
  AlertTriangle,
  TrendingUp,
  Users,
  Church,
  DollarSign,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const reportCards = [
  {
    title: 'Inadimplentes',
    description: 'Lista completa de pastores e igrejas que não contribuíram nos últimos 3 meses',
    icon: AlertTriangle,
    href: '/admin/relatorios/inadimplentes',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    badge: 'Atualizado',
    badgeVariant: 'destructive' as const,
  },
  {
    title: 'Relatório Geral',
    description: 'Gere relatórios personalizados com filtros de período, método de pagamento e status',
    icon: FileText,
    href: '/admin/relatorios/geral',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    badge: 'Versátil',
    badgeVariant: 'default' as const,
  },
  {
    title: 'Relatório Financeiro',
    description: 'Análise completa de transações, arrecadações e despesas do período',
    icon: DollarSign,
    href: '/admin/relatorios/financeiro',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    badge: 'Popular',
    badgeVariant: 'outline' as const,
  },
  {
    title: 'Relatório de Igrejas',
    description: 'Performance e estatísticas de todas as igrejas, agrupadas por região',
    icon: Church,
    href: '/admin/relatorios/igrejas',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    badge: 'Por Região',
    badgeVariant: 'outline' as const,
  },
  {
    title: 'Relatório de Membresia',
    description: 'Dados demográficos, de engajamento e crescimento de membros',
    icon: Users,
    href: '/admin/relatorios/membresia',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    badge: 'Crescimento',
    badgeVariant: 'outline' as const,
  },
  {
    title: 'Relatório de Contribuições',
    description: 'Análise detalhada de dízimos e ofertas por tipo e contribuinte',
    icon: TrendingUp,
    href: '/admin/relatorios/contribuicoes',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
    badge: 'Detalhado',
    badgeVariant: 'outline' as const,
  },
]

export default function RelatoriosPage() {
  const [defaultersCount, setDefaultersCount] = React.useState<number | null>(null)

  React.useEffect(() => {
    // Buscar total de inadimplentes para exibir no badge
    fetch('/api/v1/relatorios/inadimplentes?limit=1')
      .then((res) => res.json())
      .then((data) => {
        setDefaultersCount(data.pagination?.total || 0)
      })
      .catch(() => {
        // Silenciar erro, não é crítico
      })
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header Moderno com Gradiente */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
        
        <div className="relative z-10 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                <FileText className="h-8 w-8" />
                Relatórios
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Análises detalhadas e insights da organização
              </p>
              <p className="text-sm text-white/70 mt-1">
                {reportCards.length} tipos de relatórios disponíveis
              </p>
            </div>
            <Button 
              asChild
              className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold gap-2"
            >
              <Link href="/admin/relatorios/geral">
                <FileSpreadsheet className="h-5 w-5" />
                Relatório Personalizado
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Relatórios - Design Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((report, index) => {
          const borderColors = [
            'border-t-videira-cyan',
            'border-t-videira-blue', 
            'border-t-videira-purple',
            'border-t-videira-cyan',
            'border-t-videira-blue',
            'border-t-videira-purple',
          ]
          
          return (
            <Link key={report.href} href={report.href}>
              <Card className={cn(
                "h-full hover:shadow-2xl transition-all duration-300 hover:scale-[1.05] cursor-pointer group relative overflow-hidden",
                "border-t-4",
                borderColors[index]
              )}>
                {/* Fundo com gradiente sutil */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                  index % 3 === 0 && "bg-gradient-to-br from-videira-cyan/5 to-transparent",
                  index % 3 === 1 && "bg-gradient-to-br from-videira-blue/5 to-transparent",
                  index % 3 === 2 && "bg-gradient-to-br from-videira-purple/5 to-transparent"
                )} />
                
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "p-4 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
                      report.bgColor,
                      "ring-2 ring-offset-2 ring-offset-background",
                      index % 3 === 0 && "ring-videira-cyan/30",
                      index % 3 === 1 && "ring-videira-blue/30",
                      index % 3 === 2 && "ring-videira-purple/30"
                    )}>
                      <report.icon className={`h-7 w-7 ${report.color}`} />
                    </div>
                    {report.href === '/admin/relatorios/inadimplentes' && defaultersCount !== null ? (
                      <Badge className={cn(
                        "shadow-md",
                        report.badgeVariant === 'destructive' ? "bg-destructive text-white" : ""
                      )}>
                        {defaultersCount} {defaultersCount === 1 ? 'inadimplente' : 'inadimplentes'}
                      </Badge>
                    ) : (
                      <Badge variant={report.badgeVariant} className="shadow-md">{report.badge}</Badge>
                    )}
                  </div>
                  <CardTitle className={cn(
                    "text-xl mb-2 transition-all duration-300",
                    index % 3 === 0 && "group-hover:text-videira-cyan",
                    index % 3 === 1 && "group-hover:text-videira-blue",
                    index % 3 === 2 && "group-hover:text-videira-purple"
                  )}>
                    {report.title}
                  </CardTitle>
                  <CardDescription className="min-h-[40px] text-sm leading-relaxed">
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <Button 
                    className={cn(
                      "w-full justify-between transition-all duration-300 shadow-md font-semibold",
                      "bg-white dark:bg-background border-2",
                      index % 3 === 0 && "border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white hover:shadow-lg",
                      index % 3 === 1 && "border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white hover:shadow-lg",
                      index % 3 === 2 && "border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white hover:shadow-lg"
                    )}
                  >
                    <span className="font-semibold">Acessar Relatório</span>
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Informações adicionais com estilo Videira */}
      <Card className="shadow-lg border-l-4 border-l-videira-blue bg-gradient-to-br from-videira-blue/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <FileText className="h-5 w-5 text-videira-blue" />
            </div>
            Dicas para Relatórios
          </CardTitle>
          <CardDescription>Aproveite ao máximo os recursos de análise</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-cyan mt-2 ring-2 ring-videira-cyan/30" />
            <p className="text-sm text-muted-foreground">
              Use <span className="font-semibold text-foreground">filtros de data</span> para analisar períodos específicos e identificar tendências
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-blue mt-2 ring-2 ring-videira-blue/30" />
            <p className="text-sm text-muted-foreground">
              Exporte relatórios em <span className="font-semibold text-foreground">CSV</span> para compartilhar com a equipe
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-purple mt-2 ring-2 ring-videira-purple/30" />
            <p className="text-sm text-muted-foreground">
              O relatório de <span className="font-semibold text-foreground">inadimplentes</span> é atualizado em tempo real
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-2 w-2 rounded-full bg-videira-cyan mt-2 ring-2 ring-videira-cyan/30" />
            <p className="text-sm text-muted-foreground">
              Combine diferentes relatórios para uma <span className="font-semibold text-foreground">análise completa</span> da organização
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
