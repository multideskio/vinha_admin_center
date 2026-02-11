/**
 * @fileoverview Página de listagem de igrejas (visão do supervisor).
 * @version 1.3
 * @date 2025-01-06
 * @author Sistema de Padronização
 * @lastReview 2025-01-06 18:00
 */

'use client'

import * as React from 'react'
import {
  MoreHorizontal,
  PlusCircle,
  List,
  Grid3x3,
  FileText,
  Phone,
  Mail,
  MapPin,
  Pencil,
  Calendar as CalendarIcon,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PhoneInput } from '@/components/ui/phone-input'

import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { ClickableAvatar } from '@/components/ui/clickable-avatar'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { DateRange } from 'react-day-picker'

const churchSchema = z.object({
  id: z.string().optional(),
  cnpj: z.string().min(1, 'O CNPJ/CPF é obrigatório.'),
  razaoSocial: z.string().min(1, 'A razão social é obrigatória.'),
  nomeFantasia: z.string().min(1, 'O nome fantasia é obrigatório.'),
  email: z.string().email({ message: 'E-mail inválido.' }),
  cep: z.string().min(9, { message: 'O CEP deve ter 8 dígitos.' }).nullable(),
  state: z.string().length(2, { message: 'UF deve ter 2 letras.' }).nullable(),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }).nullable(),
  neighborhood: z.string().min(1, { message: 'O bairro é obrigatório.' }).nullable(),
  address: z.string().min(1, { message: 'O endereço é obrigatório.' }).nullable(),
  foundationDate: z
    .date({
      required_error: 'A data de fundação é obrigatória.',
    })
    .nullable(),
  titheDay: z.coerce.number().min(1).max(31).nullable(),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }).nullable(),
  treasurerFirstName: z.string().min(1, 'O nome do tesoureiro é obrigatório.').nullable(),
  treasurerLastName: z.string().min(1, 'O sobrenome do tesoureiro é obrigatório.').nullable(),
  treasurerCpf: z.string().min(14, 'O CPF do tesoureiro deve ter 11 dígitos.').nullable(),
  status: z.enum(['active', 'inactive']),
})

type Church = z.infer<typeof churchSchema> & {
  supervisorName?: string
  avatarUrl?: string | null
}

