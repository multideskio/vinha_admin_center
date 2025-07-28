
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

  const onSubmit = (data: RecoveryFormValues) => {
    console.log(data);
    // Handle password recovery logic
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
           <div className="flex justify-center items-center mb-4">
                 <Logo className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu e-mail para receber um link de recuperação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Enviar link de recuperação
              </Button>
            </form>
          </Form>
           <div className="mt-4 text-center text-sm">
            <Link href="/login" className="underline">
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
