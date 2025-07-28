
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CreditCard, QrCode, DollarSign } from 'lucide-react';
import Image from 'next/image';
import Cards, { Focused } from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';


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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';


const contributionSchema = z.object({
  amount: z.coerce.number().min(1, 'O valor deve ser maior que zero.'),
  paymentMethod: z.enum(['pix', 'credit_card', 'boleto'], {
    required_error: 'Selecione um método de pagamento.',
  }),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

export default function ContribuicoesPage() {
  const [showPaymentDetails, setShowPaymentDetails] = React.useState(false);
  const [cardState, setCardState] = React.useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    focus: '' as Focused,
  });

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
  
  const amount = useWatch({
    control: form.control,
    name: 'amount',
  });

  // Reset payment details view when payment method or amount changes
  React.useEffect(() => {
    setShowPaymentDetails(false);
  }, [paymentMethod, amount]);


  const handleInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    let formattedValue = value;

    if (name === 'number') {
        formattedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (name === 'expiry') {
        formattedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (name === 'cvc') {
        formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardState((prev) => ({ ...prev, [name]: formattedValue }));
  }

  const handleInputFocus = (evt: React.FocusEvent<HTMLInputElement>) => {
    setCardState((prev) => ({ ...prev, focus: evt.target.name as Focused }));
  }

  function handleProceedToPayment(data: ContributionFormValues) {
    console.log("Proceeding to payment with:", data);
    setShowPaymentDetails(true);
  }

  function handleFinalizePayment() {
    // This is where you would handle the final submission to the payment gateway
     if(paymentMethod === 'credit_card') {
        console.log('Finalizing Credit Card Payment:', cardState);
    } else {
        console.log('Finalizing Payment for', paymentMethod)
    }
  }

  const getButtonLabel = () => {
    switch (paymentMethod) {
        case 'pix': return 'Gerar QR Code Pix';
        case 'credit_card': return 'Pagar com Cartão de Crédito';
        case 'boleto': return 'Gerar Boleto';
        default: return 'Continuar';
    }
  }


  return (
    <div className="flex flex-col gap-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nova Contribuição
        </h1>
        <p className="text-sm text-muted-foreground">
            Realize uma nova doação.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleProceedToPayment)} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-6">
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
                                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === 'pix' && "border-primary")}>
                                            <RadioGroupItem value="pix" className="sr-only" />
                                            <QrCode className="mb-3 h-6 w-6" />
                                            Pix
                                        </Label>
                                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === 'credit_card' && "border-primary")}>
                                            <RadioGroupItem value="credit_card" className="sr-only" />
                                            <CreditCard className="mb-3 h-6 w-6" />
                                            Crédito
                                        </Label>
                                        <Label className={cn("flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer", field.value === 'boleto' && "border-primary")}>
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

             <Separator />

              {!showPaymentDetails && (
                <div className="flex justify-end">
                    <Button type="submit" size="lg">
                        {getButtonLabel()}
                    </Button>
                </div>
              )}
            </form>
          </Form>

          {showPaymentDetails && (
            <>
                {paymentMethod === 'credit_card' && (
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle>Dados do Cartão</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <Cards
                                    number={cardState.number}
                                    expiry={cardState.expiry}
                                    cvc={cardState.cvc}
                                    name={cardState.name}
                                    focused={cardState.focus}
                                />
                            </div>
                            <div className="space-y-4">
                                <Input
                                    type="text"
                                    name="number"
                                    placeholder="Número do Cartão"
                                    value={cardState.number}
                                    onChange={handleInputChange}
                                    onFocus={handleInputFocus}
                                />
                                <Input
                                    type="text"
                                    name="name"
                                    placeholder="Nome no Cartão"
                                    value={cardState.name}
                                    onChange={handleInputChange}
                                    onFocus={handleInputFocus}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="text"
                                        name="expiry"
                                        placeholder="Validade (MM/AA)"
                                        value={cardState.expiry}
                                        onChange={handleInputChange}
                                        onFocus={handleInputFocus}
                                    />
                                    <Input
                                        type="text"
                                        name="cvc"
                                        placeholder="CVC"
                                        value={cardState.cvc}
                                        onChange={handleInputChange}
                                        onFocus={handleInputFocus}
                                    />
                                </div>
                                <Button onClick={handleFinalizePayment} className="w-full" size="lg">
                                    Pagar R$ {amount.toFixed(2)}
                                </Button>
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
            </>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
