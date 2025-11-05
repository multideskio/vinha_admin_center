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
  User,
  Calendar as CalendarIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  RefreshCw,
  Users,
  AlertTriangle,
  Church as ChurchIcon,
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PhoneInput } from '@/components/ui/phone-input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SendMessageDialog } from '@/components/ui/send-message-dialog'

const churchSchema = z.object({
  supervisorId: z.string({ required_error: 'Selecione um supervisor.' }),
  cnpj: z.string().min(1, 'O CNPJ/CPF é obrigatório.'),
  razaoSocial: z.string().min(1, 'A razão social é obrigatória.'),
  nomeFantasia: z.string().min(1, 'O nome fantasia é obrigatório.'),
  email: z.string().email({ message: 'E-mail inválido.' }),
  cep: z.string().min(9, { message: 'O CEP deve ter 8 dígitos.' }),
  state: z.string().length(2, { message: 'UF deve ter 2 letras.' }),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  neighborhood: z.string().min(1, { message: 'O bairro é obrigatório.' }),
  address: z.string().min(1, { message: 'O endereço é obrigatório.' }),
  foundationDate: z.date({
    required_error: 'A data de fundação é obrigatória.',
  }),
  titheDay: z.coerce.number().min(1).max(31).nullable(),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
  treasurerFirstName: z.string().min(1, 'O nome do tesoureiro é obrigatório.').nullable(),
  treasurerLastName: z.string().min(1, 'O sobrenome do tesoureiro é obrigatório.').nullable(),
  treasurerCpf: z.string().min(14, 'O CPF do tesoureiro deve ter 11 dígitos.').nullable(),
})

type Church = z.infer<typeof churchSchema> & {
  id: string
  status: 'active' | 'inactive'
  supervisorName?: string
  avatarUrl?: string
}

