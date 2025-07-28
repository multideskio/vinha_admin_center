
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CreditCard, QrCode, Church, DollarSign } from 'lucide-react';
import Image from 'next/image';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';


const contributionSchema = z.object({
  churchId: z.string({ required_error: 'Selecione uma igreja.' }),
  amount: z.coerce.number().min(1, 'O valor deve ser maior que zero.'),
  paymentMethod: z.enum(['pix', 'credit_card', 'boleto'], {
    required_error: 'Selecione um método de pagamento.',
  }),
  cardName: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

const churchesData = [
    { id: 'chu-01', name: 'Assembleia de Deus Madureira' },
    { id: 'chu-02', name: 'Comunidade da Graça' },
    { id: 'chu-03', name: 'Videira' },
    { id: 'chu-04', name: 'Fonte da Vida' },
];

export default function ContribuicoesPage() {
  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
        paymentMethod: 'pix',
        amount: 0,
    },
  });

  const paymentMethod = useWatch({
    control: form.control,
    name: 'paymentMethod',
  });

  function onSubmit(data: ContributionFormValues) {
    console.log(data);
    // Submit logic
  }

  return (
    <div className="flex flex-col gap-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nova Contribuição
        </h1>
        <p className="text-sm text-muted-foreground">
            Realize uma nova doação para uma das igrejas da sua rede.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
                    <FormField
                    control={form.control}
                    name="churchId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Igreja</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <Church className="mr-2 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Selecione a igreja" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {churchesData.map((church) => (
                                <SelectItem key={church.id} value={church.id}>
                                {church.name}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Valor da Contribuição</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input type="number" placeholder="0,00" className="pl-9" {...field} />
                                    </div>
                                </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="space-y-4">
                    <Label>Método de Pagamento</Label>
                     <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                               <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                                    >
                                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground", field.value === 'pix' && "border-primary")}>
                                            <RadioGroupItem value="pix" className="sr-only" />
                                            <QrCode className="mb-3 h-6 w-6" />
                                            Pix
                                        </Label>
                                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground", field.value === 'credit_card' && "border-primary")}>
                                            <RadioGroupItem value="credit_card" className="sr-only" />
                                            <CreditCard className="mb-3 h-6 w-6" />
                                            Crédito
                                        </Label>
                                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground", field.value === 'boleto' && "border-primary")}>
                                            <RadioGroupItem value="boleto" className="sr-only" />
                                            <Banknote className="mb-3 h-6 w-6" />
                                            Boleto
                                        </Label>
                                    </RadioGroup>
                               </FormControl>
                               <FormMessage className="pt-2" />
                            </FormItem>
                        )}
                        />
                </div>
              </div>

              {paymentMethod === 'credit_card' && (
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle>Dados do Cartão</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="cardName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nome no Cartão</FormLabel>
                                <FormControl>
                                    <Input placeholder="Como está escrito no cartão" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Número do Cartão</FormLabel>
                                <FormControl>
                                    <Input placeholder="0000 0000 0000 0000" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="cardExpiry"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Validade</FormLabel>
                                    <FormControl>
                                        <Input placeholder="MM/AA" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cardCvc"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>CVC</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
              )}
              {paymentMethod === 'pix' && (
                  <Card className="bg-muted/30 flex flex-col items-center p-6">
                      <CardHeader className="items-center">
                          <CardTitle>Pague com Pix</CardTitle>
                          <CardDescription>Aponte a câmera do seu celular para o QR Code</CardDescription>
                      </CardHeader>
                      <CardContent>
                            <Image src="https://placehold.co/256x256.png" width={256} height={256} alt="QR Code Pix" data-ai-hint="qr code" />
                            <Input value="copia-e-cola-chave-pix-aqui-12345" readOnly className="mt-4 text-center" />
                            <Button variant="outline" className="w-full mt-2">Copiar Chave</Button>
                      </CardContent>
                  </Card>
              )}
               {paymentMethod === 'boleto' && (
                  <Card className="bg-muted/30 flex flex-col items-center p-6">
                      <CardHeader className="items-center text-center">
                          <CardTitle>Boleto Gerado</CardTitle>
                          <CardDescription>Clique no botão abaixo para baixar ou copiar o código de barras.</CardDescription>
                      </CardHeader>
                      <CardContent className="w-full">
                            <Input value="00190500954014481606906809350314337370000000123" readOnly className="mt-4 text-center" />
                            <div className='flex gap-2 mt-2'>
                                <Button variant="secondary" className="w-full mt-2">Copiar Código</Button>
                                <Button className="w-full mt-2">Baixar Boleto</Button>
                            </div>
                      </CardContent>
                  </Card>
              )}

                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={paymentMethod === 'pix' || paymentMethod === 'boleto'}>
                        {paymentMethod === 'credit_card' ? 'Pagar com Cartão' : 'Confirmar Contribuição'}
                    </Button>
                </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

