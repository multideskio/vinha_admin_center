
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const s3SettingsSchema = z.object({
  endpoint: z.string().min(1, 'Endpoint é obrigatório.'),
  bucket: z.string().min(1, 'Nome do bucket é obrigatório.'),
  region: z.string().min(1, 'Região é obrigatória.'),
  accessKeyId: z.string().min(1, 'Access Key ID é obrigatório.'),
  secretAccessKey: z.string().min(1, 'Secret Access Key é obrigatório.'),
  forcePathStyle: z.boolean().default(false),
});

type S3SettingsValues = z.infer<typeof s3SettingsSchema>;

export default function S3SettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isTesting, setIsTesting] = React.useState(false);

    const form = useForm<S3SettingsValues>({
        resolver: zodResolver(s3SettingsSchema),
        defaultValues: {
            endpoint: '',
            bucket: '',
            region: '',
            accessKeyId: '',
            secretAccessKey: '',
            forcePathStyle: false,
        },
    });

    React.useEffect(() => {
        const fetchConfig = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/v1/settings/s3');
                if (!response.ok) throw new Error('Falha ao carregar configurações S3.');
                const data = await response.json();
                if (data.config) {
                    form.reset({
                        endpoint: data.config.endpoint || '',
                        bucket: data.config.bucket || '',
                        region: data.config.region || '',
                        accessKeyId: data.config.accessKeyId || '',
                        secretAccessKey: data.config.secretAccessKey || '',
                        forcePathStyle: data.config.forcePathStyle || false,
                    });
                }
            } catch (error: any) {
                toast({ title: 'Erro', description: error.message, variant: 'destructive'});
            } finally {
                setIsLoading(false);
            }
        };
        fetchConfig();
    }, [form, toast]);

    const handleTestConnection = async () => {
        setIsTesting(true);
        try {
            const currentConfig = form.getValues();
            const response = await fetch('/api/v1/settings/s3/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentConfig),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Falha ao testar conexão S3.');
            toast({ title: 'Sucesso!', description: 'Conexão com o S3 estabelecida com sucesso.', variant: 'success' });
        } catch (error: any) {
            toast({ title: 'Erro na Conexão', description: error.message, variant: 'destructive' });
        } finally {
            setIsTesting(false);
        }
    };

    const onSubmit = async (data: S3SettingsValues) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/v1/settings/s3', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Falha ao salvar configurações S3.');
            toast({ title: "Sucesso!", description: "Configurações de S3 salvas com sucesso.", variant: "success" });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full md:col-span-2" />
                    </div>
                    <Skeleton className="h-6 w-1/3" />
                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuração de Armazenamento (S3)</CardTitle>
                            <CardDescription>
                                Configure o provedor de armazenamento de objetos (ex: AWS S3, MinIO) para salvar arquivos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField control={form.control} name="endpoint" render={({field}) => (
                                    <FormItem><FormLabel>Endpoint</FormLabel><FormControl><Input placeholder='s3.amazonaws.com' {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="bucket" render={({field}) => (
                                    <FormItem><FormLabel>Nome do Bucket</FormLabel><FormControl><Input placeholder='seu-bucket-aqui' {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="region" render={({field}) => (
                                    <FormItem><FormLabel>Região</FormLabel><FormControl><Input placeholder='us-east-1' {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="accessKeyId" render={({field}) => (
                                    <FormItem><FormLabel>Access Key ID</FormLabel><FormControl><Input type='password' placeholder='Sua Access Key' {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="secretAccessKey" render={({field}) => (
                                    <FormItem className='md:col-span-2'><FormLabel>Secret Access Key</FormLabel><FormControl><Input type='password' placeholder='Sua Secret Access Key' {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="forcePathStyle" render={({field}) => (
                                <FormItem className="flex items-center space-x-2 pt-2">
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                    <Label htmlFor="force-path-style">
                                        Forçar estilo de caminho (Use para MinIO)
                                    </Label>
                                </FormItem>
                            )} />
                            <Separator />
                            <div className='flex justify-end gap-2'>
                                <Button type="button" variant="outline" onClick={handleTestConnection} disabled={isTesting}>
                                    {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Testar Conexão
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Configurações
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </Form>
    );
}
