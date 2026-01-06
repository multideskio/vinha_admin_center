'use client'

import * as React from 'react'
import { LayoutDashboard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Skeleton } from '@/components/ui/skeleton'

type DashboardHeaderProps = {
  userName: string
  lastUpdatedAt: string | null
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void
  onRefresh: () => void
  onSendReminders: () => void
  sending: boolean
}

export function DashboardHeader({
  userName,
  lastUpdatedAt,
  dateRange,
  onDateRangeChange,
  onRefresh,
  onSendReminders,
  sending,
}: DashboardHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
      {/* Fundo com gradiente */}
      <div className="absolute inset-0 videira-gradient opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

      {/* Efeitos decorativos */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

      <div className="relative z-10 space-y-4">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 flex-1">
            {userName ? (
              <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-2 font-medium">
                Olá, <span className="text-white font-bold">{userName}</span> 👋
              </p>
            ) : (
              <div className="mb-2">
                <Skeleton className="h-4 sm:h-5 lg:h-6 w-32 bg-white/20" />
              </div>
            )}
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-2 sm:gap-3">
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 flex-shrink-0" />
              <span className="truncate">Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-white/90 mt-2 font-medium">
              Visão geral do sistema e estatísticas em tempo real
            </p>
            {lastUpdatedAt ? (
              <p className="text-xs sm:text-sm text-white/70 mt-1">
                Atualizado em {lastUpdatedAt}
              </p>
            ) : (
              <div className="mt-1">
                <Skeleton className="h-3 sm:h-4 w-32 sm:w-40 lg:w-48 bg-white/20" />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <div className="flex-1 sm:flex-initial min-w-0">
                <DateRangePicker
                  value={{ from: dateRange.from, to: dateRange.to }}
                  onDateRangeChange={onDateRangeChange}
                />
              </div>
              <Button
                variant="secondary"
                size="icon"
                onClick={onRefresh}
                title="Atualizar"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg flex-shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={onSendReminders}
              disabled={sending}
              className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold whitespace-nowrap text-sm sm:text-base"
            >
              {sending ? 'Enviando...' : 'Enviar lembretes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}