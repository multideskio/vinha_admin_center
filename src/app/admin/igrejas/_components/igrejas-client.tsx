'use client'

import * as React from 'react'
import { ChurchIcon, List, Grid3x3, Search, RefreshCw, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { PageHeader } from '../../_components/PageHeader'
import { PaginationControls } from '../../_components/PaginationControls'
import { ChurchFormModal } from './church-form-modal'
import { ChurchTableView } from './church-table-view'
import { ChurchCardView } from './church-card-view'

export type Church = {
  id: string
  email: string
  status: 'active' | 'inactive'
  phone: string
  titheDay: number | null
  avatarUrl: string | null
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  foundationDate: Date | null
  cep: string
  state: string
  city: string
  neighborhood: string
  address: string
  treasurerFirstName: string | null
  treasurerLastName: string | null
  treasurerCpf: string | null
  facebook: string | null
  instagram: string | null
  website: string | null
  supervisorId: string | null
}

export type Supervisor = {
  id: string
  firstName: string
  lastName: string
}

interface IgrejasClientProps {
  initialChurches: Church[]
  supervisors: Supervisor[]
}

export function IgrejasClient({ initialChurches, supervisors }: IgrejasClientProps) {
  const [churches, setChurches] = React.useState<Church[]>(initialChurches)
  const [isLoading, setIsLoading] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = viewMode === 'table' ? 20 : 12
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/igrejas')
      if (!response.ok) throw new Error('Falha ao carregar igrejas.')

      const data = await response.json()
      setChurches(data.churches)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const handleDelete = async (churchId: string, reason: string) => {
    try {
      const response = await fetch(`/api/v1/igrejas/${churchId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason }),
      })
      if (!response.ok) throw new Error('Falha ao excluir a igreja.')

      toast({
        title: 'Sucesso!',
        description: 'Igreja excluída com sucesso.',
        variant: 'success',
      })
      fetchData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const filteredChurches = churches.filter(
    (church) =>
      church.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.cnpj?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredChurches.length / itemsPerPage)
  const paginatedChurches = filteredChurches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Igrejas"
        description="Gerencie todas as igrejas cadastradas na plataforma"
        icon={ChurchIcon}
      />

      <Card className="shadow-lg border-l-4 border-l-videira-blue">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
                  <ChurchIcon className="h-5 w-5 text-videira-blue" />
                </div>
                Gerenciamento de Igrejas
              </CardTitle>
              <CardDescription className="mt-2">
                {filteredChurches.length} igrejas encontradas
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ChurchFormModal onSave={fetchData} supervisors={supervisors}>
                <Button className="bg-videira-blue hover:bg-videira-blue/90 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Igreja
                </Button>
              </ChurchFormModal>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou CNPJ..."
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
            <ChurchTableView
              churches={paginatedChurches}
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          ) : (
            <ChurchCardView
              churches={paginatedChurches}
              isLoading={isLoading}
              onDelete={handleDelete}
            />
          )}

          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredChurches.length}
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
