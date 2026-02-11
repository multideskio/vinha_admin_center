'use client'

import * as React from 'react'
import { MoreHorizontal, Pencil, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteManagerDialog } from './delete-manager-dialog'
import type { Manager } from './gerentes-client'

interface ManagerTableViewProps {
  managers: Manager[]
  isLoading: boolean
  onDelete: (managerId: string, reason: string) => void
}

/**
 * Visualização em tabela de gerentes
 * Mostra: Avatar, Nome, Email, Celular, Status, Ações
 */
export function ManagerTableView({ managers, isLoading, onDelete }: ManagerTableViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
            <TableHead className="font-semibold">Nome</TableHead>
            <TableHead className="hidden md:table-cell font-semibold">Email</TableHead>
            <TableHead className="hidden md:table-cell font-semibold">Celular</TableHead>
            <TableHead className="hidden sm:table-cell font-semibold">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : managers.length > 0 ? (
            managers.map((manager) => (
              <TableRow key={manager.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Image
                      src={manager.avatarUrl || 'https://placehold.co/32x32.png'}
                      alt={`${manager.firstName} ${manager.lastName}`}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                    {`${manager.firstName} ${manager.lastName}`}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {manager.email}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {manager.phone || '-'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={manager.status === 'active' ? 'success' : 'destructive'}>
                    {manager.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/gerentes/${manager.id}`}>
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
                        <DeleteManagerDialog managerId={manager.id} onConfirm={onDelete} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-32">
                <div className="flex flex-col items-center gap-3 py-8">
                  <Users className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum gerente encontrado
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
