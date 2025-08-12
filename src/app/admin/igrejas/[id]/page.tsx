
'use client'

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Camera,
  Facebook,
  Instagram,
  Globe,
  AlertTriangle,
  Lock,
  Calendar as CalendarIcon,
  Loader2,
  Mail,
  Smartphone,
  MoreHorizontal,
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Link from 'next/link';

const churchProfileSchema = z.object({
    supervisorId: z.string({ required_error: 'Selecione um supervisor.' }),
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
    newPassword: z.string().optional().or(z.literal('')),
    facebook: z.string().url().or(z.literal('')).nullable(),
    instagram: z.string().url().or(z.literal('')).nullable(),
    website: z.string().url().or(z.literal('')).nullable(),
}).partial();

type ChurchProfile = z.infer<typeof churchProfileSchema> & {
    id: string;
    cnpj?: string;
    status: string;
    avatarUrl?: string;
};

type Supervisor = {
    id: string;
    firstName: string;
    lastName: string;
}

type Transaction = {
    id: string;
    amount: number;
    status: 'approved' | 'pending' | 'refused' | 'refunded';
    date: string;
  };


export default function IgrejaProfilePage() {
  const [church, setChurch] = React.useState<ChurchProfile | null>(null);
  const [supervisors, setSupervisors] = React.useState<Supervisor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();

  const form = useForm<ChurchProfile>({
    resolver: zodResolver(churchProfileSchema),
    defaultValues: {
        razaoSocial: '',
        nomeFantasia: '',
        email: '',
        phone: '',
        cep: '',
        state: '',
        city: '',
        neighborhood: '',
        address: '',
        foundationDate: new Date(),
        titheDay: 1,
        supervisorId: '',
        treasurerFirstName: '',
        treasurerLastName: '',
        treasurerCpf: '',
        newPassword: '',
        facebook: '',
        instagram: '',
        website: '',
    },
  });

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
        const [churchRes, supervisorsRes] = await Promise.all([
            fetch(`/api/v1/igrejas/${id}`),
            fetch('/api/v1/supervisores?minimal=true'),
        ]);

        if (!churchRes.ok) throw new Error('Falha ao carregar dados da igreja.');
        if (!supervisorsRes.ok) throw new Error('Falha ao carregar supervisores.');

        const churchData = await churchRes.json();
        const supervisorsData = await supervisorsRes.json();
        
        const sanitizedData = {
            ...churchData,
            foundationDate: churchData.foundationDate ? new Date(churchData.foundationDate) : new Date(),
        };

        setChurch(sanitizedData);
        setSupervisors(supervisorsData.supervisors);
        form.reset(sanitizedData);
    } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  }, [id, form, toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onSubmit = async (data: Partial<ChurchProfile>) => {
    setIsSaving(true);
    try {
        const response = await fetch(`/api/v1/igrejas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Falha ao atualizar a igreja.');
        toast({ title: 'Sucesso', description: 'Igreja atualizada com sucesso.', variant: 'success' });
    } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive'});
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
        const response = await fetch(`/api/v1/igrejas/${id}`, { method: 'DELETE' });
        if(!response.ok) throw new Error('Falha ao excluir a igreja.');
        toast({ title: "Sucesso!", description: 'Igreja excluída com sucesso.', variant: 'success' });
        router.push('/admin/igrejas');
    } catch(error: any) {
        toast({ title: "Erro", description: error.message, variant: 'destructive'});
    }
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
};

  if (isLoading) {
      return (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                  <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
              </div>
              <div className="lg:col-span-2">
                  <Card><CardContent className="pt-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
              </div>
          </div>
      )
  }

  if (!church) {
      return <p>Igreja não encontrada.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column: Profile Card */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="flex flex-col items-center pt-6 text-center">
          <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewImage || church.avatarUrl || "https://placehold.co/96x96.png"} alt={church.nomeFantasia ?? ''} data-ai-hint="church building" />
                <AvatarFallback>{church.nomeFantasia?.[0]}</AvatarFallback>
              </Avatar>
              <Label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background border border-border hover:bg-muted">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="sr-only">Trocar foto</span>
              </Label>
              <Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </div>
            <h2 className="mt-4 text-xl font-semibold">
              {church.nomeFantasia}
            </h2>
            <p className="text-muted-foreground">Igreja</p>
          </CardContent>
          <Separator />
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold">Redes sociais</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Facebook className="h-5 w-5 text-muted-foreground" />
                <Input
                  defaultValue={church.facebook ?? ''}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Instagram className="h-5 w-5 text-muted-foreground" />
                <Input
                  defaultValue={church.instagram ?? ''}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Input
                  defaultValue={church.website ?? ''}
                  placeholder="https://website.com/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Tabs and Form */}
      <div className="lg:col-span-2">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Dados da Igreja</TabsTrigger>
            <TabsTrigger value="delete">Excluir cadastro</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="supervisorId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Selecione um supervisor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
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

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="cnpj"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>CNPJ</FormLabel>
                                <FormControl>
                                <Input {...field} disabled value={church.cnpj ?? ''}/>
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
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input type="email" {...field} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="razaoSocial"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Razão Social</FormLabel>
                                <FormControl>
                                <Input {...field} value={field.value ?? ''}/>
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
                                <FormLabel>Nome Fantasia</FormLabel>
                                <FormControl>
                                <Input {...field} value={field.value ?? ''}/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField control={form.control} name="cep" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CEP</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="state" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estado/UF</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="city" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                    </div>

                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField control={form.control} name="neighborhood" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bairro</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Endereço</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="foundationDate"
                            render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Data de Fundação</FormLabel>
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                        )}
                                    >
                                        {field.value ? (
                                        format(new Date(field.value), "dd/MM/yyyy")
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
                                    disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                    />
                                </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField control={form.control} name="titheDay" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dia do dízimo</FormLabel>
                                <FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl>
                            </FormItem>
                        )} />
                         <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Celular</FormLabel>
                                <FormControl>
                                <Input {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    
                    <Separator />
                    <h3 className="text-lg font-medium">Dados do Tesoureiro</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField control={form.control} name="treasurerFirstName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="treasurerLastName" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sobrenome</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="treasurerCpf" render={({ field }) => (
                             <FormItem>
                                <FormLabel>CPF</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                    </div>


                    <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription>
                        <strong>Importante</strong> - É necessário ter um usuário para a igreja poder acessar o sistema.
                      </AlertDescription>
                    </Alert>

                     <FormField
                      control={form.control}                      
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Crie ou atualize a senha da igreja</FormLabel>
                           <FormControl>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="password" placeholder="Nova senha" className="pl-9" {...field} /> 
                            </div>
                           </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Alterar cadastro
                        </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="delete">
          <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Excluir Cadastro</CardTitle>
                <CardDescription>
                  Esta ação é irreversível. Tenha certeza de que deseja excluir permanentemente esta igreja.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleDelete}>Excluir permanentemente</Button> 
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
