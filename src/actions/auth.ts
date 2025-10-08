'use server'

import { z } from 'zod'
import { db } from '@/db/drizzle'
import { users } from '@/db/schema'
import { sql } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'
import { createJWT, setJWTCookie, clearJWTCookie, validateRequest } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { getErrorMessage } from '@/lib/error-types'

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
})

export async function loginUser(
  values: z.infer<typeof loginSchema>,
): Promise<{ success: boolean; error?: string; role?: string }> {
  try {
    const validatedFields = loginSchema.safeParse(values)

    if (!validatedFields.success) {
      throw new Error('E-mail ou senha inválidos.')
    }

    const { email, password } = validatedFields.data

    // 1. Encontrar o usuário pelo e-mail (insensível a maiúsculas/minúsculas)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${email.toLowerCase()}`)

    if (!existingUser) {
      // Mensagem genérica para não revelar se o usuário existe
      throw new Error('Credenciais inválidas.')
    }

    if (!existingUser.password) {
      throw new Error('Este usuário não tem uma senha cadastrada.')
    }

    // 2. Comparar a senha fornecida com o hash armazenado
    const isPasswordValid = await bcrypt.compare(password, String(existingUser.password))

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas.')
    }

    // 3. Criar token JWT e definir cookie
    const token = await createJWT({
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role as any,
    })
    await setJWTCookie(token)

    return { success: true, role: existingUser.role }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function logoutUser(): Promise<void> {
  const { session } = await validateRequest()
  if (!session) {
    redirect('/auth/login')
    return
  }

  await clearJWTCookie()
  redirect('/auth/login')
}
