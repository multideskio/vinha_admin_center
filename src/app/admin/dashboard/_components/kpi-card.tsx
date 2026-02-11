'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type KpiCardProps = {
  title: string
  icon: React.ElementType
  data?: {
    value: string
    change: string
  }
  variant: 'primary' | 'secondary'
  colorIndex: number
}

const primaryColors = [
  {
    border: 'border-t-videira-cyan',
    bg: 'bg-gradient-to-br from-videira-cyan/5 via-background to-background',
    iconBg: 'bg-videira-cyan/15 ring-2 ring-videira-cyan/30',
    iconColor: 'text-videira-cyan',
    textColor: 'text-videira-cyan',
  },
  {
    border: 'border-t-videira-blue',
    bg: 'bg-gradient-to-br from-videira-blue/5 via-background to-background',
    iconBg: 'bg-videira-blue/15 ring-2 ring-videira-blue/30',
    iconColor: 'text-videira-blue',
    textColor: 'text-videira-blue',
  },
  {
    border: 'border-t-videira-purple',
    bg: 'bg-gradient-to-br from-videira-purple/5 via-background to-background',
    iconBg: 'bg-videira-purple/15 ring-2 ring-videira-purple/30',
    iconColor: 'text-videira-purple',
    textColor: 'text-videira-purple',
  },
  {
    border: 'border-t-orange-500',
    bg: 'bg-gradient-to-br from-orange-500/5 via-background to-background',
    iconBg: 'bg-orange-500/15 ring-2 ring-orange-500/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
]

const secondaryColors = [
  {
    border: 'border-l-green-500',
    bg: 'bg-gradient-to-r from-green-500/5 to-background',
    iconBg: 'bg-green-500/15 ring-1 ring-green-500/30',
    iconColor: 'text-green-600 dark:text-green-400',
    textColor: 'text-green-600 dark:text-green-400',
  },
  {
    border: 'border-l-blue-500',
    bg: 'bg-gradient-to-r from-blue-500/5 to-background',
    iconBg: 'bg-blue-500/15 ring-1 ring-blue-500/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    border: 'border-l-purple-500',
    bg: 'bg-gradient-to-r from-purple-500/5 to-background',
    iconBg: 'bg-purple-500/15 ring-1 ring-purple-500/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
]

export function KpiCard({ title, icon: Icon, data, variant, colorIndex }: KpiCardProps) {
  const colors = variant === 'primary' ? primaryColors[colorIndex] : secondaryColors[colorIndex]

  if (!colors) {
    return null // Fallback para índices inválidos
  }

  const isPrimary = variant === 'primary'

  return (
    <Card
      className={cn(
        'hover:shadow-2xl transition-all duration-300 h-full relative overflow-hidden group',
        isPrimary ? 'hover:scale-[1.05] border-t-4' : 'hover:scale-[1.02] border-l-4',
        colors.border,
        colors.bg,
      )}
    >
      {/* Efeito de brilho no hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide truncate pr-2">
          {title}
        </CardTitle>
        <div
          className={cn(
            'p-2 sm:p-3 rounded-xl shadow-lg transition-transform group-hover:scale-110 flex-shrink-0',
            isPrimary && 'group-hover:rotate-6',
            colors.iconBg,
          )}
        >
          <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', colors.iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        {data ? (
          <>
            <div
              className={cn(
                'text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 tracking-tight',
                colors.textColor,
              )}
            >
              {data.value}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium line-clamp-2">
              {data.change}
            </p>
          </>
        ) : (
          <>
            <Skeleton className={cn('h-6 sm:h-8 lg:h-9 w-16 sm:w-20 lg:w-24 mb-1 sm:mb-2')} />
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-24 lg:w-32" />
          </>
        )}
      </CardContent>
    </Card>
  )
}
