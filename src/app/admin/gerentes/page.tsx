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
  MapPin,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PhoneInput } from '@/components/ui/phone-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const DeleteManagerDialog = ({ managerId, onConfirm }: { managerId: string; onConfirm: (id: string, reason: string) => void }) => {
  const [reason, setReason] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  
  const handleConfirm = () => {
    onConfirm(managerId, reason)
    setIsOpen(false)
    setReason('')
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-600">
        Excluir
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Gerente</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível. Por favor, forneça um motivo para a exclusão deste gerente para fins de auditoria.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="deletion-reason">Motivo da Exclusão</Label>
          <Textarea
            id="deletion-reason"
            placeholder="Ex: Duplicidade de cadastro, solicitação do usuário, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!reason.trim()}>
            Excluir permanentemente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const managerSchema = z.object({
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  cep: z.string().min(9, { message: 'O CEP deve ter 8 dígitos.' }),
  state: z.string().length(2, { message: 'UF deve ter 2 letras.' }),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  neighborhood: z.string().min(1, { message: 'O bairro é obrigatório.' }),
  address: z.string().min(1, { message: 'O endereço é obrigatório.' }),
  titheDay: z.coerce.number().min(1).max(31),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
  landline: z.string().optional(),
})

export type Manager = z.infer<typeof managerSchema> & {
  id: string
  status: 'active' | 'inactive'
  avatarUrl?: string
}

const GerenteFormModal = ({
  onSave,
  children,
}: {
  onSave: () => void
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isFetchingCep, setIsFetchingCep] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof managerSchema>>({
    resolver: zodResolver(managerSchema),
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
      landline: '',
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen, form])

  const handleSave = async (data: z.infer<typeof managerSchema>) => {
    try {
      const response = await fetch('/api/v1/admin/gerentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Falha ao cadastrar gerente.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Gerente cadastrado com sucesso.',
        variant: 'success',
      })
      onSave()
      setIsOpen(false)
    } catch (error) {
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
      } else {
        toast({ title: 'Erro', description: 'CEP não encontrado.', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao buscar CEP.', variant: 'destructive' })
    } finally {
      setIsFetchingCep(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cadastro de gerente</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-4 p-4 overflow-y-auto max-h-[80vh]"
          >
            <Alert
              variant="default"
              className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
            >
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                A senha padrão é <strong>123456</strong> até o usuário cadastrar uma nova senha.
                Você também pode alterar a senha no menu de perfil da pessoa cadastrada.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Input placeholder="UF" {...field} disabled={isFetchingCep} />
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
                      <Input placeholder="Nome da cidade" {...field} disabled={isFetchingCep} />
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
                      <Input placeholder="Nome do bairro" {...field} disabled={isFetchingCep} />
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
                      placeholder="O restante do endereço"
                      {...field}
                      disabled={isFetchingCep}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="landline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone Fixo</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        type="landline"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="titheDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do dízimo</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="31" placeholder="1 a 31" {...field} />
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
              <Button type="submit" disabled={isFetchingCep}>
                {isFetchingCep ? 'Buscando CEP...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function GerentesPage() {
  const [managers, setManagers] = React.useState<Manager[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = viewMode === 'table' ? 10 : 9

  const { toast } = useToast()

  const fetchManagers = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/admin/gerentes')
      if (!response.ok) throw new Error('Failed to fetch managers')
      const data = await response.json()
      setManagers(data.managers)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os gerentes.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchManagers()
  }, [fetchManagers])

  const handleDelete = async (managerId: string, reason: string) => {
    try {
      const response = await fetch(`/api/v1/admin/gerentes/${managerId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason })
      })
      if (!response.ok) throw new Error('Failed to delete manager')
      toast({ title: 'Sucesso!', description: 'Gerente excluído com sucesso.', variant: 'success' })
      fetchManagers()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const filteredManagers = managers.filter((manager) =>
    `${manager.firstName} ${manager.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredManagers.length / itemsPerPage)
  const paginatedManagers = filteredManagers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const TableView = () => (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Celular</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
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
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedManagers.length > 0 ? (
              paginatedManagers.map((manager) => (
                <TableRow key={manager.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Image
                        src={manager.avatarUrl || 'https://placehold.co/32x32.png'}
                        alt={`${manager.firstName} ${manager.lastName}`}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                      {`${manager.firstName} ${manager.lastName}`}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {manager.email}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {manager.phone}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={manager.status === 'active' ? 'success' : 'destructive'}>
                      {manager.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/gerentes/${manager.id}`}>Editar</Link>
                        </DropdownMenuItem>
                        <DeleteManagerDialog managerId={manager.id} onConfirm={handleDelete} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum gerente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls />
      </CardContent>
    </Card>
  )

  const CardView = () => (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))
        ) : paginatedManagers.length > 0 ? (
          paginatedManagers.map((manager, index) => (
            <Card key={manager.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Image
                    src={manager.avatarUrl || 'https://placehold.co/128x128.png'}
                    alt={`Foto de ${manager.firstName}`}
                    width={128}
                    height={128}
                    className="rounded-lg object-cover w-full h-auto sm:w-32 sm:h-32"
                    data-ai-hint="handshake business"
                  />
                  <div className="flex-1 space-y-2 min-w-[200px]">
                    <h3 className="text-lg font-bold">
                      #{index + 1} - {manager.firstName} {manager.lastName}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <FileText size={14} /> <span>{manager.cpf}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone size={14} /> <span>{manager.phone}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail size={14} /> <span>{manager.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={14} />{' '}
                        <span>
                          {manager.city} - {manager.state}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/gerentes/${manager.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center">Nenhum gerente encontrado.</div>
        )}
      </div>
      <PaginationControls />
    </>
  )

  const PaginationControls = () => (
    <div className="flex items-center justify-end space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousPage}
        disabled={currentPage === 1 || isLoading}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextPage}
        disabled={currentPage === totalPages || isLoading}
      >
        Próximo
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerentes</h1>
          <p className="text-sm text-muted-foreground">
            Exibindo {filteredManagers.length} de {managers.length} resultados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('table')}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Visualizar em tabela</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('card')}
                  className="h-8 w-8"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Visualizar em cards</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <GerenteFormModal onSave={fetchManagers}>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Novo Gerente</span>
            </Button>
          </GerenteFormModal>
        </div>
      </div>
      {viewMode === 'table' ? <TableView /> : <CardView />}
    </div>
  )
}
