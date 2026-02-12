'use server'

import { z } from 'zod'
import { db } from '@/db/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createJWT, setJWTCookie, validateRequest } from '@/lib/jwt'
import { cookies } from 'next/headers'

const impersonateSchema = z.object({
  targetUserId: z.string().uuid('ID de usuário inválido'),
})

/**
 * Inicia impersonation de um usuário
 * Apenas admins e managers podem usar esta funcionalidade
 */
export async function impersonateUser(
  values: z.infer<typeof impersonateSchema>,
): Promise<{ success: boolean; error?: string; targetRole?: string }> {
  try {
    // 1. Validar usuário atual
    const { user: currentUser } = await validateRequest()

    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    // 2. Verificar permissões (apenas admin e manager podem impersonar)
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      throw new Error('Você não tem permissão para usar esta funcionalidade')
    }

    // 3. Validar dados
    const validatedFields = impersonateSchema.safeParse(values)

    if (!validatedFields.success) {
      throw new Error('Dados inválidos')
    }

    const { targetUserId } = validatedFields.data

    // 4. Buscar usuário alvo
    const [targetUser] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1)

    if (!targetUser) {
      throw new Error('Usuário não encontrado')
    }

    // 5. Admins não podem impersonar outros admins (segurança)
    if (targetUser.role === 'admin' && currentUser.role !== 'admin') {
      throw new Error('Você não pode fazer login como administrador')
    }

    // 6. Salvar ID do usuário original em cookie separado
    const cookieStore = await cookies()
    cookieStore.set('original_user_id', currentUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 horas
    })

    // 7. Criar novo token JWT para o usuário alvo
    const token = await createJWT({
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
    })

    await setJWTCookie(token)

    // 8. Log de auditoria (você pode expandir isso para salvar no banco)
    console.log(
      `[IMPERSONATION] ${currentUser.email} (${currentUser.role}) está logando como ${targetUser.email} (${targetUser.role})`,
    )

    return {
      success: true,
      targetRole: targetUser.role,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[IMPERSONATION_ERROR]', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Retorna à conta original após impersonation
 */
export async function stopImpersonation(): Promise<{
  success: boolean
  error?: string
  originalRole?: string
}> {
  try {
    // 1. Buscar ID do usuário original
    const cookieStore = await cookies()
    const originalUserId = cookieStore.get('original_user_id')

    if (!originalUserId?.value) {
      throw new Error('Nenhuma sessão de impersonation ativa')
    }

    // 2. Buscar dados do usuário original
    const [originalUser] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, originalUserId.value))
      .limit(1)

    if (!originalUser) {
      throw new Error('Usuário original não encontrado')
    }

    // 3. Criar novo token JWT para o usuário original
    const token = await createJWT({
      id: originalUser.id,
      email: originalUser.email,
      role: originalUser.role,
    })

    await setJWTCookie(token)

    // 4. Remover cookie de impersonation
    cookieStore.delete('original_user_id')

    // 5. Log de auditoria
    console.log(`[IMPERSONATION_STOP] ${originalUser.email} voltou à conta original`)

    return {
      success: true,
      originalRole: originalUser.role,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[STOP_IMPERSONATION_ERROR]', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Verifica se o usuário atual está em modo impersonation
 */
export async function checkImpersonationStatus(): Promise<{
  isImpersonating: boolean
  originalUserId?: string
}> {
  try {
    const cookieStore = await cookies()
    const originalUserId = cookieStore.get('original_user_id')

    return {
      isImpersonating: !!originalUserId?.value,
      originalUserId: originalUserId?.value,
    }
  } catch (error) {
    console.error('[CHECK_IMPERSONATION_ERROR]', error)
    return { isImpersonating: false }
  }
}
