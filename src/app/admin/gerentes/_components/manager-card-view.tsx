'use client'

import * as React from 'react'
import { FileText, Phone, Mail, MapPin, Pencil, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Manager } from './gerentes-client'

interface ManagerCardViewProps {
  managers: Manager[]
  isLoading: boolean
  onDelete: (managerId: string, reason: string) => void
}

/**
 * Visualização em cards de gerentes (grid 3 colunas)
 * Mostra: Avatar, Nome, CPF, Email, Celular, Status
 */
export function ManagerCardView({ managers, isLoading }: ManagerCardViewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {isLoading ? (
        Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-24 w-24 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            </CardContent>
          </Card>
        ))
      ) : managers.length > 0 ? (
        managers.map((manager, index) => (
          <Card
            key={manager.id}
            className={cn(
              'shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-t-4',
              index % 3 === 0 && 'border-t-videira-cyan',
              index % 3 === 1 && 'border-t-videira-blue',
              index % 3 === 2 && 'border-t-videira-purple',
            )}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Image
                  src={manager.avatarUrl || 'https://placehold.co/128x128.png'}
                  alt={`Foto de ${manager.firstName}`}
                  width={128}
                  height={128}
                  className="rounded-lg object-cover w-24 h-24 sm:w-32 sm:h-32 ring-2 ring-offset-2 ring-offset-background ring-muted"
                  unoptimized
                />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold truncate">
                      {manager.firstName} {manager.lastName}
                    </h3>
                    <Badge variant={manager.status === 'active' ? 'success' : 'destructive'}>
                      {manager.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <FileText size={14} /> <span>{manager.cpf}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone size={14} /> <span>{manager.phone || '-'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail size={14} /> <span className="truncate">{manager.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>
                        {manager.city} - {manager.state}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4 gap-2">
                <Link href={`/admin/gerentes/${manager.id}`}>
                  <Button
                    size="sm"
                    className="bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="col-span-full flex flex-col items-center gap-3 py-16">
          <Users className="h-16 w-16 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">Nenhum gerente encontrado</p>
        </div>
      )}
    </div>
  )
}
