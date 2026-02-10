import { db } from '@/db/drizzle'
import { userActionLogs } from '@/db/schema'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function logUserAction(
  userId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: string,
) {
  try {
    const isValidUuid = entityId && UUID_REGEX.test(entityId)

    // Se entityId não é UUID válido, move para details
    const finalDetails =
      !isValidUuid && entityId
        ? JSON.stringify({ entityRef: entityId, ...(details ? { params: details } : {}) })
        : details

    await db.insert(userActionLogs).values({
      userId,
      action,
      entityType,
      entityId: isValidUuid ? entityId : null,
      details: finalDetails,
    })
  } catch (error) {
    console.error('Erro ao registrar ação do usuário:', error)
  }
}
