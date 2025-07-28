
'use client';

import * as React from 'react';
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
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

const adminSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  cep: z.string().min(9, { message: 'O CEP deve ter 8 dígitos.' }),
  state: z.string().length(2, { message: 'UF deve ter 2 letras.' }),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  neighborhood: z.string().min(1, { message: 'O bairro é obrigatório.' }),
  address: z.string().min(1, { message: 'O endereço é obrigatório.' }),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
  role: z.enum(['admin', 'superadmin'], {
    required_error: 'Selecione uma permissão.',
  }),
  status: z.enum(['active', 'inactive']),
});

type Admin = z.infer<typeof adminSchema>;

const initialAdmins: Admin[] = [
  {
    id: 'adm-01',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    phone: '(11) 99999-1111',
    status: 'active',
    cpf: '111.111.111-11',
    cep: '01001-000',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Centro',
    address: 'Av. Ipiranga, 200',
    role: 'superadmin',
    password: 'password123',
  },
  {
    id: 'adm-02',
    firstName: 'Limited',
    lastName: 'Admin',
    email: 'limited.admin@example.com',
    phone: '(21) 98888-2222',
    status: 'active',
    cpf: '222.222.222-22',
    cep: '20040-001',
    state: 'RJ',
    city: 'Rio de Janeiro',
    neighborhood: 'Centro',
    address: 'Av. Rio Branco, 156',
    role: 'admin',
    password: 'password123',
  },
];

const AdminFormModal = ({
  onSave,
  children,
}: {
  onSave: (data: Admin) => void;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isFetchingCep, setIsFetchingCep] = React.useState(false);

  const form = useForm<Admin>({
    resolver: zodResolver(adminSchema),
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
      phone: '',
      password: '',
      role: 'admin',
      status: 'active',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const handleSave = (data: Admin) => {
    onSave(data);
    setIsOpen(false);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        form.setValue('address', data.logradouro);
        form.setValue('neighborhood', data.bairro);
        form.setValue('city', data.localidade);
        form.setValue('state', data.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsFetchingCep(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cadastro de administrador</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 p-1 overflow-y-auto max-h-[80vh]">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                        <Input placeholder="O restante do endereço" {...field} disabled={isFetchingCep} />
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
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                          🇧🇷 +55
                        </span>
                        <Input
                          placeholder="(00) 00000-0000"
                          {...field}
                          className="rounded-l-none"
                          onChange={(e) => field.onChange(formatPhone(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="123456" {...field} />
                    </FormControl>
                     <FormMessage />
                     <p className="text-xs text-muted-foreground">A senha poderá ser alterada posteriormente.</p>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Defina a permissão do usuário</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="admin" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Administrador <span className="text-muted-foreground">(Não altera configurações nem cadastra usuários admin)</span>
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="superadmin" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Super administrador <span className="text-muted-foreground">(Permissão total)</span>
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
                <Button variant="outline">Fechar</Button>
              </DialogClose>
              <Button type="submit" disabled={isFetchingCep}>
                {isFetchingCep ? 'Buscando CEP...' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function AdministradoresPage() {
  const [admins, setAdmins] = React.useState<Admin[]>(initialAdmins);
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table');

  const handleSave = (data: Admin) => {
    const newAdmin: Admin = {
      ...data,
      id: `adm-${Date.now()}`,
      status: 'active',
    };
    setAdmins([...admins, newAdmin]);
  };

  const handleDelete = (adminId: string) => {
    setAdmins(admins.filter((a) => a.id !== adminId));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Administradores
          </h1>
          <p className="text-sm text-muted-foreground">
            Exibindo {admins.length} de {admins.length} resultados
          </p>
        </div>
        <div className="flex items-center gap-2">
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

          <AdminFormModal onSave={handleSave}>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Novo Administrador
              </span>
            </Button>
          </AdminFormModal>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Permissão</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{`${admin.firstName} ${admin.lastName}`}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {admin.email}
                    </TableCell>
                     <TableCell className="hidden md:table-cell text-muted-foreground">
                      <Badge variant="outline">{admin.role === 'admin' ? 'Administrador' : 'Super Administrador'}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={
                          admin.status === 'active' ? 'default' : 'secondary'
                        }
                        className={
                          admin.status === 'active'
                            ? 'bg-green-500/20 text-green-700 border-green-400'
                            : 'bg-red-500/20 text-red-700 border-red-400'
                        }
                      >
                        {admin.status === 'active' ? 'Ativo' : 'Inativo'}
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
                            <Link href={`/admin/administradores/${admin.id}`}>Editar</Link>
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-red-600">
                                Excluir
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Você tem certeza?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso excluirá
                                  permanentemente o administrador.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(admin.id!)}
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {admins.map((admin, index) => (
            <Card key={admin.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                  <Image
                    src="https://placehold.co/96x96.png"
                    alt={`Foto de ${admin.firstName}`}
                    width={96}
                    height={96}
                    className="rounded-lg object-cover w-24 h-24"
                    data-ai-hint="person shield"
                  />
                  <div className="flex-1 space-y-2 min-w-[200px]">
                    <h3 className="text-lg font-bold">
                      #{index + 1} - {admin.firstName} {admin.lastName}
                    </h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <p className='flex items-center gap-2'><Shield size={14} /> <span>{admin.role === 'admin' ? 'Administrador' : 'Super Administrador'}</span></p>
                        <p className='flex items-center gap-2'><FileText size={14} /> <span>{admin.cpf}</span></p>
                        <p className='flex items-center gap-2'><Phone size={14} /> <span>{admin.phone}</span></p>
                        <p className='flex items-center gap-2'><Mail size={14} /> <span>{admin.email}</span></p>
                        <p className='flex items-center gap-2'><MapPin size={14} /> <span>{admin.city} - {admin.state}</span></p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/administradores/${admin.id}`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
