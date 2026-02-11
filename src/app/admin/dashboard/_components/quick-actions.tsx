'use client'

import * as React from 'react'
import Link from 'next/link'
import { Activity, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type QuickActionsProps = {
  hasData: boolean
  onExportDefaulters: () => void
  onExportTransactions: () => void
}

export function QuickActions({
  hasData,
  onExportDefaulters,
  onExportTransactions,
}: QuickActionsProps) {
  return (
    <Card className="shadow-lg border-l-4 border-l-videira-cyan hover:shadow-xl transition-all">
      <CardHeader>
        <div>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-videira-cyan flex-shrink-0" />
            <span className="truncate">Ações Rápidas</span>
          </CardTitle>
          <CardDescription className="mt-1 text-sm">
            Operações administrativas frequentes
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link href="/admin/configuracoes/mensagens">
            <Button className="bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md font-semibold text-sm">
              Configurar mensagens
            </Button>
          </Link>
          {hasData ? (
            <>
              <Button
                onClick={onExportDefaulters}
                className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold text-sm"
              >
                <Save className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Exportar </span>Inadimplentes
              </Button>
              <Button
                onClick={onExportTransactions}
                className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold text-sm"
              >
                <Save className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Exportar </span>Transações
              </Button>
            </>
          ) : (
            <>
              <Skeleton className="h-10 w-32 sm:w-44" />
              <Skeleton className="h-10 w-28 sm:w-40" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