const ChurchFormModal = ({
  onSave,
  children,
}: {
  onSave: () => void
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isFetchingCep, setIsFetchingCep] = React.useState(false)
  const [isFetchingCnpj, setIsFetchingCnpj] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof churchSchema>>({
    resolver: zodResolver(churchSchema),
    defaultValues: {
      razaoSocial: '',
      nomeFantasia: '',
      cnpj: '',
      email: '',
      cep: '',
      state: '',
      city: '',
      neighborhood: '',
      address: '',
      titheDay: 1,
      phone: '',
      treasurerFirstName: '',
      treasurerLastName: '',
      treasurerCpf: '',
      status: 'active',
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen, form])

  const handleSave = async (data: z.infer<typeof churchSchema>) => {
    try {
      const response = await fetch('/api/v1/supervisor/igrejas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Falha ao cadastrar igreja.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Igreja cadastrada com sucesso.',
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
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }

  const formatGenericDocument = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    if (numericValue.length <= 11) {
      return formatCPF(value)
    }
    return formatCNPJ(value)
  }

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, '$1-$2')
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

  const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cnpj = e.target.value.replace(/\D/g, '')
    if (cnpj.length !== 14) return

    setIsFetchingCnpj(true)
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
      if (response.ok) {
        const data = await response.json()
        form.setValue('razaoSocial', data.razao_social)
        form.setValue('nomeFantasia', data.nome_fantasia)
        form.setValue('cep', formatCEP(data.cep))
        form.setValue('state', data.uf)
        form.setValue('city', data.municipio)
        form.setValue('neighborhood', data.bairro)
        form.setValue('address', `${data.logradouro}, ${data.numero}`)
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error)
    } finally {
      setIsFetchingCnpj(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cadastro de igrejas</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-4 p-4 overflow-y-auto max-h-[80vh]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ/CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apenas números"
                        {...field}
                        onChange={(e) => field.onChange(formatGenericDocument(e.target.value))}
                        onBlur={handleCnpjBlur}
                        disabled={isFetchingCnpj}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão social</FormLabel>
                    <FormControl>
                      <Input placeholder="Razão social" {...field} disabled={isFetchingCnpj} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome fantasia" {...field} disabled={isFetchingCnpj} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        disabled={isFetchingCep || isFetchingCnpj}
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
                        disabled={isFetchingCep || isFetchingCnpj}
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
                        disabled={isFetchingCep || isFetchingCnpj}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        disabled={isFetchingCep || isFetchingCnpj}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        value={field.value ?? ''}
                        disabled={isFetchingCep || isFetchingCnpj}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="foundationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de fundação</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>dd/mm/aaaa</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        type="mobile"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="treasurerFirstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Tesoureiro</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="treasurerLastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome Tesoureiro</FormLabel>
                    <FormControl>
                      <Input placeholder="Sobrenome" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="treasurerCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF Tesoureiro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(formatCPF(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
              <Button type="submit" disabled={isFetchingCep || isFetchingCnpj}>
                {isFetchingCep || isFetchingCnpj ? 'Buscando dados...' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function IgrejasPage() {
  const [churches, setChurches] = React.useState<Church[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = viewMode === 'table' ? 10 : 9
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const url = new URL('/api/v1/supervisor/igrejas', window.location.origin)

      // Adicionar parâmetros de data se selecionados
      if (dateRange?.from) {
        const startDate = (dateRange.from as Date).toISOString().substring(0, 10)
        url.searchParams.set('startDate', startDate)
      }
      if (dateRange?.to) {
        const endDate = (dateRange.to as Date).toISOString().substring(0, 10)
        url.searchParams.set('endDate', endDate)
      }

      const response = await fetch(url.toString())
      if (!response.ok) throw new Error('Falha ao carregar igrejas.')
      const data = await response.json()
      setChurches(data.churches)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast, dateRange])

  // Carregar dados iniciais apenas uma vez
  React.useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (churchId: string) => {
    try {
      const response = await fetch(`/api/v1/supervisor/igrejas/${churchId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Falha ao excluir a igreja.')
      toast({ title: 'Sucesso!', description: 'Igreja excluída com sucesso.', variant: 'success' })
      fetchData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const filteredChurches = churches.filter((church) => {
    // Só aplica filtro de busca se tiver 4+ caracteres ou estiver vazio
    if (searchTerm.length === 0 || searchTerm.length >= 4) {
      const nomeFantasia = (church.nomeFantasia || '').toLowerCase()
      const razaoSocial = (church.razaoSocial || '').toLowerCase()
      const email = (church.email || '').toLowerCase()
      const term = searchTerm.toLowerCase()
      return nomeFantasia.includes(term) || razaoSocial.includes(term) || email.includes(term)
    }
    return true // Se tem menos de 4 caracteres, não filtra
  })

  const totalPages = Math.ceil(filteredChurches.length / itemsPerPage)
  const paginatedChurches = filteredChurches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const TableView = () => (
    <Card className="shadow-lg border-t-4 border-t-videira-purple">
      <CardContent className="pt-6">
        <div className="rounded-md border-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
                <TableHead className="font-semibold">Nome Fantasia</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold">CNPJ</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold">Email</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold">Status</TableHead>
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
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedChurches.length > 0 ? (
                paginatedChurches.map((church) => (
                  <TableRow key={church.id}>
                    <TableCell className="font-medium">{church.nomeFantasia}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {church.cnpj}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {church.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={church.status === 'active' ? 'success' : 'destructive'}>
                        {church.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Alternar menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/supervisor/igrejas/${church.id}`}>Editar</Link>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-600">
                              Excluir
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso excluirá permanentemente a
                                  igreja.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => church.id && handleDelete(church.id)}
                                >
                                  Continuar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Nenhuma igreja encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls />
      </CardContent>
    </Card>
  )

  const CardView = () => (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))
        ) : paginatedChurches.length > 0 ? (
          paginatedChurches.map((church, index) => {
            return (
              <Card
                key={church.id}
                className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-videira-purple"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                    <ClickableAvatar
                      src={church.avatarUrl || undefined}
                      alt={`Foto da ${church.nomeFantasia}`}
                      fallback={church.nomeFantasia?.substring(0, 2).toUpperCase() || 'IG'}
                      className="w-24 h-24"
                      enableModal={!!church.avatarUrl}
                    />
                    <div className="flex-1 space-y-2 min-w-[200px]">
                      <h3 className="text-lg font-bold">
                        #{(currentPage - 1) * itemsPerPage + index + 1} - {church.nomeFantasia}
                      </h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <FileText size={14} /> <span>{church.cnpj}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={14} /> <span>{church.phone}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail size={14} /> <span>{church.email}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin size={14} />{' '}
                          <span>
                            {church.city} - {church.state}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-videira-purple hover:text-white transition-colors"
                      asChild
                    >
                      <Link href={`/supervisor/igrejas/${church.id}`}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full text-center">Nenhuma igreja encontrada.</div>
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
        <ChevronLeft className="h-4 w-4" /> Anterior
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
        Próximo <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header com gradiente Videira */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg">
                Igrejas da Supervisão
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Exibindo {filteredChurches.length} de {churches.length} resultados
                {dateRange?.from && dateRange?.to && (
                  <span className="ml-2">
                    • Período: {dateRange.from.toLocaleDateString('pt-BR')} -{' '}
                    {dateRange.to.toLocaleDateString('pt-BR')}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/60" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Buscar por nome fantasia, razão social ou email</p>
                    <p className="text-xs text-muted-foreground">Mínimo 4 caracteres</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('table')}
                      className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white border-white/30"
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
                      className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white border-white/30"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Visualizar em cards</TooltipContent>
                </Tooltip>
                <ChurchFormModal onSave={fetchData}>
                  <Button
                    size="sm"
                    className="gap-1 bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Nova Igreja</span>
                  </Button>
                </ChurchFormModal>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
      {viewMode === 'table' ? <TableView /> : <CardView />}
    </div>
  )
}
