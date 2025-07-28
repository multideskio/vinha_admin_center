
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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

const cieloGatewaySchema = z.object({
  environment: z.enum(['production', 'development']),
  production_merchant_id: z.string().optional(),
  production_merchant_key: z.string().optional(),
  development_merchant_id: z.string().optional(),
  development_merchant_key: z.string().optional(),
  payment_methods: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Você deve selecionar pelo menos um meio de pagamento.",
  }),
});

type CieloGatewayValues = z.infer<typeof cieloGatewaySchema>;

const paymentMethods = [
    { id: "pix", label: "Pix" },
    { id: "credit_card", label: "Cartão de crédito" },
    { id: "boleto", label: "Boletos" },
]

// Mock initial data
const initialData: CieloGatewayValues = {
    environment: 'development',
    production_merchant_id: '',
    production_merchant_key: '',
    development_merchant_id: '12345678-1234-1234-1234-123456789012',
    development_merchant_key: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEF',
    payment_methods: ["pix", "credit_card"],
};

export default function CieloGatewayPage() {
    const { toast } = useToast();

    const form = useForm<CieloGatewayValues>({
        resolver: zodResolver(cieloGatewaySchema),
        defaultValues: initialData,
    });

    const onSubmit = (data: CieloGatewayValues) => {
        console.log(data);
        toast({
            title: "Sucesso!",
            description: "Configurações da Cielo salvas com sucesso.",
            variant: "success",
        });
    };

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
                                name="production_merchant_id"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>MerchantId</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Seu MerchantId de produção" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="production_merchant_key"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>MerchantKey</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Sua MerchantKey de produção" {...field} />
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
                                name="development_merchant_id"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>MerchantId</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Seu MerchantId de desenvolvimento" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="development_merchant_key"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>MerchantKey</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Sua MerchantKey de desenvolvimento" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>

                         <Separator />

                        <FormField
                            control={form.control}
                            name="payment_methods"
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
                                    name="payment_methods"
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
                                                return checked
                                                    ? field.onChange([...field.value, item.id])
                                                    : field.onChange(
                                                        field.value?.filter(
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
                            <Button type="submit">Salvar Configurações da Cielo</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
