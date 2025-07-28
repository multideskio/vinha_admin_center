
'use client';

import * as React from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, FileUp, Shield, Banknote, CreditCard, QrCode } from 'lucide-react';

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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Schemas
const cieloSchema = z.object({
  active: z.boolean().default(false),
  environment: z.enum(['production', 'development']),
  prodMerchantId: z.string().optional(),
  prodMerchantKey: z.string().optional(),
  devMerchantId: z.string().optional(),
  devMerchantKey: z.string().optional(),
  enablePix: z.boolean().default(false),
  enableCreditCard: z.boolean().default(false),
  enableBoleto: z.boolean().default(false),
});

const bradescoSchema = z.object({
  active: z.boolean().default(false),
  environment: z.enum(['production', 'development']),
  prodClientId: z.string().optional(),
  prodClientSecret: z.string().optional(),
  devClientId: z.string().optional(),
  devClientSecret: z.string().optional(),
  certificateFile: z.any().optional(),
  certificatePassword: z.string().optional(),
});

type CieloFormValues = z.infer<typeof cieloSchema>;
type BradescoFormValues = z.infer<typeof bradescoSchema>;

const CieloForm = () => {
  const form = useForm<CieloFormValues>({
    resolver: zodResolver(cieloSchema),
    defaultValues: {
      active: true,
      environment: 'development',
      enablePix: true,
      enableCreditCard: true,
    },
  });

  function onSubmit(data: CieloFormValues) {
    console.log(data);
    // Submit logic
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CIELO</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status</FormLabel>
                    <FormMessage />
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h3 className="mb-4 text-lg font-medium">Credenciais de Produção</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="prodMerchantId"
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
                  name="prodMerchantKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MerchantKey</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua MerchantKey de produção" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-medium">Credenciais de Desenvolvimento</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="devMerchantId"
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
                  name="devMerchantKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MerchantKey</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua MerchantKey de desenvolvimento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
                <h3 className="mb-4 text-lg font-medium">Configuração do Checkout</h3>
                <div className="space-y-2">
                    <FormField
                    control={form.control}
                    name="enablePix"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Ativar Pix</FormLabel>
                            </div>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="enableCreditCard"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Ativar Cartão de crédito</FormLabel>
                            </div>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="enableBoleto"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel>Ativar Boletos</FormLabel>
                            </div>
                        </FormItem>
                    )}
                    />
                </div>
            </div>

            <Button type="submit">Salvar Configurações da Cielo</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const BradescoForm = () => {
    const form = useForm<BradescoFormValues>({
      resolver: zodResolver(bradescoSchema),
      defaultValues: {
        active: false,
        environment: 'development',
      },
    });
  
    function onSubmit(data: BradescoFormValues) {
      console.log(data);
      // Submit logic
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>BRADESCO</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status</FormLabel>
                      <FormMessage />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              <div>
                <h3 className="mb-4 text-lg font-medium">Credenciais de Produção</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="prodClientId"
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
                    name="prodClientSecret"
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
              </div>
  
              <div>
                <h3 className="mb-4 text-lg font-medium">Credenciais de Desenvolvimento</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="devClientId"
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
                    name="devClientSecret"
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
              </div>
  
              <div>
                <h3 className="mb-4 text-lg font-medium">Certificado Digital</h3>
                <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="certificateFile"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Arquivo do Certificado (.pfx, .pem)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <FileUp className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input type="file" className="pl-10" onChange={(e) => field.onChange(e.target.files?.[0])} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
                  <FormField
                    control={form.control}
                    name="certificatePassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha do Certificado</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Senha para o arquivo do certificado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
  
              <Button type="submit">Salvar Configurações do Bradesco</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  };
  

export default function GatewaysPage() {
  const [selectedGateway, setSelectedGateway] = React.useState('cielo');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Gerenciamento de gateways para pagamentos
        </h1>
        <p className="text-sm text-muted-foreground">
            Configure e gerencie múltiplos portais de pagamento.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
                <CardTitle>Gateways</CardTitle>
            </CardHeader>
            <CardContent className='p-2'>
                <div className="flex flex-col gap-2">
                    <button onClick={() => setSelectedGateway('cielo')} className={cn("flex items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-accent", selectedGateway === 'cielo' && "bg-accent")}>
                        <Image src="https://placehold.co/40x40.png" alt="Cielo" width={40} height={40} className="rounded-md" data-ai-hint="cielo logo" />
                        <div className='flex-1'>
                            <p className="font-semibold">Cielo</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                    </button>
                    <button onClick={() => setSelectedGateway('bradesco')} className={cn("flex items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-accent", selectedGateway === 'bradesco' && "bg-accent")}>
                        <Image src="https://placehold.co/40x40.png" alt="Bradesco" width={40} height={40} className="rounded-md" data-ai-hint="bradesco logo" />
                         <div className='flex-1'>
                            <p className="font-semibold">Bradesco</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                    </button>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6">
            {selectedGateway === 'cielo' && <CieloForm />}
            {selectedGateway === 'bradesco' && <BradescoForm />}
        </div>
        
        {/* Info Column */}
        <div className="lg:col-span-3">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className='text-sm text-muted-foreground'>
                Certifique-se de que suas credenciais estão corretas para evitar falhas nas transações.
            </p>
            <Separator />
            <div>
                <h4 className="font-semibold mb-2">Meios de pagamento</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2"><QrCode size={16} /> Pix</li>
                    <li className="flex items-center gap-2"><CreditCard size={16} /> Cartão de crédito</li>
                    <li className="flex items-center gap-2"><Banknote size={16} /> Boleto</li>
                </ul>
            </div>
            <Separator />
             <div>
                <h4 className="font-semibold mb-2">Documentação</h4>
                <ul className="space-y-1">
                    <li><a href="#" className="text-sm text-primary hover:underline">API Cielo</a></li>
                    <li><a href="#" className="text-sm text-primary hover:underline">API Bradesco</a></li>
                </ul>
             </div>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
