
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
import { Upload, Loader2 } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const generalSettingsSchema = z.object({
  name: z.string().min(1, 'O nome da aplicação é obrigatório.'),
  supportEmail: z.string().email('E-mail de suporte inválido.'),
  logoUrl: z.string().optional().nullable(),
  maintenanceMode: z.boolean().default(false),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;


export default function GeneralSettingsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    const form = useForm<GeneralSettingsValues>({
        resolver: zodResolver(generalSettingsSchema),
        defaultValues: {
            name: '',
            supportEmail: '',
            logoUrl: '',
            maintenanceMode: false,
        },
    });

    const fetchSettings = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/company');
            if (!response.ok) throw new Error('Falha ao carregar configurações.');
            const data = await response.json();
            form.reset(data.company);
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [form, toast]);

    React.useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const onSubmit = async (data: GeneralSettingsValues) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/v1/company', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Falha ao salvar configurações.');
            toast({
                title: "Sucesso!",
                description: "Configurações gerais salvas com sucesso.",
                variant: "success",
            });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    }

    if(isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className='h-8 w-48' />
                    <Skeleton className='h-4 w-64' />
                </CardHeader>
                <CardContent className="space-y-8">
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-32 w-full' />
                    <Skeleton className='h-8 w-32' />
                </CardContent>
            </Card>
        )
    }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
          <CardDescription>
            Ajustes gerais da plataforma.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-8">
                    <FormField control={form.control} name="name" render={({field}) => (
                        <FormItem>
                            <FormLabel>Nome da Aplicação</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="supportEmail" render={({field}) => (
                        <FormItem>
                            <FormLabel>E-mail de Suporte</FormLabel>
                            <FormControl><Input type="email" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <div className="space-y-2">
                        <Label>Logo da Aplicação</Label>
                        <div className="flex items-center justify-center w-full">
                            <Label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground">
                                        <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                                    </p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG ou SVG (max. 800x400px)</p>
                                </div>
                                <Input id="logo-upload" type="file" className="hidden" />
                            </Label>
                        </div>
                    </div>
                     <FormField control={form.control} name="maintenanceMode" render={({field}) => (
                         <FormItem className="flex items-center space-x-2 pt-4">
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel>Ativar modo de manutenção</FormLabel>
                        </FormItem>
                    )} />
                </CardContent>
                <CardContent>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </CardContent>
            </form>
        </Form>
      </Card>
    </div>
  );
}
