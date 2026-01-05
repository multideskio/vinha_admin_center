'use server'

import { z } from 'zod'
import { db } from '@/db/drizzle'
import { users } from '@/db/schema'
import { sql } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'
import { createJWT, setJWTCookie, clearJWTCookie } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'
import { rateLimit, rateLimitPresets } from '@/lib/rate-limiter'
import { headers } from 'next/headers'

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido.' }),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
})

export async function loginUser(
  values: z.infer<typeof loginSchema>,
): Promise<{ success: boolean; error?: string; role?: string }> {
  try {
    // Rate limiting (usar email como identificador + IP se disponível)
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const realIP = headersList.get('x-real-ip')
    const clientIP = forwarded?.split(',')[0]?.trim() || realIP || 'unknown'

    const rateLimitResult = rateLimit(`login:${values.email}:${clientIP}`, rateLimitPresets.login)

    if (!rateLimitResult.allowed) {
      const resetInMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000)
      throw new Error(`Muitas tentativas de login. Tente novamente em ${resetInMinutes} minutos.`)
    }

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
      role: existingUser.role,
    })
    await setJWTCookie(token)

    return { success: true, role: existingUser.role }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function logoutUser(): Promise<{ success: boolean }> {
  try {
    await clearJWTCookie()
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false }
  }
}
