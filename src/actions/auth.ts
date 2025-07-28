
'use server';

import { z } from 'zod';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { lucia } from '@/lib/auth';
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
      return { error: 'Campos inválidos.' };
    }

    const { email, password } = validatedFields.data;

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!existingUser || !existingUser.password) {
      return { error: 'Credenciais inválidas.' };
    }
    
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordValid) {
        return { error: 'Credenciais inválidas.' };
    }
    
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return { success: true, role: existingUser.role };

  } catch (error) {
    console.error(error);
    return { error: 'Ocorreu um erro ao tentar fazer login.' };
  }
}

export async function logoutUser() {
    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
    return redirect("/auth/login");
}
