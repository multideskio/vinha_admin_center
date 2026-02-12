'use server'

import { z } from 'zod'
import { db } from '@/db/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

const blockSchema = z.object({
  targetUserId: z.string().uuid('ID de usuário inválido'),
  reason: z.string().min(5, 'O motivo deve ter no mínimo 5 caracteres'),
})

const unblockSchema = z.object({
  targetUserId: z.string().uuid('ID de usuário inválido'),
})

/**
 * Bloqueia o login de um usuário
 * Apenas admins podem bloquear usuários
 */
export async function blockUser(
  values: z.infer<typeof blockSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user: currentUser } = await validateRequest()

    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    if (currentUser.role !== 'admin') {
      throw new Error('Apenas administradores podem bloquear usuários')
    }

    const validatedFields = blockSchema.safeParse(values)
    if (!validatedFields.success) {
      throw new Error('Dados inválidos')
    }

    const { targetUserId, reason } = validatedFields.data

    // Não permitir bloquear a si mesmo
    if (targetUserId === currentUser.id) {
      throw new Error('Você não pode bloquear sua própria conta')
    }

    // Verificar se o usuário alvo existe
    const [targetUser] = await db
      .select({ id: users.id, email: users.email, role: users.role, blockedAt: users.blockedAt })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1)

    if (!targetUser) {
      throw new Error('Usuário não encontrado')
    }

    if (targetUser.blockedAt) {
      throw new Error('Este usuário já está bloqueado')
    }

    // Bloquear o usuário
    await db
      .update(users)
      .set({
        blockedAt: new Date(),
        blockedBy: currentUser.id,
        blockReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId))

    console.log(
      `[USER_BLOCKED] ${currentUser.email} bloqueou ${targetUser.email}. Motivo: ${reason}`,
    )

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[BLOCK_USER_ERROR]', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Desbloqueia o login de um usuário
 * Apenas admins podem desbloquear usuários
 */
export async function unblockUser(
  values: z.infer<typeof unblockSchema>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user: currentUser } = await validateRequest()

    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    if (currentUser.role !== 'admin') {
      throw new Error('Apenas administradores podem desbloquear usuários')
    }

    const validatedFields = unblockSchema.safeParse(values)
    if (!validatedFields.success) {
      throw new Error('Dados inválidos')
    }

    const { targetUserId } = validatedFields.data

    // Verificar se o usuário alvo existe e está bloqueado
    const [targetUser] = await db
      .select({ id: users.id, email: users.email, blockedAt: users.blockedAt })
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1)

    if (!targetUser) {
      throw new Error('Usuário não encontrado')
    }

    if (!targetUser.blockedAt) {
      throw new Error('Este usuário não está bloqueado')
    }

    // Desbloquear o usuário
    await db
      .update(users)
      .set({
        blockedAt: null,
        blockedBy: null,
        blockReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUserId))

    console.log(`[USER_UNBLOCKED] ${currentUser.email} desbloqueou ${targetUser.email}`)

    return { success: true }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[UNBLOCK_USER_ERROR]', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Verifica o status de bloqueio de um usuário
 */
export async function checkBlockStatus(userId: string): Promise<{
  isBlocked: boolean
  blockedAt?: Date | null
  blockReason?: string | null
}> {
  try {
    const [user] = await db
      .select({
        blockedAt: users.blockedAt,
        blockReason: users.blockReason,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) {
      return { isBlocked: false }
    }

    return {
      isBlocked: !!user.blockedAt,
      blockedAt: user.blockedAt,
      blockReason: user.blockReason,
    }
  } catch (error) {
    console.error('[CHECK_BLOCK_STATUS_ERROR]', error)
    return { isBlocked: false }
  }
}
