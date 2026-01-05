/**
 * @fileoverview Componente de preview do tema Videira
 * Use este componente como referência para aplicar as cores da marca
 * @version 1.0
 * @date 2025-11-05
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Users, Activity, TrendingUp, Church, AlertCircle } from 'lucide-react'

export function VideiraThemePreview() {
  return (
    <div className="space-y-8 p-8">
      {/* Header com Gradiente */}
      <div className="videira-gradient p-8 rounded-lg text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Videira Admin Center</h1>
        <p className="text-white/90">Sistema de Gestão de Igrejas</p>
      </div>

      {/* Título com Gradiente de Texto */}
      <div className="text-center">
        <h2 className="text-3xl font-bold videira-gradient-text mb-2">
          Nova Paleta de Cores Aplicada
        </h2>
        <p className="text-muted-foreground">
          Baseada no logo oficial da Videira Igreja em Células
        </p>
      </div>

      {/* KPI Cards com Cores da Marca */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cyan Card */}
        <Card className="hover:shadow-lg transition-all hover:scale-[1.02] border-t-4 border-t-videira-cyan">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrecadação Total</CardTitle>
            <div className="p-2 rounded-lg bg-videira-cyan/10">
              <DollarSign className="h-4 w-4 text-videira-cyan" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 125.430,00</div>
            <p className="text-xs text-muted-foreground">+15.2% vs mês anterior</p>
          </CardContent>
        </Card>

        {/* Blue Card */}
        <Card className="hover:shadow-lg transition-all hover:scale-[1.02] border-t-4 border-t-videira-blue">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <div className="p-2 rounded-lg bg-videira-blue/10">
              <Users className="h-4 w-4 text-videira-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.245</div>
            <p className="text-xs text-muted-foreground">+12 novos este mês</p>
          </CardContent>
        </Card>

        {/* Purple Card */}
        <Card className="hover:shadow-lg transition-all hover:scale-[1.02] border-t-4 border-t-videira-purple">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <div className="p-2 rounded-lg bg-videira-purple/10">
              <Activity className="h-4 w-4 text-videira-purple" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.892</div>
            <p className="text-xs text-muted-foreground">+8.5% vs mês anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Botões com Cores da Marca */}
      <Card>
        <CardHeader>
          <CardTitle>Botões Estilizados</CardTitle>
          <CardDescription>Diferentes variações usando as cores da marca</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          {/* Primary - Blue */}
          <Button className="bg-primary hover:bg-primary/90">Ação Principal (Blue)</Button>

          {/* Secondary - Purple */}
          <Button className="bg-secondary hover:bg-secondary/90">Ação Secundária (Purple)</Button>

          {/* Accent - Cyan */}
          <Button className="bg-accent hover:bg-accent/90">Destaque (Cyan)</Button>

          {/* Com Gradiente */}
          <Button className="videira-gradient hover:opacity-90 text-white">
            Premium (Gradiente)
          </Button>

          {/* Outline com cor */}
          <Button
            variant="outline"
            className="border-videira-blue text-videira-blue hover:bg-videira-blue/10"
          >
            Outline Blue
          </Button>
        </CardContent>
      </Card>

      {/* Badges Coloridos */}
      <Card>
        <CardHeader>
          <CardTitle>Badges com Cores da Marca</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge className="bg-videira-cyan text-white">Novo</Badge>
          <Badge className="bg-videira-blue text-white">Ativo</Badge>
          <Badge className="bg-videira-purple text-white">Premium</Badge>
          <Badge className="bg-success text-white">Aprovado</Badge>
          <Badge className="bg-warning text-white">Pendente</Badge>
          <Badge variant="destructive">Recusado</Badge>
          <Badge className="bg-info text-white">Informação</Badge>
        </CardContent>
      </Card>

      {/* Grid de Cores */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta de Cores Videira</CardTitle>
          <CardDescription>Cores extraídas do logo oficial</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Cyan */}
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-videira-cyan flex items-center justify-center">
                <span className="text-white font-semibold">Cyan</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">#00B8D4</p>
              <p className="text-xs text-center font-mono">188 100% 42%</p>
            </div>

            {/* Blue */}
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-videira-blue flex items-center justify-center">
                <span className="text-white font-semibold">Blue</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">#3F51B5</p>
              <p className="text-xs text-center font-mono">231 48% 48%</p>
            </div>

            {/* Purple */}
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-videira-purple flex items-center justify-center">
                <span className="text-white font-semibold">Purple</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">#673AB7</p>
              <p className="text-xs text-center font-mono">262 52% 47%</p>
            </div>

            {/* Dark Indigo */}
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-videira-dark-indigo flex items-center justify-center">
                <span className="text-white font-semibold text-sm">Dark Indigo</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">#2C3E50</p>
              <p className="text-xs text-center font-mono">210 28% 24%</p>
            </div>

            {/* Muted Indigo */}
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-videira-muted-indigo flex items-center justify-center">
                <span className="text-white font-semibold text-sm">Muted Indigo</span>
              </div>
              <p className="text-xs text-center text-muted-foreground">#4A607A</p>
              <p className="text-xs text-center font-mono">207 24% 38%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu com Hover Effect */}
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de Menu com Hover Videira</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="space-y-2">
            <div className="videira-hover flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer">
              <Church className="h-4 w-4" />
              <span>Igrejas</span>
            </div>
            <div className="videira-hover flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer">
              <Users className="h-4 w-4" />
              <span>Membros</span>
            </div>
            <div className="videira-hover flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer">
              <TrendingUp className="h-4 w-4" />
              <span>Relatórios</span>
            </div>
          </nav>
        </CardContent>
      </Card>

      {/* Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-info bg-info/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-info" />
            <CardTitle className="text-info">Informação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Nova funcionalidade disponível no sistema.</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success bg-success/5">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-success" />
            <CardTitle className="text-success">Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Operação realizada com sucesso!</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
