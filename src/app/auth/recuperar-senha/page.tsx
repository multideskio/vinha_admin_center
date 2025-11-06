
'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useState } from 'react';

const recoverySchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
});

type RecoveryFormValues = z.infer<typeof recoverySchema>;

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22a2.5 2.5 0 0 1-2.5-2.5V18h5v1.5A2.5 2.5 0 0 1 12 22Z" />
      <path d="M12 2v2" />
      <path d="M12 18v-8" />
      <path d="M15 9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path d="M19 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path d="M9 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    </svg>
  );

export default function RecuperarSenhaPage() {
  const form = useForm<RecoveryFormValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      email: '',
    },
  });

  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (data: RecoveryFormValues) => {
    setFormError(null)
    setSuccess(false)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      
      if (res.ok) {
        setSuccess(true)
      } else {
        const json = await res.json()
        setFormError(json.error || 'Erro ao enviar e-mail.')
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        setFormError('Tempo esgotado. Por favor, tente novamente.')
      } else {
        setFormError('Erro de conexão.')
      }
    }
  };

  return (
    <Card className="w-full max-w-sm border-t-4 border-t-videira-purple shadow-xl">
        <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center items-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-videira-purple/20 to-videira-blue/20 ring-4 ring-videira-purple/30 shadow-lg">
                    <Logo className="h-10 w-10 text-videira-purple" />
                </div>
            </div>
            <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-videira-purple via-videira-blue to-videira-cyan bg-clip-text text-transparent">
                    Recuperar Senha
                </CardTitle>
                <CardDescription className="text-base mt-2">
                    Digite seu e-mail para receber um link de recuperação
                </CardDescription>
            </div>
        </CardHeader>
        <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                <FormItem>
                    <FormLabel className="font-semibold">Email</FormLabel>
                    <FormControl>
                    <Input
                        type="email"
                        placeholder="seu@email.com"
                        className="border-2 focus:border-videira-purple"
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button 
                type="submit" 
                className="w-full bg-videira-purple hover:bg-videira-purple/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
                disabled={form.formState.isSubmitting}
            >
                {form.formState.isSubmitting ? (
                    <>
                        <span className="mr-2">Enviando...</span>
                    </>
                ) : (
                    'Enviar Link de Recuperação'
                )}
            </Button>
            </form>
        </Form>
        {success ? (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border-2 border-green-500/30 space-y-2">
            <p className="text-sm font-medium text-green-600 text-center">
              ✓ Link de recuperação enviado! Verifique sua caixa de entrada e spam.
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Não recebeu? Aguarde alguns minutos ou tente novamente.
            </p>
          </div>
        ) : null}
        {formError ? (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border-2 border-destructive/30 text-center">
            <p className="text-sm font-medium text-destructive">{formError}</p>
          </div>
        ) : null}
        <div className="mt-6 text-center border-t pt-6">
            <p className="text-sm text-muted-foreground">
                <Link href="/auth/login" className="text-videira-blue hover:text-videira-cyan font-semibold transition-colors">
                    ← Voltar para o login
                </Link>
            </p>
        </div>
        </CardContent>
    </Card>
  );
}

