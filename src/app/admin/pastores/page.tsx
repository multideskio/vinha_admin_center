import { requireAdmin } from '@/lib/auth/require-role'
import { PastoresClient } from './_components'
import type { Pastor, Supervisor } from './_components'
import { db } from '@/db/drizzle'
import { users, pastorProfiles, supervisorProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

/**
 * Página de Pastores - Server Component
 * Busca dados iniciais no servidor e renderiza componente client
 * @lastReview 2026-02-11 - Refatorado para Server Component
 */
export default async function PastoresPage() {
  // Validar autenticação e autorização
  await requireAdmin()

  // Buscar pastores diretamente do banco (evita problema de cookies)
  const pastorsData = await db
    .select({
      id: users.id,
      email: users.email,
      status: users.status,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      titheDay: users.titheDay,
      firstName: pastorProfiles.firstName,
      lastName: pastorProfiles.lastName,
      cpf: pastorProfiles.cpf,
      birthDate: pastorProfiles.birthDate,
      cep: pastorProfiles.cep,
      state: pastorProfiles.state,
      city: pastorProfiles.city,
      neighborhood: pastorProfiles.neighborhood,
      address: pastorProfiles.address,
      supervisorId: pastorProfiles.supervisorId,
      supervisorFirstName: supervisorProfiles.firstName,
      supervisorLastName: supervisorProfiles.lastName,
    })
    .from(users)
    .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
    .leftJoin(supervisorProfiles, eq(pastorProfiles.supervisorId, supervisorProfiles.userId))
    .where(and(eq(users.role, 'pastor'), isNull(users.deletedAt)))
    .orderBy(pastorProfiles.firstName)

  // Buscar supervisores para o formulário
  const supervisorsData = await db
    .select({
      id: users.id,
      firstName: supervisorProfiles.firstName,
      lastName: supervisorProfiles.lastName,
    })
    .from(users)
    .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
    .where(and(eq(users.role, 'supervisor'), isNull(users.deletedAt)))
    .orderBy(supervisorProfiles.firstName)

  // Formatar dados para o componente client
  const initialPastors: Pastor[] = pastorsData.map((p) => ({
    id: p.id,
    email: p.email,
    status: p.status as 'active' | 'inactive',
    phone: p.phone,
    avatarUrl: p.avatarUrl,
    firstName: p.firstName,
    lastName: p.lastName,
    cpf: p.cpf,
    birthDate: p.birthDate ? new Date(p.birthDate) : null,
    cep: p.cep || '',
    state: p.state || '',
    city: p.city || '',
    neighborhood: p.neighborhood || '',
    address: p.address || '',
    titheDay: p.titheDay,
    supervisorId: p.supervisorId,
    supervisorName:
      p.supervisorFirstName && p.supervisorLastName
        ? `${p.supervisorFirstName} ${p.supervisorLastName}`
        : undefined,
  }))

  const supervisors: Supervisor[] = supervisorsData.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
  }))

  return <PastoresClient initialPastors={initialPastors} supervisors={supervisors} />
}
