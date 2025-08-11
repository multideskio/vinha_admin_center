
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CreditCard, QrCode, DollarSign, CheckCircle, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';


const contributionSchema = z.object({
  amount: z.coerce.number().min(1, 'O valor deve ser maior que zero.'),
  paymentMethod: z.enum(['pix', 'credit_card', 'boleto'], {
    required_error: 'Selecione um método de pagamento.',
  }),
  contributionType: z.enum(['dizimo', 'oferta'], { required_error: "O tipo de contribuição é obrigatório." }),
  description: z.string().optional(),
  card: z.object({
    number: z.string(),
    holder: z.string(),
    expirationDate: z.string(),
    securityCode: z.string(),
    brand: z.string(),
  }).optional(),
});

type ContributionFormValues = z.infer<typeof contributionSchema>;

type CieloPaymentResponse = {
    QrCodeBase64Image?: string;
    QrCodeString?: string;
    DigitableLine?: string;
    Url?: string;
    PaymentId?: string;
};

export default function ContribuicoesPage() {
  const [paymentDetails, setPaymentDetails] = React.useState<CieloPaymentResponse | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [pixStatus, setPixStatus] = React.useState<'idle' | 'pending' | 'confirmed'>('idle');
  const [showPaymentDetails, setShowPaymentDetails] = React.useState(false);
  const [cardState, setCardState] = React.useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
    focus: '' as Focused,
  });

  const { toast } = useToast();

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
        paymentMethod: 'pix',
        amount: 0,
        contributionType: undefined,
        description: '',
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

  const handleCopy = (code: string | undefined, type: string) => {
    if(!code) return;
    navigator.clipboard.writeText(code);
    toast({
        title: "Copiado!",
        description: `Código do ${type} copiado com sucesso.`,
    });
  };

  React.useEffect(() => {
    setShowPaymentDetails(false);
    setPaymentDetails(null);
    setPixStatus('idle');
  }, [paymentMethod, amount]);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentDetails && paymentMethod === 'pix' && pixStatus === 'pending') {
        timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/v1/transacoes/${paymentDetails.PaymentId}`);
                const data = await res.json();
                if(data.transaction?.Payment?.Status === 2){
                    setPixStatus('confirmed');
                    toast({
                        title: "Sucesso!",
                        description: "Pagamento via Pix confirmado com sucesso.",
                        variant: 'success',
                    });
                }
            } catch (error) {
                console.error("Falha ao verificar status do Pix");
            }
        }, 8000); 
    }
    return () => clearTimeout(timer);
  }, [paymentDetails, paymentMethod, pixStatus, toast]);


  const handleInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    let formattedValue = value;

    if (name === 'number') {
        formattedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (name === 'expiry') {
        formattedValue = value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .slice(0, 5); // MM/YY
    } else if (name === 'cvc') {
        formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardState((prev) => ({ ...prev, [name]: formattedValue }));
  }

  const handleInputFocus = (evt: React.FocusEvent<HTMLInputElement>) => {
    setCardState((prev) => ({ ...prev, focus: evt.target.name as Focused }));
  }

  async function handleFormSubmit(data: ContributionFormValues) {
    if (data.paymentMethod === 'credit_card') {
      setShowPaymentDetails(true);
      return;
    }
    
    setIsProcessing(true);
    setPaymentDetails(null);
    try {
        const payload = { ...data };
        const response = await fetch('/api/v1/transacoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Falha ao processar o pagamento.');
        }
        setPaymentDetails(result.data);
        setShowPaymentDetails(true);
        if(data.paymentMethod === 'pix') {
            setPixStatus('pending');
        }

    } catch (error: any) {
        toast({
            title: "Erro no Pagamento",
            description: error.message,
            variant: "destructive"
        })
    } finally {
        setIsProcessing(false);
    }
  }

  const handleFinalizeCardPayment = async () => {
    const contributionData = form.getValues();
    const payload = {
      ...contributionData,
      card: {
        number: cardState.number,
        holder: cardState.name,
        expirationDate: cardState.expiry,
        securityCode: cardState.cvc,
        brand: "Visa", 
      }
    };
    setIsProcessing(true);
    try {
        const response = await fetch('/api/v1/transacoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Falha ao processar o pagamento com cartão.');
        }
        toast({ title: "Sucesso!", description: "Pagamento com cartão aprovado.", variant: "success"});
        form.reset({ amount: 0, paymentMethod: 'pix', contributionType: 'dizimo', description: '' });
        setCardState({ number: '', expiry: '', cvc: '', name: '', focus: '' });
        setShowPaymentDetails(false);
        setPaymentDetails(null);
    } catch (error: any) {
         toast({ title: "Erro no Pagamento", description: error.message, variant: "destructive"});
    } finally {
        setIsProcessing(false);
    }
  }


  const getButtonLabel = () => {
    switch (paymentMethod) {
        case 'pix': return 'Gerar QR Code Pix';
        case 'credit_card': return 'Ir para o Cartão de Crédito';
        case 'boleto': return 'Gerar Boleto';
        default: return 'Continuar';
    }
  }

  const getFullQrCodeSrc = () => {
    if (!paymentDetails?.QrCodeBase64Image) {
        return null;
    }
    if (paymentDetails.QrCodeBase64Image.startsWith('data:image/png;base64,')) {
        return paymentDetails.QrCodeBase64Image;
    }
    return `data:image/png;base64,${paymentDetails.QrCodeBase64Image}`;
  }
  
  const qrCodeSrc = getFullQrCodeSrc();

  return (
    <div className="flex flex-col gap-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Nova Contribuição
        </h1>
        <p className="text-sm text-muted-foreground">
            Realize uma nova contribuição.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
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
                    <FormField
                        control={form.control}
                        name="contributionType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tipo de Contribuição</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="dizimo">Dízimo</SelectItem>
                                    <SelectItem value="oferta">Oferta</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Descrição (Opcional)</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Descreva o propósito da contribuição..."
                                {...field}
                                />
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
                    <Button type="submit" size="lg" disabled={isProcessing}>
                         {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         {isProcessing ? "Processando..." : getButtonLabel()}
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
                            <div className="flex justify-center md:order-2">
                                <Cards
                                    number={cardState.number}
                                    expiry={cardState.expiry}
                                    cvc={cardState.cvc}
                                    name={cardState.name}
                                    focused={cardState.focus}
                                />
                            </div>
                            <div className="space-y-4 md:order-1">
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
                                <Button onClick={handleFinalizeCardPayment} className="w-full" size="lg" disabled={isProcessing}>
                                     {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Pagar R$ {Number(amount).toFixed(2)}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
                 {paymentMethod === 'pix' && paymentDetails && pixStatus === 'pending' && (
                    <Card className="bg-muted/30 flex flex-col items-center p-6">
                        <CardHeader className="items-center">
                            <CardTitle>Aguardando Pagamento</CardTitle>
                            <CardDescription>Aponte a câmera do seu celular para o QR Code</CardDescription>
                        </CardHeader>
                        <CardContent className='flex flex-col items-center'>
                           {qrCodeSrc ? (
                                <Image src={qrCodeSrc} width={256} height={256} alt="QR Code Pix" />
                            ) : (
                                <Skeleton className="h-[256px] w-[256px]" />
                            )}
                            <Input value={paymentDetails.QrCodeString} readOnly className="mt-4 text-center" />
                            <Button variant="outline" className="w-full mt-2" onClick={() => handleCopy(paymentDetails.QrCodeString, 'Pix')}>Copiar Chave</Button>
                        </CardContent>
                    </Card>
                )}
                {pixStatus === 'confirmed' && (
                     <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h2>
                        <p className="text-muted-foreground">Sua contribuição de R$ {Number(amount).toFixed(2)} foi recebida com sucesso.</p>
                         <Button onClick={() => {
                             form.reset({ amount: 0, paymentMethod: 'pix', contributionType: undefined, description: '' });
                             setShowPaymentDetails(false);
                             setPaymentDetails(null);
                             setPixStatus('idle');
                         }} className='mt-6'>Fazer Nova Contribuição</Button>
                    </CardContent>
                )}
                {paymentMethod === 'boleto' && paymentDetails && (
                    <Card className="bg-muted/30 flex flex-col items-center p-6">
                        <CardHeader className="items-center text-center">
                            <CardTitle>Boleto Gerado</CardTitle>
                            <CardDescription>Clique no botão abaixo para baixar ou copiar o código de barras.</CardDescription>
                        </CardHeader>
                        <CardContent className="w-full">
                                <Input value={paymentDetails.DigitableLine} readOnly className="mt-4 text-center" />
                                <div className='flex gap-2 mt-2'>
                                    <Button variant="secondary" className="w-full mt-2" onClick={() => handleCopy(paymentDetails.DigitableLine, 'Boleto')}>Copiar Código</Button>
                                    <Button asChild className="w-full mt-2">
                                        <a href={paymentDetails.Url} target="_blank" rel="noopener noreferrer">Baixar Boleto</a>
                                    </Button>
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
