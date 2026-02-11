'use client'

import * as React from 'react'
import { Users, List, Grid3x3, Search, RefreshCw, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '../../_components/PageHeader'
import { PaginationControls } from '../../_components/PaginationControls'
import { SupervisorFormModal } from './supervisor-form-modal'
import { SupervisorTableView } from './supervisor-table-view'
import { SupervisorCardView } from './supervisor-card-view'

export type Supervisor = {
  id: string
  email: string
  status: 'active' | 'inactive'
  phone: string | null
  avatarUrl: string | null
  firstName: string
  lastName: string
  cpf: string
  cep: string
  state: string
  city: string
  neighborhood: string
  address: string
  managerId: string | null
  managerName?: string
  regionId: string | null
  regionName?: string
}

export type Manager = {
  id: string
  firstName: string
  lastName: string
}

export type Region = {
  id: string
  name: string
}

interface SupervisoresClientProps {
  initialSupervisors: Supervisor[]
  managers: Manager[]
  regions: Region[]
}

export function SupervisoresClient({
  initialSupervisors,
  managers,
  regions,
}: SupervisoresClientProps) {
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>(initialSupervisors)
  const [isLoading, setIsLoading] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = viewMode === 'table' ? 20 : 12
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/admin/supervisores')
      if (!response.ok) throw new Error('Falha ao carregar supervisores.')

      const data = await response.json()
      setSupervisors(data.supervisors)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const handleDelete = async (supervisorId: string, reason: string) => {
    try {
      const response = await fetch(`/api/v1/admin/supervisores/${supervisorId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason }),
      })
      if (!response.ok) throw new Error('Falha ao excluir o supervisor.')

      toast({
        title: 'Sucesso!',
        description: 'Supervisor excluído com sucesso.',
        variant: 'success',
      })
      fetchData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const filteredSupervisors = supervisors.filter(
    (supervisor) =>
      `${supervisor.firstName} ${supervisor.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      supervisor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supervisor.cpf?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredSupervisors.length / itemsPerPage)
  const paginatedSupervisors = filteredSupervisors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Supervisores"
        description="Gerencie todos os supervisores cadastrados na plataforma"
        icon={Users}
      />

      <Card className="shadow-lg border-l-4 border-l-videira-blue">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                  <Users className="h-5 w-5 text-videira-blue" />
                </div>
                Gerenciamento de Supervisores
              </CardTitle>
              <CardDescription className="mt-2">
                {filteredSupervisors.length} supervisores encontrados
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <SupervisorFormModal onSave={fetchData} managers={managers} regions={regions}>
                <Button className="bg-videira-blue hover:bg-videira-blue/90 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Novo Supervisor
                </Button>
              </SupervisorFormModal>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-videira-blue hover:bg-videira-blue/90' : ''}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('card')}
                className={viewMode === 'card' ? 'bg-videira-blue hover:bg-videira-blue/90' : ''}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {viewMode === 'table' ? (
            <SupervisorTableView
              supervisors={paginatedSupervisors}
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          ) : (
            <SupervisorCardView
              supervisors={paginatedSupervisors}
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          )}

          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSupervisors.length}
              itemsPerPage={itemsPerPage}
              isLoading={isLoading}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
