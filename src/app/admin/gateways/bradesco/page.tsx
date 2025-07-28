
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';

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

const bradescoGatewaySchema = z.object({
  status: z.boolean().default(false),
  environment: z.enum(['production', 'development']),
  production_client_id: z.string().optional(),
  production_client_secret: z.string().optional(),
  development_client_id: z.string().optional(),
  development_client_secret: z.string().optional(),
  certificate_password: z.string().optional(),
});

type BradescoGatewayValues = z.infer<typeof bradescoGatewaySchema>;

// Mock initial data
const initialData: BradescoGatewayValues = {
    status: true,
    environment: 'development',
    production_client_id: '',
    production_client_secret: '',
    development_client_id: 'dev-client-id-12345',
    development_client_secret: 'dev-client-secret-67890',
    certificate_password: '',
};

export default function BradescoGatewayPage() {
    const { toast } = useToast();

    const form = useForm<BradescoGatewayValues>({
        resolver: zodResolver(bradescoGatewaySchema),
        defaultValues: initialData,
    });

    const onSubmit = (data: BradescoGatewayValues) => {
        console.log(data);
        toast({
            title: "Sucesso!",
            description: "Configurações do Bradesco salvas com sucesso.",
            variant: "success",
        });
    };

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
                            name="status"
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                name="production_client_id"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client ID</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Seu Client ID de produção" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="production_client_secret"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client Secret</FormLabel>
                                    <FormControl>
                                    <Input type="password" placeholder="Seu Client Secret de produção" {...field} />
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
                                name="development_client_id"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client ID</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Seu Client ID de desenvolvimento" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="development_client_secret"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client Secret</FormLabel>
                                    <FormControl>
                                    <Input type="password" placeholder="Seu Client Secret de desenvolvimento" {...field} />
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
                                name="certificate_password"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Senha do Certificado</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Senha do arquivo de certificado" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        
                        <div className="flex justify-end">
                            <Button type="submit">Salvar Configurações do Bradesco</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
