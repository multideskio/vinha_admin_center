'use client'

import { TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type VideiraTableHeaderProps = {
  children: React.ReactNode
  className?: string
}

/**
 * Header de tabela padronizado com gradiente Videira.
 * Substitui o padrão repetido de bg-gradient-to-r em todas as tabelas.
 */
export function VideiraTableHeader({ children, className }: VideiraTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow
        className={cn(
          'bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10',
          className,
        )}
      >
        {children}
      </TableRow>
    </TableHeader>
  )
}
