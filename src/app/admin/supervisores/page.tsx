
'use client';

import * as React from 'react';
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
  User,
  Map,
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
  CardHeader,
  CardTitle,
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
  DialogFooter
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const supervisorSchema = z.object({
  id: z.string().optional(),
  managerId: z.string({ required_error: 'Selecione um gerente.' }),
  regionId: z.string({ required_error: 'Selecione uma região.' }),
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
  status: z.enum(['active', 'inactive']),
});

type Supervisor = z.infer<typeof supervisorSchema>;

const initialSupervisors: Supervisor[] = [
  {
    id: 'sup-01',
    firstName: 'Carlos',
    lastName: 'Andrade',
    email: 'carlos.andrade@example.com',
    phone: '(11) 98765-1111',
    status: 'active',
    cpf: '444.555.666-77',
    cep: '01001-000',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Centro',
    address: 'Av. Paulista, 2000',
    titheDay: 15,
    managerId: 'mgr-01',
    regionId: 'reg-02',
  },
  {
    id: 'sup-02',
    firstName: 'Ana',
    lastName: 'Beatriz',
    email: 'ana.beatriz@example.com',
    phone: '(21) 91234-2222',
    status: 'inactive',
    cpf: '555.666.777-88',
    cep: '20040-001',
    state: 'RJ',
    city: 'Rio de Janeiro',
    neighborhood: 'Copacabana',
    address: 'Av. Atlântica, 3000',
    titheDay: 10,
    managerId: 'mgr-02',
    regionId: 'reg-02',
  },
  {
    id: 'sup-03',
    firstName: 'Jabez',
    lastName: 'Henrique',
    email: 'jabez@multidesk.io',
    phone: '(62) 98115-4120',
    status: 'active',
    cpf: '037.628.391-23',
    cep: '75264-230',
    state: 'GO',
    city: 'Senador Canedo',
    neighborhood: 'Terrabela Cerrado I',
    address: 'Rua RP 15',
    titheDay: 8,
    managerId: 'mgr-03',
    regionId: 'reg-03',
  },
];

// Mock data, should come from API
const managers = [
    { id: 'mgr-01', name: 'João Silva' },
    { id: 'mgr-02', name: 'Maria Oliveira' },
    { id: 'mgr-03', name: 'Paulo Ferreira' },
];

const regions = [
    { id: 'reg-01', name: 'Sul' },
    { id: 'reg-02', name: 'Sudeste' },
    { id: 'reg-03', name: 'Centro-Oeste' },
    { id: 'reg-04', name: 'Norte' },
    { id: 'reg-05', name: 'Nordeste' },
];

const SupervisorFormModal = ({
  onSave,
  children,
}: {
  onSave: (data: Supervisor) => void;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isFetchingCep, setIsFetchingCep] = React.useState(false);

  const form = useForm<Supervisor>({
    resolver: zodResolver(supervisorSchema),
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
      status: 'active',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
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
        status: 'active',
      });
    }
  }, [isOpen, form]);

  const handleSave = (data: Supervisor) => {
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
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cadastro de supervisor</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6 p-2">
            <Alert
              variant="default"
              className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
            >
              <AlertTriangle className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                A senha padrão é <strong>123456</strong> até o usuário cadastrar
                uma nova senha.
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="managerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selecione um gerente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um gerente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {managers.map(manager => (
                            <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma região" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regions.map(region => (
                            <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
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
                      <Input
                        type="email"
                        placeholder="exemplo@gmail.com"
                        {...field}
                      />
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
                      <Input
                        placeholder="Nome da cidade"
                        {...field}
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
                      placeholder="O restante do endereço"
                      {...field}
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
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
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

export default function SupervisoresPage() {
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>(initialSupervisors);
  const [viewMode, setViewMode] = React.useState<'table' | 'card'>('table');

  const handleSave = (data: Supervisor) => {
    // Create new supervisor
    const newSupervisor: Supervisor = {
      ...data,
      id: `sup-${Date.now()}`,
      status: 'active',
    };
    setSupervisors([...supervisors, newSupervisor]);
  };

  const handleDelete = (supervisorId: string) => {
    setSupervisors(supervisors.filter((s) => s.id !== supervisorId));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Supervisores
          </h1>
          <p className="text-sm text-muted-foreground">
            Exibindo {supervisors.length} de {supervisors.length} resultados
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

          <SupervisorFormModal onSave={handleSave}>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Novo Supervisor
              </span>
            </Button>
          </SupervisorFormModal>
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
                  <TableHead className="hidden md:table-cell">Celular</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisors.map((supervisor) => (
                  <TableRow key={supervisor.id}>
                    <TableCell className="font-medium">{`${supervisor.firstName} ${supervisor.lastName}`}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {supervisor.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {supervisor.phone}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge
                        variant={
                          supervisor.status === 'active' ? 'default' : 'secondary'
                        }
                        className={
                          supervisor.status === 'active'
                            ? 'bg-green-500/20 text-green-700 border-green-400'
                            : 'bg-red-500/20 text-red-700 border-red-400'
                        }
                      >
                        {supervisor.status === 'active' ? 'Ativo' : 'Inativo'}
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
                            <Link href={`/admin/supervisores/${supervisor.id}`}>Editar</Link>
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
                                  permanentemente o supervisor.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(supervisor.id!)}
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
          {supervisors.map((supervisor, index) => {
            const manager = managers.find(m => m.id === supervisor.managerId);
            const region = regions.find(r => r.id === supervisor.regionId);
            return (
                <Card key={supervisor.id}>
                    <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                        <Image
                        src="https://placehold.co/96x96.png"
                        alt={`Foto de ${supervisor.firstName}`}
                        width={96}
                        height={96}
                        className="rounded-lg object-cover w-24 h-24"
                        data-ai-hint="male person"
                        />
                        <div className="flex-1 space-y-2 min-w-[200px]">
                        <h3 className="text-lg font-bold">
                            #{index + 1} - {supervisor.firstName} {supervisor.lastName}
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <p className='flex items-center gap-2'><User size={14} /> <span>Gerente: {manager?.name || 'N/A'}</span></p>
                            <p className='flex items-center gap-2'><Map size={14} /> <span>Região: {region?.name || 'N/A'}</span></p>
                            <p className='flex items-center gap-2'><FileText size={14} /> <span>{supervisor.cpf}</span></p>
                            <p className='flex items-center gap-2'><Phone size={14} /> <span>{supervisor.phone}</span></p>
                            <p className='flex items-center gap-2'><Mail size={14} /> <span>{supervisor.email}</span></p>
                            <p className='flex items-center gap-2'><MapPin size={14} /> <span>{supervisor.city} - {supervisor.state}</span></p>
                        </div>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/supervisores/${supervisor.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Link>
                        </Button>
                    </div>
                    </CardContent>
                </Card>
            )
            })}
        </div>
      )}
    </div>
  );
}
