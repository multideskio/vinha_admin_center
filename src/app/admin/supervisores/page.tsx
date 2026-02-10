/**
 * @fileoverview Página de listagem e gerenciamento de supervisores (visão do admin).
 * @version 1.3
 * @date 2024-08-07
 * @author PH
 */

'use client'

import * as React from 'react'
import {
  MoreHorizontal,
  PlusCircle,
  AlertTriangle,
  List,
  Grid3x3,
  FileText,
  Phone,
  Mail,
  Pencil,
  User,
  Map,
  Search,
  UserCheck,
  RefreshCw,
  Users,
  MapPin,
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { PhoneInput } from '@/components/ui/phone-input'
import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import {
  supervisorProfileSchema,
  type UserStatus,
  type Region as RegionType,
  type ManagerProfile,
} from '@/lib/types'
import { cn } from '@/lib/utils'
import { PaginationControls } from '../_components/PaginationControls'
import { PageHeader } from '../_components/PageHeader'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type Region = RegionType

const DeleteSupervisorDialog = ({
  supervisorId,
  onConfirm,
}: {
  supervisorId: string
  onConfirm: (id: string, reason: string) => void
}) => {
  const [reason, setReason] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  const handleConfirm = () => {
    onConfirm(supervisorId, reason)
    setIsOpen(false)
    setReason('')
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-600">
        Excluir
      </AlertDialogTrigger>
      <AlertDialogContent className="border-2 border-destructive/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            Confirmar Exclusão do Supervisor
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível e será registrada para auditoria. Por favor, forneça um motivo
            detalhado para a exclusão deste supervisor.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <Label htmlFor="deletion-reason" className="font-semibold">
            Motivo da Exclusão *
          </Label>
          <Textarea
            id="deletion-reason"
            placeholder="Ex: Duplicidade de cadastro, solicitação do usuário, desligamento da organização, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px] border-destructive/30 focus:border-destructive"
          />
          <p className="text-xs text-muted-foreground">
            Este motivo será armazenado permanentemente no sistema.
          </p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="bg-destructive hover:bg-destructive/90 font-semibold"
          >
            Confirmar Exclusão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type Supervisor = z.infer<typeof supervisorProfileSchema> & {
  id: string
  status: UserStatus
  managerName?: string | null
  regionName?: string | null
  email: string
  phone: string | null
  avatarUrl?: string
}

type Manager = ManagerProfile & { id: string }

const SupervisorFormModal = ({
  onSave,
  managers,
  regions,
  children,
}: {
  onSave: () => void
  managers: Manager[]
  regions: RegionType[]
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isFetchingCep, setIsFetchingCep] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof supervisorProfileSchema>>({
    resolver: zodResolver(supervisorProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      cpf: '',
      email: '',
      cep: '',
      state: '',
      city: '',
      neighborhood: '',
      address: '',
      titheDay: 1,
      phone: '',
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen, form])

  const handleSave = async (data: z.infer<typeof supervisorProfileSchema>) => {
    try {
      const response = await fetch('/api/v1/admin/supervisores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Falha ao cadastrar supervisor.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Supervisor cadastrado com sucesso.',
        variant: 'success',
      })
      onSave()
      setIsOpen(false)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14)
  }

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)
  }

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length !== 8) return

    setIsFetchingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      if (!data.erro) {
        form.setValue('address', data.logradouro)
        form.setValue('neighborhood', data.bairro)
        form.setValue('city', data.localidade)
        form.setValue('state', data.uf)
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setIsFetchingCep(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-videira-blue" />
            Cadastro de Supervisor
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do novo supervisor. A senha padrão será 123456.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 p-4">
            <Alert className="bg-videira-blue/10 border-videira-blue/30">
              <AlertTriangle className="h-4 w-4 text-videira-blue" />
              <AlertDescription className="text-videira-blue">
                A senha padrão é <strong>123456</strong> até o usuário cadastrar uma nova senha.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecione um gerente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um gerente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.firstName} {manager.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="regionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecione uma região</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma região" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.id} value={region.id}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Primeiro nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input placeholder="Sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                        onChange={(e) => field.onChange(formatCPF(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="exemplo@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatCEP(e.target.value))}
                        onBlur={handleCepBlur}
                        disabled={isFetchingCep}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UF"
                        {...field}
                        value={field.value ?? ''}
                        disabled={isFetchingCep}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da cidade"
                        {...field}
                        value={field.value ?? ''}
                        disabled={isFetchingCep}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="neighborhood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome do bairro"
                        {...field}
                        value={field.value ?? ''}
                        disabled={isFetchingCep}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Rua, número, complemento"
                      {...field}
                      value={field.value ?? ''}
                      disabled={isFetchingCep}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titheDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do dízimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="1 a 31"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular *</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        type="mobile"
                        placeholder="(11) 99999-9999"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isFetchingCep}
                className="bg-videira-blue hover:bg-videira-blue/90 text-white"
              >
                {isFetchingCep ? 'Buscando CEP...' : 'Cadastrar Supervisor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function SupervisoresPage() {
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([])
  const [managers, setManagers] = React.useState<Manager[]>([])
  const [regions, setRegions] = React.useState<Region[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = viewMode === 'table' ? 20 : 12
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [supervisorsRes, managersRes, regionsRes] = await Promise.all([
        fetch('/api/v1/admin/supervisores'),
        fetch('/api/v1/admin/gerentes?minimal=true'),
        fetch('/api/v1/regioes?minimal=true'),
      ])

      if (!supervisorsRes.ok) throw new Error('Falha ao carregar supervisores.')
      if (!managersRes.ok) throw new Error('Falha ao carregar gerentes.')
      if (!regionsRes.ok) throw new Error('Falha ao carregar regiões.')

      const supervisorsData = await supervisorsRes.json()
      const managersData = await managersRes.json()
      const regionsData = await regionsRes.json()

      setSupervisors(supervisorsData.supervisors)
      setManagers(managersData.managers)
      setRegions(regionsData.regions)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const filteredSupervisors = supervisors.filter(
    (supervisor) =>
      `${supervisor.firstName} ${supervisor.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      supervisor.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredSupervisors.length / itemsPerPage)
  const paginatedSupervisors = filteredSupervisors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const TableView = () => (
    <Card className="shadow-lg border-l-4 border-l-videira-blue">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
            <List className="h-5 w-5 text-videira-blue" />
          </div>
          Lista de Supervisores
        </CardTitle>
        <CardDescription>{filteredSupervisors.length} supervisores encontrados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Email</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Região</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedSupervisors.length > 0 ? (
                paginatedSupervisors.map((supervisor) => (
                  <TableRow key={supervisor.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Image
                          src={supervisor.avatarUrl || 'https://placehold.co/32x32.png'}
                          alt={`${supervisor.firstName} ${supervisor.lastName}`}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                        {`${supervisor.firstName} ${supervisor.lastName}`}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {supervisor.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
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
                            <DeleteSupervisorDialog
                              supervisorId={supervisor.id}
                              onConfirm={handleDelete}
                            />
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
                      <UserCheck className="h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Nenhum supervisor encontrado
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSupervisors.length}
          itemsPerPage={itemsPerPage}
          isLoading={isLoading}
          onPageChange={setCurrentPage}
        />
      </CardContent>
    </Card>
  )

  const CardView = () => (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))
        ) : paginatedSupervisors.length > 0 ? (
          paginatedSupervisors.map((supervisor, index) => (
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
                <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                  <Image
                    src={supervisor.avatarUrl || 'https://placehold.co/96x96.png'}
                    alt={`Foto de ${supervisor.firstName}`}
                    width={96}
                    height={96}
                    className="rounded-lg object-cover w-24 h-24 ring-2 ring-offset-2 ring-offset-background ring-muted"
                    unoptimized
                  />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold truncate">
                        {supervisor.firstName} {supervisor.lastName}
                      </h3>
                      <Badge variant={supervisor.status === 'active' ? 'success' : 'destructive'}>
                        {supervisor.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <User size={14} /> <span>Gerente: {supervisor.managerName || 'N/A'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Map size={14} /> <span>Região: {supervisor.regionName || 'N/A'}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FileText size={14} /> <span>{supervisor.cpf}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone size={14} /> <span>{supervisor.phone}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail size={14} /> <span className="truncate">{supervisor.email}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                  <Link href={`/admin/supervisores/${supervisor.id}`}>
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
            <UserCheck className="h-16 w-16 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum supervisor encontrado
            </p>
          </div>
        )}
      </div>
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredSupervisors.length}
        itemsPerPage={itemsPerPage}
        isLoading={isLoading}
        onPageChange={setCurrentPage}
      />
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Supervisores"
        description="Gerencie os supervisores da organização"
        subtitle={`${supervisors.length} ${supervisors.length === 1 ? 'supervisor cadastrado' : 'supervisores cadastrados'}`}
        icon={UserCheck}
        actions={
          <SupervisorFormModal onSave={fetchData} managers={managers} regions={regions}>
            <Button className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold gap-2">
              <PlusCircle className="h-5 w-5" />
              <span>Novo Supervisor</span>
            </Button>
          </SupervisorFormModal>
        }
        onRefresh={fetchData}
      />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <Card className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Total de Supervisores
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
              <Users className="h-5 w-5 text-videira-cyan" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-cyan">{supervisors.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Cadastrados</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-videira-blue hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Supervisores Ativos
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <UserCheck className="h-5 w-5 text-videira-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-blue">
              {supervisors.filter((s) => s.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">No sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-videira-purple hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Regiões Cobertas
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
              <MapPin className="h-5 w-5 text-videira-purple" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-purple">{regions.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Controles */}
      <Card className="shadow-lg border-l-4 border-l-videira-cyan">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
                  <Search className="h-5 w-5 text-videira-cyan" />
                </div>
                Busca e Visualização
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-8"
              />
            </div>
            <Button
              onClick={fetchData}
              size="icon"
              className="bg-white dark:bg-background border-2 border-videira-purple text-videira-purple hover:bg-videira-purple hover:text-white transition-all shadow-sm hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('table')}
                    className={cn(
                      'h-10 w-10 transition-all',
                      viewMode === 'table' && 'bg-videira-blue text-white',
                    )}
                  >
                    <List className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualizar em tabela</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setViewMode('card')}
                    className={cn(
                      'h-10 w-10 transition-all',
                      viewMode === 'card' && 'bg-videira-blue text-white',
                    )}
                  >
                    <Grid3x3 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualizar em cards</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'table' ? <TableView /> : <CardView />}
    </div>
  )
}
