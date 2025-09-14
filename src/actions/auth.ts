

'use server';

import { z } from 'zod';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { lucia, validateRequest } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

export async function loginUser(values: z.infer<typeof loginSchema>) {
  try {
    const validatedFields = loginSchema.safeParse(values);

    if (!validatedFields.success) {
      throw new Error('E-mail ou senha inválidos.');
    }

    const { email, password } = validatedFields.data;
    
    // 1. Encontrar o usuário pelo e-mail (insensível a maiúsculas/minúsculas)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${email.toLowerCase()}`);

    if (!existingUser) {
      // Mensagem genérica para não revelar se o usuário existe
      throw new Error('Credenciais inválidas.');
    }
    
    if (!existingUser.password) {
      throw new Error('Este usuário não tem uma senha cadastrada.');
    }
    
    // 2. Comparar a senha fornecida com o hash armazenado
    const isPasswordValid = await bcrypt.compare(
      password,
      String(existingUser.password)
    );
    
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas.');
    }
    
    // 3. Criar a sessão do usuário
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return { success: true, role: existingUser.role };

  } catch (error: any) {
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
    (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return redirect("/auth/login");
}

