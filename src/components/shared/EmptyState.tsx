'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Componente de estado vazio padronizado.
 * Exibe ícone, título, descrição opcional e ação opcional (via children).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 py-16', className)}>
      <Icon className="h-12 w-12 text-muted-foreground" />
      <p className="text-lg font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}
