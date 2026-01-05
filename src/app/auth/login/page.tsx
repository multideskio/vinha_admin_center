'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Loader2, CheckCircle, XCircle, Grape } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { loginUser } from '@/actions/auth'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LogEntry = {
  message: string
  status: 'pending' | 'success' | 'error'
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [logs, setLogs] = React.useState<LogEntry[]>([])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setLogs([{ message: 'Enviando credenciais...', status: 'pending' }])

    const result = await loginUser(data)

    if (result.error) {
      setLogs([{ message: result.error, status: 'error' }])
    } else if (result.success && result.role) {
      setLogs([{ message: 'Login bem-sucedido! Redirecionando...', status: 'success' }])

      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o seu painel.',
      })

      const roleToPathMap: { [key: string]: string } = {
        admin: '/admin',
        manager: '/manager',
        supervisor: '/supervisor',
        pastor: '/pastor',
        church_account: '/igreja',
      }
      const path = roleToPathMap[result.role] || '/'
      router.push(path)
    }
  }

  return (
    <Card className="w-full max-w-sm border-t-4 border-t-videira-cyan shadow-xl">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="flex justify-center items-center">
          <Grape className="h-12 w-12 text-videira-purple fill-videira-purple/20" />
        </div>
        <div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-videira-cyan via-videira-blue to-videira-purple bg-clip-text text-transparent">
            Bem-vindo de Volta
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Acesse seu painel com seu e-mail e senha
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
                      className="border-2 focus:border-videira-cyan"
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
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-semibold">Senha</FormLabel>
                    <Link
                      href="/auth/recuperar-senha"
                      className="text-sm text-videira-blue hover:text-videira-cyan font-medium transition-colors"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="border-2 focus:border-videira-cyan"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-videira-cyan hover:bg-videira-cyan/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </Form>
        {logs.length > 0 && (
          <Card className="mt-6 border-2 border-videira-blue/30 bg-videira-blue/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-videira-blue flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-videira-blue animate-pulse"></div>
                Status de Autenticação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-background/50"
                >
                  {log.status === 'pending' && (
                    <Loader2 className="h-4 w-4 animate-spin text-videira-blue" />
                  )}
                  {log.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {log.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                  <span
                    className={cn(
                      'break-words font-medium',
                      log.status === 'error' && 'text-destructive',
                      log.status === 'success' && 'text-green-600',
                      log.status === 'pending' && 'text-muted-foreground',
                    )}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <Link
              href="/auth/nova-conta"
              className="text-videira-blue hover:text-videira-cyan font-semibold transition-colors"
            >
              Cadastre-se aqui
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