const DeleteChurchDialog = ({ churchId, onConfirm }: { churchId: string; onConfirm: (id: string, reason: string) => void }) => {
  const [reason, setReason] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  
  const handleConfirm = () => {
    onConfirm(churchId, reason)
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
            Confirmar Exclusão da Igreja
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível e será registrada para auditoria. Por favor, forneça um motivo 
            detalhado para a exclusão desta igreja.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <Label htmlFor="deletion-reason" className="font-semibold">
            Motivo da Exclusão *
          </Label>
          <Textarea
            id="deletion-reason"
            placeholder="Ex: Duplicidade de cadastro, solicitação do usuário, fechamento da igreja, etc."
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

type Supervisor = {
  id: string
  firstName: string
  lastName: string
}

const ChurchFormModal = ({
  onSave,
  children,
  supervisors,
}: {
  onSave: () => void
  children: React.ReactNode
  supervisors: Supervisor[]
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
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen, form])

  const handleSave = async (data: z.infer<typeof churchSchema>) => {
    try {
      const response = await fetch('/api/v1/igrejas', {
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
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14)
  }

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18)
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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-videira-blue" />
            Cadastro de Igreja
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da nova igreja. A senha padrão será 123456.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSave)}
            className="space-y-4 p-4"
          >
            <Alert className="bg-videira-blue/10 border-videira-blue/30">
              <AlertTriangle className="h-4 w-4 text-videira-blue" />
              <AlertDescription className="text-videira-blue">
                A senha padrão é <strong>123456</strong> até a igreja cadastrar uma nova senha.
              </AlertDescription>
            </Alert>

            <FormField
              control={form.control}
              name="supervisorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selecione um supervisor</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um supervisor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {supervisors.map((supervisor) => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.firstName} {supervisor.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        placeholder="Rua, número, complemento"
                        {...field}
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
                          selected={field.value}
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
                        placeholder="(00) 00000-0000"
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
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isFetchingCep || isFetchingCnpj}
                className="bg-videira-blue hover:bg-videira-blue/90 text-white"
              >
                {isFetchingCep || isFetchingCnpj ? 'Buscando dados...' : 'Cadastrar Igreja'}
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
  const itemsPerPage = viewMode === 'table' ? 20 : 12
  const { toast } = useToast()

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [churchesRes, supervisorsRes] = await Promise.all([
        fetch('/api/v1/igrejas'),
        fetch('/api/v1/supervisores?minimal=true'),
      ])

      if (!churchesRes.ok) throw new Error('Falha ao carregar igrejas.')
      if (!supervisorsRes.ok) throw new Error('Falha ao carregar supervisores.')

      const churchesData = await churchesRes.json()
      const supervisorsData = await supervisorsRes.json()

      setChurches(churchesData.churches)
      setSupervisors(supervisorsData.supervisors)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async (churchId: string, reason: string) => {
    try {
      const response = await fetch(`/api/v1/igrejas/${churchId}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason })
      })
      if (!response.ok) throw new Error('Falha ao excluir a igreja.')
      toast({ title: 'Sucesso!', description: 'Igreja excluída com sucesso.', variant: 'success' })
      fetchData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const filteredChurches = churches.filter((church) =>
    church.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    church.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredChurches.length / itemsPerPage)
  const paginatedChurches = filteredChurches.slice(
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
          Lista de Igrejas
        </CardTitle>
        <CardDescription>{filteredChurches.length} igrejas encontradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
                <TableHead className="font-semibold">Nome Fantasia</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">CNPJ</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Email</TableHead>
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
                          src={church.avatarUrl || 'https://placehold.co/32x32.png'}
                          alt={church.nomeFantasia}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                          unoptimized
                        />
                        {church.nomeFantasia}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {church.cnpj}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {church.email}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={church.status === 'active' ? 'success' : 'destructive'}>
                        {church.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/igrejas/${church.id}`}>
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
                            <DeleteChurchDialog churchId={church.id} onConfirm={handleDelete} />
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
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Nenhuma igreja encontrada
                      </p>
                    </div>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                className={cn(
                  "shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-t-4",
                  index % 3 === 0 && "border-t-videira-cyan",
                  index % 3 === 1 && "border-t-videira-blue",
                  index % 3 === 2 && "border-t-videira-purple"
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                    <Image
                      src={church.avatarUrl || 'https://placehold.co/96x96.png'}
                      alt={`Foto da ${church.nomeFantasia}`}
                      width={96}
                      height={96}
                      className="rounded-lg object-cover w-24 h-24 ring-2 ring-offset-2 ring-offset-background ring-muted"
                      unoptimized
                    />
                    <div className="flex-1 space-y-2 min-w-[200px]">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-bold">
                          {church.nomeFantasia}
                        </h3>
                        <Badge variant={church.status === 'active' ? 'success' : 'destructive'}>
                          {church.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                          <User size={14} />{' '}
                          <span>Supervisor: {church.supervisorName || 'N/A'}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <FileText size={14} /> <span>{church.cnpj}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone size={14} /> <span>{church.phone}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail size={14} /> <span className="truncate">{church.email}</span>
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
                  <div className="flex justify-between mt-4">
                    <SendMessageDialog
                      recipientName={church.nomeFantasia}
                      recipientEmail={church.email}
                      recipientPhone={church.phone || ''}
                    >
                      <Button 
                        size="sm"
                        className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Mensagem
                      </Button>
                    </SendMessageDialog>
                    <Link href={`/admin/igrejas/${church.id}`}>
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
            )
          })
        ) : (
          <div className="col-span-full flex flex-col items-center gap-3 py-16">
            <Building2 className="h-16 w-16 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma igreja encontrada</p>
          </div>
        )}
      </div>
      <PaginationControls />
    </>
  )

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredChurches.length)} de {filteredChurches.length} resultados
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1 || isLoading}
          className="h-8 w-8"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1 || isLoading}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 px-4">
          <span className="text-sm font-medium">
            Página {currentPage} de {totalPages || 1}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || isLoading}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          className="h-8 w-8"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header Moderno com Gradiente */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
        
        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                <Building2 className="h-8 w-8" />
                Igrejas
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Gerencie as igrejas da organização
              </p>
              <p className="text-sm text-white/70 mt-1">
                {churches.length} {churches.length === 1 ? 'igreja cadastrada' : 'igrejas cadastradas'}
              </p>
            </div>
            <ChurchFormModal onSave={fetchData} supervisors={supervisors}>
              <Button className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold gap-2">
                <PlusCircle className="h-5 w-5" />
                <span>Nova Igreja</span>
              </Button>
            </ChurchFormModal>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Total de Igrejas
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
              <Building2 className="h-5 w-5 text-videira-cyan" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-cyan">{churches.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Cadastradas</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-videira-blue hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Igrejas Ativas
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <ChurchIcon className="h-5 w-5 text-videira-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-blue">
              {churches.filter(c => c.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">No sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-videira-purple hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Igrejas Inativas
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
              <AlertTriangle className="h-5 w-5 text-videira-purple" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-purple">
              {churches.filter(c => c.status === 'inactive').length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Desativadas</p>
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
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome fantasia ou email..."
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
                      "h-10 w-10 transition-all",
                      viewMode === 'table' && "bg-videira-blue text-white"
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
                      "h-10 w-10 transition-all",
                      viewMode === 'card' && "bg-videira-blue text-white"
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
