'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, UserCheck, Mail, Phone, FileText, User, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DeletePastorDialog } from './delete-pastor-dialog'
import { cn } from '@/lib/utils'
import type { Pastor } from './pastores-client'

interface PastorCardViewProps {
  pastors: Pastor[]
  isLoading: boolean
  onDelete: (pastorId: string, reason: string) => void
}

/**
 * Visualização em cards de pastores
 * Grid responsivo com informações principais e ações
 */
export function PastorCardView({ pastors, isLoading, onDelete }: PastorCardViewProps) {
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

  if (pastors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <UserCheck className="h-16 w-16 text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">Nenhum pastor encontrado</p>
        <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {pastors.map((pastor, index) => (
        <Card
          key={pastor.id}
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
                  src={pastor.avatarUrl || 'https://placehold.co/80x80.png'}
                  alt={`${pastor.firstName} ${pastor.lastName}`}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover ring-2 ring-offset-2 ring-offset-background ring-muted"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold truncate">
                      {pastor.firstName} {pastor.lastName}
                    </h3>
                    <Badge variant={pastor.status === 'active' ? 'success' : 'destructive'}>
                      {pastor.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Supervisor: {pastor.supervisorName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{pastor.cpf}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{pastor.email}</span>
                </div>
                {pastor.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{pastor.phone}</span>
                  </div>
                )}
              </div>

              {/* Informações Adicionais */}
              <div className="pt-3 border-t space-y-1 text-xs text-muted-foreground">
                {pastor.city && pastor.state && (
                  <p>
                    <span className="font-semibold">Localização:</span> {pastor.city} -{' '}
                    {pastor.state}
                  </p>
                )}
                {pastor.titheDay && (
                  <p>
                    <span className="font-semibold">Dia do Dízimo:</span> {pastor.titheDay}
                  </p>
                )}
                {pastor.birthDate && (
                  <p>
                    <span className="font-semibold">Nascimento:</span>{' '}
                    {new Date(pastor.birthDate).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Link href={`/admin/pastores/${pastor.id}`} className="flex-1">
                  <Button
                    size="sm"
                    className="w-full bg-white dark:bg-background border-2 border-videira-blue text-videira-blue hover:bg-videira-blue hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </Link>
                <DeletePastorDialog pastorId={pastor.id} onConfirm={onDelete}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DeletePastorDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
