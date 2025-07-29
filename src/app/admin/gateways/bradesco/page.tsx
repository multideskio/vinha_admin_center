
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const bradescoGatewaySchema = z.object({
  isActive: z.boolean().default(false),
  environment: z.enum(['production', 'development']),
  prodClientId: z.string().optional().nullable(),
  prodClientSecret: z.string().optional().nullable(),
  devClientId: z.string().optional().nullable(),
  devClientSecret: z.string().optional().nullable(),
  certificatePassword: z.string().optional().nullable(),
});

type BradescoGatewayValues = z.infer<typeof bradescoGatewaySchema>;

export default function BradescoGatewayPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    const form = useForm<BradescoGatewayValues>({
        resolver: zodResolver(bradescoGatewaySchema),
        defaultValues: {
            isActive: false,
            environment: 'development',
            prodClientId: '',
            prodClientSecret: '',
            devClientId: '',
            devClientSecret: '',
            certificatePassword: '',
        },
    });

    const fetchConfig = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/gateways/bradesco');
            if (!response.ok) throw new Error('Falha ao carregar configurações.');
            const data = await response.json();
            form.reset({
                ...data.config,
                prodClientId: data.config.prodClientId ?? '',
                prodClientSecret: data.config.prodClientSecret ?? '',
                devClientId: data.config.devClientId ?? '',
                devClientSecret: data.config.devClientSecret ?? '',
                certificatePassword: data.config.certificatePassword ?? '',
            });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        } finally {
            setIsLoading(false);
        }
    }, [form, toast]);

    React.useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const onSubmit = async (data: BradescoGatewayValues) => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/v1/gateways/bradesco', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Falha ao salvar configurações.');
            toast({
                title: "Sucesso!",
                description: "Configurações do Bradesco salvas com sucesso.",
                variant: "success",
            });
        } catch (error: any) {
            toast({ title: 'Erro', description: error.message, variant: 'destructive'});
        } finally {
            setIsSaving(false);
        }
    };

    if(isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-10 w-1/2" />
                        <Separator />
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>BRADESCO</CardTitle>
                <CardDescription>
                    Configure as credenciais e opções para o gateway Bradesco.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                    Ativar Gateway
                                    </FormLabel>
                                    <FormDescription>
                                    Ative ou desative o processamento de pagamentos pelo Bradesco.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                        
                        <FormField
                            control={form.control}
                            name="environment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ambiente</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o ambiente" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="production">Produção</SelectItem>
                                            <SelectItem value="development">Desenvolvimento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Selecione o ambiente para as credenciais.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Separator />

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Credenciais de Produção</h3>
                            <FormField
                                control={form.control}
                                name="prodClientId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client ID</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Seu Client ID de produção" {...field} value={field.value ?? ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="prodClientSecret"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client Secret</FormLabel>
                                    <FormControl>
                                    <Input type="password" placeholder="Seu Client Secret de produção" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Credenciais de Desenvolvimento</h3>
                             <FormField
                                control={form.control}
                                name="devClientId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client ID</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Seu Client ID de desenvolvimento" {...field} value={field.value ?? ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="devClientSecret"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client Secret</FormLabel>
                                    <FormControl>
                                    <Input type="password" placeholder="Seu Client Secret de desenvolvimento" {...field} value={field.value ?? ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                         <Separator />
                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Certificado Digital</h3>
                            <FormItem>
                                <FormLabel>Arquivo do Certificado (.pfx, .pem)</FormLabel>
                                <FormControl>
                                    <div className="flex items-center justify-center w-full">
                                        <Label htmlFor="certificate-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/50">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground">
                                                    <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                                                </p>
                                                <p className="text-xs text-muted-foreground">Certificado (.pfx ou .pem)</p>
                                            </div>
                                            <Input id="certificate-upload" type="file" className="hidden" />
                                        </Label>
                                    </div> 
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            <FormField
                                control={form.control}
                                name="certificatePassword"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Senha do Certificado</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Senha do arquivo de certificado" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar Configurações
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
