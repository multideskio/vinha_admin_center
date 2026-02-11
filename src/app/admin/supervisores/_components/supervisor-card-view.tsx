'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, Users, Mail, Phone, FileText, User, MapPin, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteSupervisorDialog } from './delete-supervisor-dialog'
import { cn } from '@/lib/utils'
import type { Supervisor } from './supervisores-client'

interface SupervisorCardViewProps {
  supervisors: Supervisor[]
  isLoading: boolean
  onDelete: (supervisorId: string, reason: string) => void
}

/**
 * Visualização em cards de supervisores
 * Grid responsivo com informações principais e ações
 */
export function SupervisorCardView({ supervisors, isLoading, onDelete }: SupervisorCardViewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (supervisors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Users className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">Nenhum supervisor encontrado</p>
        <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {supervisors.map((supervisor, index) => (
        <Card
          key={supervisor.id}
          className={cn(
            'shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-t-4',
            index % 3 === 0 && 'border-t-videira-cyan',
            index % 3 === 1 && 'border-t-videira-blue',
            index % 3 === 2 && 'border-t-videira-purple',
          )}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Header com Avatar e Nome */}
              <div className="flex items-start gap-4">
                <Image
                  src={supervisor.avatarUrl || 'https://placehold.co/80x80.png'}
                  alt={`${supervisor.firstName} ${supervisor.lastName}`}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover ring-2 ring-offset-2 ring-offset-background ring-muted"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold truncate">
                      {supervisor.firstName} {supervisor.lastName}
                    </h3>
                    <Badge variant={supervisor.status === 'active' ? 'success' : 'destructive'}>
                      {supervisor.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Gerente: {supervisor.managerName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Região: {supervisor.regionName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{supervisor.cpf}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{supervisor.email}</span>
                </div>
                {supervisor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{supervisor.phone}</span>
                  </div>
                )}
              </div>

              {/* Informações Adicionais */}
              <div className="pt-3 border-t space-y-1 text-xs text-muted-foreground">
                {supervisor.city && supervisor.state && (
                  <p>
                    <span className="font-semibold">Localização:</span> {supervisor.city} -{' '}
                    {supervisor.state}
                  </p>
                )}
                {supervisor.neighborhood && (
                  <p>
                    <span className="font-semibold">Bairro:</span> {supervisor.neighborhood}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Link href={`/admin/supervisores/${supervisor.id}`} className="flex-1">
                  <Button
                    size="sm"
                    className="w-full bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
                <DeleteSupervisorDialog supervisorId={supervisor.id} onConfirm={onDelete}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DeleteSupervisorDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
