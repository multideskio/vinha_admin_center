"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, CheckCircle, XCircle, Lock } from "lucide-react";

const resetSchema = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, {
  message: "Senhas não conferem.",
  path: ["confirm"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

type TokenStatus = 'loading' | 'valid' | 'expired' | 'invalid'

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('loading');
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    fetch(`/api/auth/verify-token?token=${token}`, { signal: controller.signal })
      .then((res) => {
        clearTimeout(timeoutId)
        return res.json()
      })
      .then((data) => {
        if (data.valid) {
          setTokenStatus('valid')
        } else if (data.expired) {
          setTokenStatus('expired')
        } else {
          setTokenStatus('invalid')
        }
      })
      .catch((error) => {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError') {
          setTokenStatus('invalid')
        } else {
          setTokenStatus('invalid')
        }
      });
  }, [token]);

  const onSubmit = async (values: ResetFormValues) => {
    setFormError(null);
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId)
      
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/auth/login"), 2500);
      } else {
        setFormError(data.error || "Erro ao redefinir senha");
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if ((error as Error).name === 'AbortError') {
        setFormError("Tempo esgotado. Por favor, tente novamente.")
      } else {
        setFormError("Erro de conexão.")
      }
    }
  };

  if (tokenStatus === 'loading') return (
    <Card className="w-full max-w-sm mx-auto border-t-4 border-t-videira-blue shadow-xl">
      <CardContent className="pt-12 pb-12 text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-videira-blue mx-auto" />
        <p className="text-muted-foreground">Validando token...</p>
      </CardContent>
    </Card>
  );
  
  if (tokenStatus === 'expired')
    return (
      <Card className="w-full max-w-sm mx-auto border-t-4 border-t-orange-500 shadow-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center items-center">
            <div className="p-4 rounded-2xl bg-orange-500/10 ring-4 ring-orange-500/30 shadow-lg">
              <XCircle className="h-10 w-10 text-orange-500" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-orange-600">Link Expirado</CardTitle>
            <CardDescription className="text-base mt-2">
              Este link de recuperação expirou. Por favor, solicite um novo link de recuperação de senha.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <a 
            href="/auth/recuperar-senha" 
            className="text-videira-blue hover:text-videira-cyan font-semibold transition-colors"
          >
            Solicitar novo link →
          </a>
        </CardContent>
      </Card>
    );

  if (tokenStatus === 'invalid')
    return (
      <Card className="w-full max-w-sm mx-auto border-t-4 border-t-destructive shadow-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center items-center">
            <div className="p-4 rounded-2xl bg-destructive/10 ring-4 ring-destructive/30 shadow-lg">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-destructive">Token Inválido</CardTitle>
            <CardDescription className="text-base mt-2">
              Este link é inválido. Verifique se copiou o link corretamente ou solicite uma nova recuperação.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <a 
            href="/auth/recuperar-senha" 
            className="text-videira-blue hover:text-videira-cyan font-semibold transition-colors"
          >
            Solicitar novo link →
          </a>
        </CardContent>
      </Card>
    );

  if (success)
    return (
      <Card className="w-full max-w-sm mx-auto border-t-4 border-t-green-500 shadow-xl">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center items-center">
            <div className="p-4 rounded-2xl bg-green-500/10 ring-4 ring-green-500/30 shadow-lg">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-green-600">Senha Redefinida!</CardTitle>
            <CardDescription className="text-base mt-2">
              Sua senha foi alterada com sucesso. Redirecionando para o login...
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );

  return (
    <Card className="w-full max-w-sm mx-auto border-t-4 border-t-videira-cyan shadow-xl">
      <CardHeader className="text-center space-y-4 pb-6">
        <div className="flex justify-center items-center">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-videira-cyan/20 to-videira-blue/20 ring-4 ring-videira-cyan/30 shadow-lg">
            <Lock className="h-10 w-10 text-videira-cyan" />
          </div>
        </div>
        <div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-videira-cyan via-videira-blue to-videira-purple bg-clip-text text-transparent">
            Redefinir Senha
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Digite e confirme sua nova senha
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Nova senha</FormLabel>
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
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">Confirmar senha</FormLabel>
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
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 border-2 border-destructive/30 text-center">
                <p className="text-sm font-medium text-destructive">{formError}</p>
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-videira-cyan hover:bg-videira-cyan/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Redefinir Senha'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
