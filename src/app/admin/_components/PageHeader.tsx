'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

type PageHeaderProps = {
  title: string
  description: string
  subtitle?: string
  icon: React.ElementType
  actions?: React.ReactNode
  onRefresh?: () => void
}

export function PageHeader({
  title,
  description,
  subtitle,
  icon: Icon,
  actions,
  onRefresh,
}: PageHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 videira-gradient opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

      <div className="relative z-10 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
              <Icon className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" />
              <span className="truncate">{title}</span>
            </h1>
            <p className="text-sm sm:text-base text-white/90 mt-2 font-medium">{description}</p>
            {subtitle && <p className="text-xs sm:text-sm text-white/70 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onRefresh && (
              <Button
                size="icon"
                onClick={onRefresh}
                aria-label="Atualizar dados"
                className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white border-white/30 shadow-lg"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            )}
            {actions}
          </div>
        </div>
      </div>
    </div>
  )
}
