
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';


const cieloGatewaySchema = z.object({
  isActive: z.boolean().default(false),
  environment: z.enum(['production', 'development']),
  prodClientId: z.string().optional().nullable(),
  prodClientSecret: z.string().optional().nullable(),
  devClientId: z.string().optional().nullable(),
  devClientSecret: z.string().optional().nullable(),
  acceptedPaymentMethods: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Você deve selecionar pelo menos um meio de pagamento.",
  }),
});

type CieloGatewayValues = z.infer<typeof cieloGatewaySchema>;

const paymentMethods = [
    { id: "pix", label: "Pix" },
    { id: "credit_card", label: "Cartão de crédito" },
    { id: "boleto", label: "Boletos" },
]

export default function CieloGatewayPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);

    const form = useForm<CieloGatewayValues>({
        resolver: zodResolver(cieloGatewaySchema),
        defaultValues: {
            isActive: false,
            environment: 'development',
            acceptedPaymentMethods: [],
        },
    });

    const fetchConfig = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/gateways/cielo');
            if (!response.ok) throw new Error('Falha ao carregar configurações.');
            const data = await response.json();
            form.reset({
                ...data.config,
                acceptedPaymentMethods: data.config.acceptedPaymentMethods ? data.config.acceptedPaymentMethods.split(',') : [],
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

    const onSubmit = async (data: CieloGatewayValues) => {
        setIsSaving(true);
        try {
            const payload = {
                ...data,
                acceptedPaymentMethods: data.acceptedPaymentMethods.join(','),
            };
            const response = await fetch('/api/v1/gateways/cielo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Falha ao salvar configurações.');
            toast({
                title: "Sucesso!",
                description: "Configurações da Cielo salvas com sucesso.",
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
                    <Skeleton className="h-8 w-32" />
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
                <CardTitle>CIELO</CardTitle>
                <CardDescription>
                    Configure as credenciais e opções de pagamento para o gateway Cielo.
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
                                    Ative ou desative o processamento de pagamentos pela Cielo.
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
                                        Selecione o ambiente que deseja configurar.
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
                                    <FormLabel>MerchantId</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Seu MerchantId de produção" {...field} value={field.value ?? ''} />
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
                                    <FormLabel>MerchantKey</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Sua MerchantKey de produção" {...field} value={field.value ?? ''} />
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
                                    <FormLabel>MerchantId</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Seu MerchantId de desenvolvimento" {...field} value={field.value ?? ''} />
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
                                    <FormLabel>MerchantKey</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Sua MerchantKey de desenvolvimento" {...field} value={field.value ?? ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                         <Separator />

                        <FormField
                            control={form.control}
                            name="acceptedPaymentMethods"
                            render={() => (
                                <FormItem>
                                <div className="mb-4">
                                    <FormLabel className="text-base">Configuração do Checkout</FormLabel>
                                    <FormDescription>
                                        Selecione os meios de pagamento a serem ativados.
                                    </FormDescription>
                                </div>
                                {paymentMethods.map((item) => (
                                    <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="acceptedPaymentMethods"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={item.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item.id)}
                                                onCheckedChange={(checked) => {
                                                const currentValue = field.value || [];
                                                return checked
                                                    ? field.onChange([...currentValue, item.id])
                                                    : field.onChange(
                                                        currentValue?.filter(
                                                        (value) => value !== item.id
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                            {item.label}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        
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
