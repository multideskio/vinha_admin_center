'use client'

import * as React from 'react'
import { TrendingUp } from 'lucide-react'
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import type { DumbbellPoint } from '@/lib/types/dashboard-types'

type GrowthChartProps = {
  data: DumbbellPoint[]
  totalNewMembers: number
}

export function GrowthChart({ data, totalNewMembers }: GrowthChartProps) {
  return (
    <Card className="shadow-lg border-l-4 border-l-videira-blue hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-videira-blue flex-shrink-0" />
              <span className="truncate">Progresso de Crescimento</span>
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Comparativo mês a mês (gráfico de pontos/halteres)
            </CardDescription>
          </div>
          <Badge className="bg-videira-blue text-white shadow-md whitespace-nowrap">
            {totalNewMembers} novos membros
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="overflow-hidden">
        <div className="w-full overflow-x-auto -mx-2 px-2">
          <ChartContainer config={{}} className="h-[250px] sm:h-[280px] lg:h-[320px] min-w-[350px]">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
              <Tooltip content={<ChartTooltipContent />} />
              <Line
                type="linear"
                dataKey="prev"
                stroke="transparent"
                dot={data.some((d) => d.prev !== null) ? { r: 5, fill: '#94a3b8' } : false}
              />
              <Line
                type="linear"
                dataKey="current"
                stroke="transparent"
                dot={{ r: 5, fill: 'hsl(var(--primary))' }}
              />
            </ComposedChart>
          </ChartContainer>
        </div>
        {data.length === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Sem dados suficientes para exibir o gráfico.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
