
'use client';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


const managerProfileSchema = z.object({
  firstName: z.string().min(1, 'O nome é obrigatório.'),
  lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
  cpf: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  landline: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido.'),
  cep: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  titheDay: z.coerce.number().optional().nullable(),
  newPassword: z.string().optional().or(z.literal('')),
  facebook: z.string().url().or(z.literal('')).optional().nullable(),
  instagram: z.string().url().or(z.literal('')).optional().nullable(),
  website: z.string().url().or(z.literal('')).optional().nullable(),
});

type ManagerProfile = z.infer<typeof managerProfileSchema> & {
    id: string;
    status: string;
    avatarUrl?: string;
};

export default function GerenteProfilePage() {
    const [manager, setManager] = React.useState<ManagerProfile | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<ManagerProfile>({
        resolver: zodResolver(managerProfileSchema),
        defaultValues: {},
    });

    const fetchManager = React.useCallback(async () => {
      setIsLoading(true);
      try {
          const response = await fetch(`/api/v1/gerente/perfil`);
          if (!response.ok) throw new Error('Falha ao carregar dados do gerente');
          const data = await response.json();
          
          setManager(data.manager);
          form.reset(data.manager);
      } catch (error: any) {
          toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } finally {
          setIsLoading(false);
      }
    }, [form, toast]);

    React.useEffect(() => {
        fetchManager();
    }, [fetchManager]);

    const onSubmit = async (data: Partial<ManagerProfile>) => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/v1/gerente/perfil`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Falha ao atualizar o gerente.');
            toast({ title: 'Sucesso', description: 'Perfil atualizado com sucesso.', variant: 'success' });
            fetchManager();
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };
    
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

    if (!manager) {
        return <p>Gerente não encontrado.</p>;
    }


    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1">
            <Card>
            <CardContent className="flex flex-col items-center pt-6 text-center">
                <div className="relative">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={previewImage || manager.avatarUrl || "https://placehold.co/96x96.png"} alt={manager.firstName ?? ''} data-ai-hint="male person" />
                    <AvatarFallback>{manager.firstName?.[0]}{manager.lastName?.[0]}</AvatarFallback>
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
                {manager.firstName} {manager.lastName}
                </h2>
                <p className="text-muted-foreground">Gerente</p>
            </CardContent>
            <Separator />
            <CardContent className="pt-6">
                <h3 className="mb-4 font-semibold">Redes sociais</h3>
                <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <Facebook className="h-5 w-5 text-muted-foreground" />
                    <Input
                        defaultValue={manager.facebook ?? ''}
                        placeholder="https://facebook.com/..."
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Instagram className="h-5 w-5 text-muted-foreground" />
                    <Input
                        defaultValue={manager.instagram ?? ''}
                        placeholder="https://instagram.com/..."
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <Input
                        defaultValue={manager.website ?? ''}
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
            </TabsList>
            <TabsContent value="profile">
                <Card>
                <CardContent className="pt-6">
                    <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                <Input {...field} value={field.value ?? ''} />
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
                                <FormLabel>Sobre-nome</FormLabel>
                                <FormControl>
                                <Input {...field} value={field.value ?? ''} />
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
                                <Input {...field} disabled value={field.value ?? ''} />
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
                                <FormLabel>Celular/WhatsApp</FormLabel>
                                <FormControl>
                                    <div className="flex items-center">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm h-10">
                                        🇧🇷 +55
                                        </span>
                                        <Input {...field} value={field.value ?? ''} className="rounded-l-none"/>
                                    </div>
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
                                <FormLabel>Fixo</FormLabel>
                                <FormControl>
                                <Input {...field} value={field.value ?? ''} />
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
                                <Input type="email" {...field} value={field.value ?? ''} />
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
                                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="state" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado/UF</FormLabel>
                                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cidade</FormLabel>
                                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <FormField control={form.control} name="neighborhood" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bairro</FormLabel>
                                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Endereço</FormLabel>
                                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="titheDay" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dia do dízimo</FormLabel>
                                    <FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl>
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
                            <Label>Atualize a senha do gerente</Label>
                            <FormControl>
                                <div className="relative mt-1">
                                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input type="password" placeholder="Nova Senha" className="pl-9" {...field} value={field.value ?? ''}/>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                        <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            Alterar cadastro
                        </Button>
                        </div>
                    </form>
                    </Form>
                </CardContent>
                </Card>
            </TabsContent>
            </Tabs>
        </div>
        </div>
    );
}
