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
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { PhoneInput } from '@/components/ui/phone-input'
import { SendMessageDialog } from '@/components/ui/send-message-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const adminSchema = z.object({
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
  role: z.enum(['admin', 'superadmin'], {
    required_error: 'Selecione uma permissão.',
  }),
})

export type Admin = z.infer<typeof adminSchema> & {
  id: string
  status: 'active' | 'inactive'
  city?: string
  state?: string
  avatarUrl?: string
}

const DeleteAdminDialog = ({
  adminName,
  onConfirm,
}: {
  adminName: string
  onConfirm: (reason: string) => void
}) => {
  const [reason, setReason] = React.useState('')
  return (
    <AlertDialog>
      <AlertDialogTrigger className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-600">
        Excluir
      </AlertDialogTrigger>
      <AlertDialogContent className="border-2 border-destructive/30">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <div className="p-2 rounded-lg bg-destructive/15 ring-2 ring-destructive/30">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            Confirmar Exclusão do Administrador
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação é irreversível e será registrada para auditoria. Por favor, forneça um motivo
            detalhado para a exclusão de {adminName}.
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
            onClick={() => onConfirm(reason)}
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

const AdminFormModal = ({
  onSave,
  children,
}: {
  onSave: () => void
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      cpf: '',
      email: '',
      phone: '',
      role: 'admin',
    },
  })

  React.useEffect(() => {
    if (isOpen) {
      form.reset()
    }
  }, [isOpen, form])

  const handleSave = async (data: z.infer<typeof adminSchema>) => {
    try {
      const response = await fetch('/api/v1/administradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Falha ao cadastrar administrador.')
      }

      toast({
        title: 'Sucesso!',
        description: 'Administrador cadastrado com sucesso.',
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-videira-blue" />
            Cadastro de Administrador
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do novo administrador. A senha padrão será 123456.
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular *</FormLabel>
                    <FormControl>
                      <PhoneInput value={field.value} onChange={field.onChange} type="mobile" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="font-semibold">Defina a permissão do usuário</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border-2 border-videira-blue/30 p-3 hover:border-videira-blue transition-all">
                        <FormControl>
                          <RadioGroupItem value="admin" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex-1">
                          <span className="font-semibold">Administrador</span>
                          <span className="block text-sm text-muted-foreground">
                            Não altera configurações nem cadastra usuários admin
                          </span>
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0 rounded-lg border-2 border-videira-purple/30 p-3 hover:border-videira-purple transition-all">
                        <FormControl>
                          <RadioGroupItem value="superadmin" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer flex-1">
                          <span className="font-semibold">Super Administrador</span>
                          <span className="block text-sm text-muted-foreground">
                            Permissão total no sistema
                          </span>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" className="bg-videira-blue hover:bg-videira-blue/90 text-white">
                Cadastrar Administrador
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default function AdministradoresPage() {
  const [admins, setAdmins] = React.useState<Admin[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = viewMode === 'table' ? 20 : 12

  const { toast } = useToast()

  const fetchAdmins = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/administradores')
      if (!response.ok) throw new Error('Falha ao carregar os administradores')
      const data = await response.json()
      setAdmins(data.admins)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os administradores.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  const handleDelete = async (adminId: string, reason: string) => {
    try {
      const response = await fetch(`/api/v1/administradores/${adminId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletionReason: reason }),
      })
      if (!response.ok) throw new Error('Falha ao excluir o administrador')
      toast({
        title: 'Sucesso!',
        description: 'Administrador excluído com sucesso.',
        variant: 'success',
      })
      fetchAdmins()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const filteredAdmins = admins.filter(
    (admin) =>
      `${admin.firstName} ${admin.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage)
  const paginatedAdmins = filteredAdmins.slice(
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
          Lista de Administradores
        </CardTitle>
        <CardDescription>{filteredAdmins.length} administradores encontrados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-videira-cyan/5 via-videira-blue/5 to-videira-purple/5">
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Email</TableHead>
                <TableHead className="hidden md:table-cell font-semibold">Permissão</TableHead>
                <TableHead className="hidden sm:table-cell font-semibold">Status</TableHead>
                <TableHead className="hidden lg:table-cell font-semibold">Ações</TableHead>
                <TableHead className="text-right font-semibold">Menu</TableHead>
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
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedAdmins.length > 0 ? (
                paginatedAdmins.map((admin) => (
                  <TableRow key={admin.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={admin.avatarUrl || 'https://placehold.co/32x32.png'} />
                          <AvatarFallback>
                            {admin.firstName?.[0]}
                            {admin.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        {`${admin.firstName} ${admin.lastName}`}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {admin.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant="outline"
                        className={cn(
                          'font-semibold',
                          admin.role === 'superadmin' &&
                            'border-videira-purple text-videira-purple',
                        )}
                      >
                        {admin.role === 'admin' ? 'Administrador' : 'Super Admin'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={admin.status === 'active' ? 'success' : 'destructive'}>
                        {admin.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex gap-2">
                        <SendMessageDialog
                          recipientName={`${admin.firstName} ${admin.lastName}`}
                          recipientEmail={admin.email}
                          recipientPhone={admin.phone || ''}
                        >
                          <Button
                            size="sm"
                            className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Button>
                        </SendMessageDialog>
                        <SendMessageDialog
                          recipientName={`${admin.firstName} ${admin.lastName}`}
                          recipientEmail={admin.email}
                          recipientPhone={admin.phone || ''}
                          defaultTab="whatsapp"
                        >
                          <Button
                            size="sm"
                            className="bg-white dark:bg-background border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                          >
                            <Smartphone className="h-4 w-4 mr-1" />
                            WhatsApp
                          </Button>
                        </SendMessageDialog>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/administradores/${admin.id}`}>
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
                            <DeleteAdminDialog
                              adminName={`${admin.firstName} ${admin.lastName}`}
                              onConfirm={(reason) => admin.id && handleDelete(admin.id, reason)}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32">
                    <div className="flex flex-col items-center gap-3 py-8">
                      <ShieldCheck className="h-12 w-12 text-muted-foreground" />
                      <p className="text-lg font-medium text-muted-foreground">
                        Nenhum administrador encontrado
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
        ) : paginatedAdmins.length > 0 ? (
          paginatedAdmins.map((admin, index) => (
            <Card
              key={admin.id}
              className={cn(
                'shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-t-4',
                index % 3 === 0 && 'border-t-videira-cyan',
                index % 3 === 1 && 'border-t-videira-blue',
                index % 3 === 2 && 'border-t-videira-purple',
              )}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                  <Avatar className="w-24 h-24 ring-2 ring-offset-2 ring-offset-background ring-muted">
                    <AvatarImage src={admin.avatarUrl || 'https://placehold.co/96x96.png'} />
                    <AvatarFallback className="text-lg">
                      {admin.firstName?.[0]}
                      {admin.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2 min-w-[200px]">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold">
                        {admin.firstName} {admin.lastName}
                      </h3>
                      <Badge variant={admin.status === 'active' ? 'success' : 'destructive'}>
                        {admin.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        <Shield
                          size={14}
                          className={admin.role === 'superadmin' ? 'text-videira-purple' : ''}
                        />
                        <span
                          className={
                            admin.role === 'superadmin' ? 'text-videira-purple font-semibold' : ''
                          }
                        >
                          {admin.role === 'admin' ? 'Administrador' : 'Super Administrador'}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FileText size={14} /> <span>{admin.cpf}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone size={14} /> <span>{admin.phone}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Mail size={14} /> <span className="truncate">{admin.email}</span>
                      </p>
                      {admin.city && admin.state && (
                        <p className="flex items-center gap-2">
                          <MapPin size={14} />
                          <span>
                            {admin.city} - {admin.state}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <SendMessageDialog
                      recipientName={`${admin.firstName} ${admin.lastName}`}
                      recipientEmail={admin.email}
                      recipientPhone={admin.phone || ''}
                    >
                      <Button
                        size="sm"
                        className="bg-white dark:bg-background border-2 border-videira-cyan text-videira-cyan hover:bg-videira-cyan hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    </SendMessageDialog>
                    <SendMessageDialog
                      recipientName={`${admin.firstName} ${admin.lastName}`}
                      recipientEmail={admin.email}
                      recipientPhone={admin.phone || ''}
                      defaultTab="whatsapp"
                    >
                      <Button
                        size="sm"
                        className="bg-white dark:bg-background border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm hover:shadow-md font-semibold"
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </SendMessageDialog>
                  </div>
                  <Link href={`/admin/administradores/${admin.id}`}>
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
            <ShieldCheck className="h-16 w-16 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum administrador encontrado
            </p>
          </div>
        )}
      </div>
      <PaginationControls />
    </>
  )

  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
        {Math.min(currentPage * itemsPerPage, filteredAdmins.length)} de {filteredAdmins.length}{' '}
        resultados
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
                <ShieldCheck className="h-8 w-8" />
                Administradores
              </h1>
              <p className="text-base text-white/90 mt-2 font-medium">
                Gerencie os administradores do sistema
              </p>
              <p className="text-sm text-white/70 mt-1">
                {admins.length}{' '}
                {admins.length === 1 ? 'administrador cadastrado' : 'administradores cadastrados'}
              </p>
            </div>
            <AdminFormModal onSave={fetchAdmins}>
              <Button className="bg-white text-videira-blue hover:bg-white/90 shadow-lg font-semibold gap-2">
                <PlusCircle className="h-5 w-5" />
                <span>Novo Administrador</span>
              </Button>
            </AdminFormModal>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-lg border-t-4 border-t-videira-cyan hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Total de Administradores
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-cyan/15 ring-2 ring-videira-cyan/30">
              <Users className="h-5 w-5 text-videira-cyan" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-cyan">{admins.length}</div>
            <p className="text-sm text-muted-foreground mt-1">Cadastrados</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-videira-blue hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Administradores Ativos
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-blue/15 ring-2 ring-videira-blue/30">
              <ShieldCheck className="h-5 w-5 text-videira-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-blue">
              {admins.filter((a) => a.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">No sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-videira-purple hover:shadow-xl transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Super Administradores
            </CardTitle>
            <div className="p-2 rounded-lg bg-videira-purple/15 ring-2 ring-videira-purple/30">
              <Shield className="h-5 w-5 text-videira-purple" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-videira-purple">
              {admins.filter((a) => a.role === 'superadmin').length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Com permissão total</p>
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
              onClick={fetchAdmins}
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
