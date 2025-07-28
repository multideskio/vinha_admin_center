
'use server';

import { z } from 'zod';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { lucia, validateRequest } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

export async function loginUser(values: z.infer<typeof loginSchema>) {
  console.log(`[AUTH_DEBUG] Iniciando tentativa de login para: ${values.email}`);
  try {
    const validatedFields = loginSchema.safeParse(values);

    if (!validatedFields.success) {
        console.error('[AUTH_DEBUG] Erro de validação dos campos:', validatedFields.error.flatten());
        return { error: 'Campos inválidos.' };
    }

    const { email, password } = validatedFields.data;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!existingUser) {
        console.error(`[AUTH_DEBUG] Usuário com e-mail ${email} não encontrado no banco de dados.`);
        return { error: 'Credenciais inválidas.' };
    }
    
    console.log('[AUTH_DEBUG] Usuário encontrado:', { id: existingUser.id, email: existingUser.email, role: existingUser.role });

    if (!existingUser.password) {
        console.error(`[AUTH_DEBUG] Usuário ${email} não possui uma senha cadastrada.`);
        return { error: 'Credenciais inválidas.' };
    }
    
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    console.log(`[AUTH_DEBUG] A senha fornecida é válida? ${isPasswordValid}`);

    if (!isPasswordValid) {
        console.error(`[AUTH_DEBUG] Comparação de senha falhou para o usuário ${email}.`);
        return { error: 'Credenciais inválidas.' };
    }
    
    console.log(`[AUTH_DEBUG] Senha válida. Criando sessão para o usuário ${email}.`);
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    console.log(`[AUTH_DEBUG] Sessão criada com sucesso. Redirecionando para o painel de ${existingUser.role}.`);
    return { success: true, role: existingUser.role };

  } catch (error) {
    console.error('[AUTH_DEBUG] Ocorreu um erro inesperado no servidor:', error);
    return { error: 'Ocorreu um erro ao tentar fazer login.' };
  }
}

export async function logoutUser() {
    const { session } = await validateRequest();
    if (!session) {
        return { error: "Não autorizado" };
    }

    await lucia.invalidateSession(session.id);

    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return redirect("/auth/login");
}
