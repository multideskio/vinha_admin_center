import { db } from '@/db/drizzle'
import { userActionLogs } from '@/db/schema'

export async function logUserAction(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: string,
) {
  try {
    await db.insert(userActionLogs).values({
      userId,
      action,
      entityType,
      entityId,
      details,
    })
  } catch (error) {
    console.error('Erro ao registrar ação do usuário:', error)
  }
}
