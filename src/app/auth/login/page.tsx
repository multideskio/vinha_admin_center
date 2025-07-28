
'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

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
import { loginUser } from '@/actions/auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

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

type LogEntry = {
    message: string;
    status: 'pending' | 'success' | 'error';
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isLogging, setIsLogging] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLogging(true);
    setLogs([]); 

    const result = await loginUser(data);

    if (result.error) {
        // Exibe o erro bruto retornado pelo servidor
        setLogs([{ message: result.error, status: 'error' }]); 
    } else if (result.success && result.role) {
        setLogs([{ message: 'Login bem-sucedido! Redirecionando...', status: 'success' }]);

        toast({
            title: "Login bem-sucedido!",
            description: "Redirecionando para o seu painel.",
        });

        const roleToPathMap: { [key: string]: string } = {
            admin: '/admin',
            manager: '/gerente',
            supervisor: '/supervisor',
            pastor: '/pastor',
            church_account: '/igreja'
        }
        const path = roleToPathMap[result.role] || '/';
        router.push(path);
    }
    setIsLogging(false);
  };

  return (
    <Card className="w-full max-w-sm border-none shadow-none">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
                    <Logo className="h-8 w-8 text-primary" />
            </div>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
            Acesse seu painel com seu e-mail e senha.
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
            <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                <FormItem>
                    <div className="flex items-center">
                    <FormLabel>Senha</FormLabel>
                    <Link
                        href="/auth/recuperar-senha"
                        className="ml-auto inline-block text-sm underline"
                    >
                        Esqueceu sua senha?
                    </Link>
                    </div>
                    <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || isLogging}>
                {isLogging ? 'Verificando...' : 'Login'}
            </Button>
            </form>
        </Form>
        {logs.length > 0 && (
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base">Logs de Autenticação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm font-mono">
                    {logs.map((log, index) => (
                        <div key={index} className="flex items-center gap-2">
                            {log.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            {log.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {log.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                            <span className={cn(
                                'break-words',
                                log.status === 'error' && 'text-destructive'
                            )}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )}
        <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/auth/nova-conta" className="underline">
            Cadastre-se
            </Link>
        </div>
        </CardContent>
    </Card>
  );
}
