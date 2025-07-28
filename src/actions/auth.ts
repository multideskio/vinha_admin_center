
'use server';

import { z } from 'zod';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
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
        const errorMessage = validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.password?.[0] || 'Campos inválidos.';
        return { error: errorMessage };
    }

    const { email, password } = validatedFields.data;
    
    const [existingUser] = await db.select().from(users).where(sql`LOWER(${users.email}) = ${email.toLowerCase()}`);

    if (!existingUser) {
        return { error: 'Credenciais inválidas. Usuário não encontrado.' };
    }
    
    if (!existingUser.password) {
        return { error: 'Credenciais inválidas. Senha não cadastrada para este usuário.' };
    }
    
    const storedPassword = String(existingUser.password);
    const isPasswordValid = await bcrypt.compare(password, storedPassword);
    
    if (!isPasswordValid) {
        return { error: 'Credenciais inválidas. A senha não confere.' };
    }
    
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
