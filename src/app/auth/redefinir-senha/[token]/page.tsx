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

const resetSchema = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  confirm: z.string(),
}).refine((data) => data.password === data.confirm, {
  message: "Senhas não conferem.",
  path: ["confirm"],
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [valid, setValid] = useState<null | boolean>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirm: "" },
  });

  useEffect(() => {
    fetch(`/api/auth/verify-token?token=${token}`)
      .then((res) => res.json())
      .then((data) => setValid(!!data.valid))
      .catch(() => setValid(false));
  }, [token]);

  const onSubmit = async (values: ResetFormValues) => {
    setFormError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: values.password }),
    });
    const data = await res.json();
    if (data.success) {
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    } else {
      setFormError(data.error || "Erro ao redefinir senha");
    }
  };

  if (valid === null) return <div className="p-8 text-center">Validando token...</div>;
  if (!valid)
    return (
      <Card className="w-full max-w-sm mx-auto mt-8">
        <CardHeader className="text-center">
          <CardTitle>Token inválido ou expirado</CardTitle>
          <CardDescription>Solicite uma nova recuperação de senha.</CardDescription>
        </CardHeader>
      </Card>
    );

  if (success)
    return (
      <Card className="w-full max-w-sm mx-auto mt-8">
        <CardHeader className="text-center">
          <CardTitle>Senha redefinida!</CardTitle>
          <CardDescription>Você pode fazer login agora.</CardDescription>
        </CardHeader>
      </Card>
    );

  return (
    <Card className="w-full max-w-sm mx-auto mt-8">
      <CardHeader className="text-center">
        <CardTitle>Redefinir Senha</CardTitle>
        <CardDescription>Digite sua nova senha abaixo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
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
                  <FormLabel>Confirmar senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirme a senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {formError && <div className="text-red-600 text-sm">{formError}</div>}
            <Button type="submit" className="w-full">Redefinir senha</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
