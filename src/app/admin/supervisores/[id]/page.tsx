
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Camera,
  Facebook,
  Instagram,
  Globe,
  AlertTriangle,
  Info,
  Lock,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const supervisorProfileSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  phone: z.string().nullable(),
  landline: z.string().nullable(),
  email: z.string().email('E-mail inválido.'),
  cep: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  neighborhood: z.string().nullable(),
  address: z.string().nullable(),
  number: z.string().nullable(),
  complement: z.string().nullable(),
  titheDay: z.coerce.number().nullable(),
  newPassword: z.string().optional().or(z.literal('')),
  facebook: z.string().url().or(z.literal('')).nullable(),
  instagram: z.string().url().or(z.literal('')).nullable(),
  website: z.string().url().or(z.literal('')).nullable(),
  managerId: z.string().nullable(),
  regionId: z.string().nullable(),
}).partial();

type SupervisorProfile = z.infer<typeof supervisorProfileSchema> & {
    id: string;
    cpf?: string;
    status: string;
    avatarUrl?: string;
};

type Manager = {
    id: string;
    firstName: string;
    lastName: string;
}

type Region = {
    id: string;
    name: string;
}

export default function SupervisorProfilePage() {
  const [supervisor, setSupervisor] = React.useState<SupervisorProfile | null>(null);
  const [managers, setManagers] = React.useState<Manager[]>([]);
  const [regions, setRegions] = React.useState<Region[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { toast } = useToast();

  const form = useForm<SupervisorProfile>({
    resolver: zodResolver(supervisorProfileSchema),
    defaultValues: {
        firstName: '',
        lastName: '',
        phone: '',
        landline: '',
        email: '',
        cep: '',
        state: '',
        city: '',
        neighborhood: '',
        address: '',
        number: '',
        complement: '',
        titheDay: 1,
        newPassword: '',
        facebook: '',
        instagram: '',
        website: '',
        managerId: '',
        regionId: '',
    },
  });

  const fetchData = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
        const [supervisorRes, managersRes, regionsRes] = await Promise.all([
            fetch(`/api/v1/supervisores/${id}`),
            fetch('/api/v1/gerentes?minimal=true'),
            fetch('/api/v1/regioes?minimal=true'),
        ]);

        if (!supervisorRes.ok) throw new Error('Falha ao carregar dados do supervisor.');
        if (!managersRes.ok) throw new Error('Falha ao carregar gerentes.');
        if (!regionsRes.ok) throw new Error('Falha ao carregar regiões.');

        const supervisorData = await supervisorRes.json();
        const managersData = await managersRes.json();
        const regionsData = await regionsRes.json();
        
        const sanitizedData = {
            ...supervisorData,
            firstName: supervisorData.firstName ?? '',
            lastName: supervisorData.lastName ?? '',
            phone: supervisorData.phone ?? '',
            landline: supervisorData.landline ?? '',
            email: supervisorData.email ?? '',
            cep: supervisorData.cep ?? '',
            state: supervisorData.state ?? '',
            city: supervisorData.city ?? '',
            neighborhood: supervisorData.neighborhood ?? '',
            address: supervisorData.address ?? '',
            number: supervisorData.number ?? '',
            complement: supervisorData.complement ?? '',
            titheDay: supervisorData.titheDay ?? 1,
            newPassword: '',
            facebook: supervisorData.facebook ?? '',
            instagram: supervisorData.instagram ?? '',
            website: supervisorData.website ?? '',
            managerId: supervisorData.managerId ?? '',
            regionId: supervisorData.regionId ?? '',
        };

        setSupervisor(sanitizedData);
        setManagers(managersData.managers);
        setRegions(regionsData.regions);
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

  const onSubmit = async (data: Partial<SupervisorProfile>) => {
    setIsSaving(true);
    try {
        const response = await fetch(`/api/v1/supervisores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Falha ao atualizar o supervisor.');
        toast({ title: 'Sucesso', description: 'Supervisor atualizado com sucesso.', variant: 'success' });
    } catch (error: any) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive'});
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
        const response = await fetch(`/api/v1/supervisores/${id}`, { method: 'DELETE' });
        if(!response.ok) throw new Error('Falha ao excluir o supervisor.');
        toast({ title: "Sucesso!", description: 'Supervisor excluído com sucesso.', variant: 'success' });
        router.push('/admin/supervisores');
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
            toast({
                title: 'Preview da Imagem',
                description: 'A nova imagem está sendo exibida. O upload ainda não foi implementado no backend.',
            });
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

  if (!supervisor) {
      return <p>Supervisor não encontrado.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column: Profile Card */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewImage || supervisor.avatarUrl || "https://placehold.co/96x96.png"} alt={supervisor.firstName ?? ''} data-ai-hint="male person" />
                <AvatarFallback>{supervisor.firstName?.[0]}{supervisor.lastName?.[0]}</AvatarFallback>
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
              {supervisor.firstName} {supervisor.lastName}
            </h2>
            <p className="text-muted-foreground">Supervisor</p>
          </CardContent>
          <Separator />
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold">Redes sociais</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Facebook className="h-5 w-5 text-muted-foreground" />
                <Input
                  defaultValue={supervisor.facebook ?? ''}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Instagram className="h-5 w-5 text-muted-foreground" />
                <Input
                  defaultValue={supervisor.instagram ?? ''}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Input
                  defaultValue={supervisor.website ?? ''}
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
            <TabsTrigger value="profile">Dados do perfil</TabsTrigger>
            <TabsTrigger value="transactions">Transações do usuário</TabsTrigger>
            <TabsTrigger value="delete">Excluir cadastro</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Card>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="managerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gerente</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um gerente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {managers.map(manager => (
                                    <SelectItem key={manager.id} value={manager.id}>{manager.firstName} {manager.lastName}</SelectItem>
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
                            <FormLabel>Região</FormLabel>
                             <Select onValueChange={field.onChange} value={field.value ?? ''}>
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
                    </div>
                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''}/>
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
                              <Input {...field} value={field.value ?? ''}/>
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
                              <Input {...field} disabled value={supervisor.cpf ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Celular</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''}/>
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
                            <FormLabel>Telefone 2</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value ?? ''}/>
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

                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField control={form.control} name="neighborhood" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bairro</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rua</FormLabel>
                                <FormControl><Input placeholder='Complemento...' {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="number" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número</FormLabel>
                                <FormControl><Input placeholder='Número da casa...' {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                    </div>
                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                       
                        <FormField control={form.control} name="complement" render={({ field }) => (
                            <FormItem className='sm:col-span-2'>
                                <FormLabel>Complemento</FormLabel>
                                <FormControl><Input {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="titheDay" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dia do dízimo</FormLabel>
                                <FormControl><Input type="number" {...field} value={field.value ?? ''}/></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription>
                        <strong>Importante</strong> - Ao atualizar a senha, o usuário não poderá acessar usando a senha anterior.
                      </AlertDescription>
                    </Alert>
                    
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Atualize a senha do supervisor</Label>
                           <FormControl>
                            <div className="relative mt-1">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input type="password" placeholder="Nova Senha" className="pl-9" {...field} />
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
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transações do Usuário</CardTitle>
                <CardDescription>
                  Histórico de transações financeiras do usuário.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>O histórico de transações aparecerá aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="delete">
          <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Excluir Cadastro</CardTitle>
                <CardDescription>
                  Esta ação é irreversível. Tenha certeza de que deseja excluir permanentemente este cadastro.
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
