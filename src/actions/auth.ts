
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
        const errorMessage = validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.password?.[0] || 'Campos inválidos.';
        console.error('[AUTH_DEBUG] Erro de validação dos campos:', validatedFields.error.flatten());
        return { error: errorMessage };
    }

    const { email, password } = validatedFields.data;
    console.log(`[AUTH_DEBUG] Buscando usuário: ${email}`);
    
    const [existingUser] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

    if (!existingUser) {
        console.error(`[AUTH_DEBUG] Usuário com e-mail ${email} não encontrado.`);
        return { error: 'Credenciais inválidas. Usuário não encontrado.' };
    }
    
    console.log('[AUTH_DEBUG] Usuário encontrado:', { id: existingUser.id, email: existingUser.email, role: existingUser.role });

    if (!existingUser.password) {
        console.error(`[AUTH_DEBUG] Usuário ${email} não possui uma senha cadastrada.`);
        return { error: 'Credenciais inválidas. Senha não cadastrada para este usuário.' };
    }
    
    console.log('[AUTH_DEBUG] Verificando senha...');
    const storedPassword = String(existingUser.password);
    const isPasswordValid = await bcrypt.compare(password, storedPassword);
    
    if (!isPasswordValid) {
        console.error(`[AUTH_DEBUG] Comparação de senha falhou para o usuário ${email}.`);
        return { error: 'Credenciais inválidas. A senha não confere.' };
    }
    
    console.log(`[AUTH_DEBUG] Senha válida. Criando sessão para o usuário ${existingUser.id}.`);
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    console.log(`[AUTH_DEBUG] Sessão criada com sucesso. Redirecionando para o painel de ${existingUser.role}.`);
    return { success: true, role: existingUser.role };

  } catch (error: any) {
    console.error('[AUTH_DEBUG] Ocorreu um erro inesperado no servidor:', error);
    // Retorna a mensagem de erro bruta para depuração no frontend.
    return { error: error.message };
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
