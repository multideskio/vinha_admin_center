import { requireAdmin } from '@/lib/auth/require-role'
import { SupervisoresClient } from './_components'
import type { Supervisor, Manager, Region } from './_components'
import { db } from '@/db/drizzle'
import { users, supervisorProfiles, managerProfiles, regions } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

/**
 * Página de Supervisores - Server Component
 * Busca dados iniciais no servidor e renderiza componente client
 * @lastReview 2026-02-11 - Refatorado para Server Component
 */
export default async function SupervisoresPage() {
  // Validar autenticação e autorização
  await requireAdmin()

  // Buscar supervisores diretamente do banco (evita problema de cookies)
  const supervisorsData = await db
    .select({
      id: users.id,
      email: users.email,
      status: users.status,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      firstName: supervisorProfiles.firstName,
      lastName: supervisorProfiles.lastName,
      cpf: supervisorProfiles.cpf,
      cep: supervisorProfiles.cep,
      state: supervisorProfiles.state,
      city: supervisorProfiles.city,
      neighborhood: supervisorProfiles.neighborhood,
      address: supervisorProfiles.address,
      managerId: supervisorProfiles.managerId,
      managerFirstName: managerProfiles.firstName,
      managerLastName: managerProfiles.lastName,
      regionId: supervisorProfiles.regionId,
      regionName: regions.name,
    })
    .from(users)
    .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
    .leftJoin(managerProfiles, eq(supervisorProfiles.managerId, managerProfiles.userId))
    .leftJoin(regions, eq(supervisorProfiles.regionId, regions.id))
    .where(and(eq(users.role, 'supervisor'), isNull(users.deletedAt)))
    .orderBy(supervisorProfiles.firstName)

  // Buscar gerentes para o formulário
  const managersData = await db
    .select({
      id: users.id,
      firstName: managerProfiles.firstName,
      lastName: managerProfiles.lastName,
    })
    .from(users)
    .innerJoin(managerProfiles, eq(users.id, managerProfiles.userId))
    .where(and(eq(users.role, 'manager'), isNull(users.deletedAt)))
    .orderBy(managerProfiles.firstName)

  // Buscar regiões ativas
  const regionsData = await db
    .select({
      id: regions.id,
      name: regions.name,
    })
    .from(regions)
    .where(isNull(regions.deletedAt))
    .orderBy(regions.name)

  // Formatar dados para o componente client
  const initialSupervisors: Supervisor[] = supervisorsData.map((s) => ({
    id: s.id,
    email: s.email,
    status: s.status as 'active' | 'inactive',
    phone: s.phone,
    avatarUrl: s.avatarUrl,
    firstName: s.firstName,
    lastName: s.lastName,
    cpf: s.cpf,
    cep: s.cep || '',
    state: s.state || '',
    city: s.city || '',
    neighborhood: s.neighborhood || '',
    address: s.address || '',
    managerId: s.managerId,
    managerName:
      s.managerFirstName && s.managerLastName
        ? `${s.managerFirstName} ${s.managerLastName}`
        : undefined,
    regionId: s.regionId,
    regionName: s.regionName || undefined,
  }))

  const managers: Manager[] = managersData.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
  }))

  const regionsFormatted: Region[] = regionsData.map((r) => ({
    id: r.id,
    name: r.name,
  }))

  return (
    <SupervisoresClient
      initialSupervisors={initialSupervisors}
      managers={managers}
      regions={regionsFormatted}
    />
  )
}
