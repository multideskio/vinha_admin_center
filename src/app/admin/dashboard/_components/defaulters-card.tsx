'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardData } from '@/lib/types/dashboard-types'

type DefaultersCardProps = {
  defaulters: DashboardData['defaulters'] | undefined
  isLoading: boolean
}

export function DefaultersCard({ defaulters, isLoading }: DefaultersCardProps) {
  if (isLoading || !defaulters) {
    return (
      <Card className="h-full shadow-lg border-t-4 border-t-destructive hover:shadow-xl transition-all bg-gradient-to-br from-destructive/5 to-background">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30 flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                </div>
                <span className="truncate">Inadimplentes (3 meses)</span>
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                Pastores e igrejas que não contribuíram nos últimos 3 meses.
              </CardDescription>
            </div>
            <Skeleton className="h-8 w-20 sm:w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full shadow-lg border-t-4 border-t-destructive hover:shadow-xl transition-all bg-gradient-to-br from-destructive/5 to-background">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30 flex-shrink-0">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              </div>
              <span className="truncate">Inadimplentes (3 meses)</span>
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              Pastores e igrejas que não contribuíram nos últimos 3 meses.
            </CardDescription>
          </div>
          {defaulters.length > 6 && (
            <Link href="/admin/relatorios/inadimplentes">
              <Button
                size="sm"
                className="bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold whitespace-nowrap text-xs sm:text-sm"
              >
                Ver todos ({defaulters.length})
                <ExternalLink className="h-3 w-3 ml-1 sm:ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {defaulters.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum inadimplente nos últimos 3 meses! 🎉
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {defaulters.slice(0, 6).map((defaulter) => {
                const profilePath = defaulter.type === 'pastor' ? 'pastores' : 'igrejas'
                return (
                  <div
                    key={defaulter.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/${profilePath}/${defaulter.id}`}
                        className="text-sm font-medium hover:underline text-primary flex items-center gap-1"
                      >
                        <span className="truncate">{defaulter.name}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {defaulter.type === 'pastor' ? 'Pastor' : 'Igreja'} • Dia{' '}
                        {defaulter.titheDay}
                      </p>
                    </div>
                    <Badge variant="destructive" className="ml-2 flex-shrink-0">
                      {defaulter.daysLate}d
                    </Badge>
                  </div>
                )
              })}
            </div>
            {defaulters.length > 6 && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/relatorios/inadimplentes">
                  <Button className="w-full bg-white dark:bg-background border-2 border-destructive text-destructive hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-md font-semibold text-sm">
                    Ver lista completa ({defaulters.length} inadimplentes)
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
