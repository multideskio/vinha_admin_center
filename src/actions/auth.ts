
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
      const errorMessage = validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.password?.[0] || 'Campos inválidos.';
      throw new Error(errorMessage);
    }

    const { email, password } = validatedFields.data;
    
    const [existingUser] = await db.select().from(users).where(sql`LOWER(${users.email}) = ${email.toLowerCase()}`);

    if (!existingUser) {
      throw new Error(`Usuário não encontrado com o e-mail: ${email}`);
    }
    
    if (!existingUser.password) {
      throw new Error(`Usuário ${email} encontrado, mas não possui uma senha cadastrada.`);
    }
    
    const storedPassword = String(existingUser.password);
    const isPasswordValid = await bcrypt.compare(password, storedPassword);
    
    if (!isPasswordValid) {
      throw new Error('A senha fornecida está incorreta.');
    }
    
    const session = await lucia.createSession(existingUser.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return { success: true, role: existingUser.role };

  } catch (error: any) {
    // Retorna a mensagem de erro exata para depuração no frontend.
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
