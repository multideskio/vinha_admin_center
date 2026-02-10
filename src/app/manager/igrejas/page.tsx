'use client'

// @lastReview 2025-01-05 21:30 - Fixed responsive grid classes for better mobile support

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
  User,
  Calendar as CalendarIcon,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { PhoneInput } from '@/components/ui/phone-input'

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

import { Input } from '@/components/ui/input'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

import { churchProfileSchema } from '@/lib/types'
import { sanitizeText } from '@/lib/sanitize'

type Church = z.infer<typeof churchProfileSchema> & {
  id: string
  status: 'active' | 'inactive'
  supervisorName?: string
  avatarUrl?: string
}

type Supervisor = {
  id: string
  name: string
}

const ChurchFormModal = ({
  onSave,
  supervisors,
  children,
}: {
  onSave: () => void
  supervisors: Supervisor[]
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isFetchingCep, setIsFetchingCep] = React.useState(false)
  const [isFetchingCnpj, setIsFetchingCnpj] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof churchProfileSchema>>({
    resolver: zodResolver(churchProfileSchema),
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
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen, form])

  const handleSave = async (data: z.infer<typeof churchProfileSchema>) => {
    try {
      const response = await fetch('/api/v1/manager/igrejas', {
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
        description: sanitizeText(errorMessage),
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
      const response = await fetch(`/api/v1/cep?cep=${cep}`)
      if (!response.ok) return

      const data = await response.json()
      form.setValue('address', data.address || '')
      form.setValue('neighborhood', data.neighborhood || '')
      form.setValue('city', data.city || '')
      form.setValue('state', data.state || '')
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
            <FormField
              control={form.control}
              name="supervisorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecione um supervisor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um supervisor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supervisors.map((supervisor) => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <FormLabel>Celular/WhatsApp</FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        type="mobile"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = viewMode === 'table' ? 10 : 9
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [churchesRes, supervisorsRes] = await Promise.all([
        fetch('/api/v1/manager/igrejas'),
        fetch('/api/v1/manager/supervisores?minimal=true'),
      ])

      if (!churchesRes.ok) throw new Error('Falha ao carregar igrejas.')
      if (!supervisorsRes.ok) throw new Error('Falha ao carregar supervisores.')

      const churchesData = await churchesRes.json()
      const supervisorsData = await supervisorsRes.json()

      setChurches(churchesData.churches)
      setSupervisors(supervisorsData.supervisors)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: sanitizeText(errorMessage), variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredChurches = churches.filter((church) =>
    (church.nomeFantasia || '').toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
    <Card className="shadow-lg border-t-4 border-t-videira-cyan">
      <CardContent className="pt-6">
        <div className="rounded-md border-2">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-videira-cyan/10 via-videira-blue/10 to-videira-purple/10">
                <TableHead className="font-semibold">Nome Fantasia</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">CNPJ</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Email</TableHead>
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
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
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
                  <TableRow key={church.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Image
                          src={church.avatarUrl || 'https://placehold.co/40x40.png'}
                          alt={church.nomeFantasia || 'Igreja'}
                          width={40}
                          height={40}
                          className="rounded-full object-cover ring-2 ring-videira-cyan/30"
                          unoptimized
                        />
                        <span className="font-semibold">{sanitizeText(church.nomeFantasia)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {sanitizeText(church.cnpj)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {sanitizeText(church.email)}
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
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/manager/igrejas/${church.id}`}>Editar</Link>
                          </DropdownMenuItem>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardContent className="pt-6">
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))
        ) : paginatedChurches.length > 0 ? (
          paginatedChurches.map((church) => {
            return (
              <Card
                key={church.id}
                className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                      <Image
                        src={church.avatarUrl || 'https://placehold.co/96x96.png'}
                        alt={`Foto da ${church.nomeFantasia}`}
                        width={80}
                        height={80}
                        className="rounded-xl object-cover w-20 h-20 ring-2 ring-videira-cyan/30"
                        unoptimized
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-bold leading-tight">
                            {sanitizeText(church.nomeFantasia)}
                          </h3>
                          <Badge
                            variant={church.status === 'active' ? 'success' : 'destructive'}
                            className="text-xs"
                          >
                            {church.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <Badge variant="outline" className="font-medium">
                          <User className="h-3 w-3 mr-1" />
                          {sanitizeText(church.supervisorName) || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <FileText size={14} className="text-videira-cyan" />
                        <span>{sanitizeText(church.cnpj)}</span>
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail size={14} className="text-videira-cyan" />
                        <span>{sanitizeText(church.email)}</span>
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone size={14} className="text-videira-cyan" />
                        <span>{sanitizeText(church.phone)}</span>
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <MapPin size={14} className="text-videira-cyan" />
                        <span>
                          {sanitizeText(church.city)} - {sanitizeText(church.state)}
                        </span>
                      </p>
                    </div>
                    <Link href={`/manager/igrejas/${church.id}`} className="w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-2 hover:bg-videira-cyan/10 hover:border-videira-cyan hover:text-videira-cyan transition-all"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Perfil
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma igreja encontrada.
          </div>
        )}
      </div>
      <PaginationControls />
    </>
  )

  const PaginationControls = () => (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-sm text-muted-foreground">
        Página {currentPage} de {totalPages || 1}
      </p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1 || isLoading}
          className="border-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={currentPage === totalPages || isLoading}
          className="border-2"
        >
          Próximo <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
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
                Igrejas da Rede
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                {filteredChurches.length} de {churches.length} igrejas
              </p>
            </div>
            <ChurchFormModal onSave={fetchData} supervisors={supervisors}>
              <Button className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold">
                <PlusCircle className="h-5 w-5 mr-2" />
                Nova Igreja
              </Button>
            </ChurchFormModal>
          </div>
        </div>
      </div>

      {/* Barra de busca e filtros */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome fantasia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-2 focus:border-videira-cyan"
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('table')}
                className={cn(viewMode === 'table' && 'bg-videira-cyan text-white')}
              >
                <List className="h-4 w-4" />
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
                className={cn(viewMode === 'card' && 'bg-videira-cyan text-white')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Visualizar em cards</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {viewMode === 'table' ? <TableView /> : <CardView />}
    </div>
  )
}
