'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MoreHorizontal, Pencil, UserCheck } from 'lucide-react'
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
import { DeletePastorDialog } from './delete-pastor-dialog'
import type { Pastor } from './pastores-client'

interface PastorTableViewProps {
  pastors: Pastor[]
  isLoading: boolean
  onDelete: (pastorId: string, reason: string) => void
}

/**
 * Visualização em tabela de pastores
 * Exibe lista com avatar, nome, email, celular, supervisor, status e ações
 */
export function PastorTableView({ pastors, isLoading, onDelete }: PastorTableViewProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
            <TableHead className="font-semibold">Pastor</TableHead>
            <TableHead className="hidden md:table-cell font-semibold">Email</TableHead>
            <TableHead className="hidden lg:table-cell font-semibold">Celular</TableHead>
            <TableHead className="hidden xl:table-cell font-semibold">Supervisor</TableHead>
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
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 ml-auto" />
                </TableCell>
              </TableRow>
            ))
          ) : pastors.length > 0 ? (
            // Lista de pastores
            pastors.map((pastor) => (
              <TableRow key={pastor.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Image
                      src={pastor.avatarUrl || 'https://placehold.co/40x40.png'}
                      alt={`${pastor.firstName} ${pastor.lastName}`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {pastor.firstName} {pastor.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground md:hidden">
                        {pastor.email}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {pastor.email}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {pastor.phone || 'N/A'}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-muted-foreground">
                  {pastor.supervisorName || 'N/A'}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={pastor.status === 'active' ? 'success' : 'destructive'}>
                    {pastor.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/pastores/${pastor.id}`}>
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
                        <DeletePastorDialog pastorId={pastor.id} onConfirm={onDelete} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            // Estado vazio
            <TableRow>
              <TableCell colSpan={6} className="text-center h-32">
                <div className="flex flex-col items-center gap-3 py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">
                    Nenhum pastor encontrado
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
