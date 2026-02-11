'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MoreHorizontal, Pencil, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteSupervisorDialog } from './delete-supervisor-dialog'
import type { Supervisor } from './supervisores-client'

interface SupervisorTableViewProps {
  supervisors: Supervisor[]
  isLoading: boolean
  onDelete: (supervisorId: string, reason: string) => void
}

/**
 * Visualização em tabela de supervisores
 * Exibe lista com avatar, nome, email, celular, gerente, região, status e ações
 */
export function SupervisorTableView({
  supervisors,
  isLoading,
  onDelete,
}: SupervisorTableViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
            <TableHead className="font-semibold">Supervisor</TableHead>
            <TableHead className="hidden md:table-cell font-semibold">Email</TableHead>
            <TableHead className="hidden lg:table-cell font-semibold">Celular</TableHead>
            <TableHead className="hidden xl:table-cell font-semibold">Gerente</TableHead>
            <TableHead className="hidden xl:table-cell font-semibold">Região</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : supervisors.length > 0 ? (
            // Lista de supervisores
            supervisors.map((supervisor) => (
              <TableRow key={supervisor.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Image
                      src={supervisor.avatarUrl || 'https://placehold.co/40x40.png'}
                      alt={`${supervisor.firstName} ${supervisor.lastName}`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {supervisor.firstName} {supervisor.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground md:hidden">
                        {supervisor.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {supervisor.email}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {supervisor.phone || 'N/A'}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-muted-foreground">
                  {supervisor.managerName || 'N/A'}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-muted-foreground">
                  {supervisor.regionName || 'N/A'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={supervisor.status === 'active' ? 'success' : 'destructive'}>
                    {supervisor.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/supervisores/${supervisor.id}`}>
                      <Button
                        size="sm"
                        className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DeleteSupervisorDialog supervisorId={supervisor.id} onConfirm={onDelete} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            // Estado vazio
            <TableRow>
              <TableCell colSpan={7} className="text-center h-32">
                <div className="flex flex-col items-center gap-3 py-8">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum supervisor encontrado
                  </p>
                  <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
