'use client'

import * as React from 'react'
import { Pie, PieChart, Cell, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart'
import type { DashboardData } from '@/lib/types/dashboard-types'

type RevenueChartsProps = {
  revenueByMethod: DashboardData['revenueByMethod']
  revenueByRegion: DashboardData['revenueByRegion']
  churchesByRegion: DashboardData['churchesByRegion']
}

export function RevenueCharts({
  revenueByMethod,
  revenueByRegion,
  churchesByRegion,
}: RevenueChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
      {/* Arrecadação por método - 2 colunas no lg */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Arrecadação por Método</CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="w-full">
              <ChartContainer className="h-[240px] sm:h-[280px] lg:h-[300px] w-full" config={{}}>
                <PieChart>
                  <Tooltip content={<ChartTooltipContent nameKey="method" hideLabel />} />
                  <Legend content={<ChartLegendContent nameKey="method" />} />
                  <Pie
                    data={revenueByMethod}
                    dataKey="value"
                    nameKey="method"
                    innerRadius={40}
                    outerRadius="70%"
                  >
                    {revenueByMethod.map((entry) => (
                      <Cell key={entry.method} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por região - 3 colunas no lg */}
      <div className="lg:col-span-3">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Distribuição por Região</CardTitle>
            <CardDescription>Arrecadação e quantidade de igrejas por região</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {revenueByRegion && revenueByRegion.length > 0 ? (
                <div className="w-full">
                  <ChartContainer
                    config={{}}
                    className="h-[220px] sm:h-[240px] lg:h-[260px] w-full"
                  >
                    <PieChart>
                      <Tooltip content={<ChartTooltipContent hideLabel />} />
                      <Legend content={<ChartLegendContent nameKey="name" />} />
                      <Pie
                        data={revenueByRegion}
                        dataKey="revenue"
                        nameKey="name"
                        innerRadius={35}
                        outerRadius="65%"
                      >
                        {revenueByRegion.map((entry, index) => (
                          <Cell key={`cell-revenue-${index}`} fill={entry.fill || '#8884d8'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sem dados de arrecadação por região.
                </p>
              )}

              {churchesByRegion && churchesByRegion.length > 0 ? (
                <div className="w-full">
                  <ChartContainer
                    config={{}}
                    className="h-[220px] sm:h-[240px] lg:h-[260px] w-full"
                  >
                    <PieChart>
                      <Tooltip content={<ChartTooltipContent hideLabel />} />
                      <Legend content={<ChartLegendContent nameKey="name" />} />
                      <Pie
                        data={churchesByRegion}
                        dataKey="count"
                        nameKey="name"
                        innerRadius={35}
                        outerRadius="65%"
                      >
                        {churchesByRegion.map((entry, index) => (
                          <Cell key={`cell-churches-${index}`} fill={entry.fill || '#82ca9d'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados de igrejas por região.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
