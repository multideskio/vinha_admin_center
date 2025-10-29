/**
 * Manager authentication and authorization utilities
 */
import { validateRequest } from '@/lib/jwt'
import { db } from '@/db/drizzle'
import { supervisorProfiles, pastorProfiles, churchProfiles } from '@/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function validateManagerAuth() {
  const { user } = await validateRequest()
  
  if (!user) {
    return { error: 'Não autorizado', status: 401 as const, user: null }
  }
  
  if (user.role !== 'manager') {
    return { error: 'Acesso negado', status: 403 as const, user: null }
  }
  
  return { error: null, status: 200 as const, user }
}

export async function getManagerNetwork(managerId: string) {
  // Get supervisors
  const supervisors = await db
    .select({ userId: supervisorProfiles.userId })
    .from(supervisorProfiles)
    .where(eq(supervisorProfiles.managerId, managerId))

  const supervisorUserIds = supervisors.map(s => s.userId)

  if (supervisorUserIds.length === 0) {
    return {
      supervisorUserIds: [],
      pastorUserIds: [],
      churchUserIds: [],
    }
  }

  // Get pastors and churches in parallel
  const [pastors, churches] = await Promise.all([
    db
      .select({ userId: pastorProfiles.userId })
      .from(pastorProfiles)
      .where(inArray(pastorProfiles.supervisorId, supervisorUserIds)),
    db
      .select({ userId: churchProfiles.userId })
      .from(churchProfiles)
      .where(inArray(churchProfiles.supervisorId, supervisorUserIds)),
  ])

  return {
    supervisorUserIds,
    pastorUserIds: pastors.map(p => p.userId),
    churchUserIds: churches.map(c => c.userId),
  }
}
