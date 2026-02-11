import { requireAdmin } from '@/lib/auth/require-role'
import { db } from '@/db/drizzle'
import { users, churchProfiles, supervisorProfiles } from '@/db/schema'
import { eq, isNull, and } from 'drizzle-orm'
import { IgrejasClient } from './_components/igrejas-client'

/**
 * Página de Igrejas - Server Component
 * Busca dados iniciais no servidor e renderiza componente client
 * @lastReview 2026-02-11 - Refatorado para Server Component
 */
export default async function IgrejasPage() {
  // Validar autenticação e autorização
  await requireAdmin()

  // Buscar igrejas diretamente do banco (evita problema de cookies)
  const churchesData = await db
    .select({
      id: users.id,
      email: users.email,
      status: users.status,
      phone: users.phone,
      titheDay: users.titheDay,
      avatarUrl: users.avatarUrl,
      cnpj: churchProfiles.cnpj,
      razaoSocial: churchProfiles.razaoSocial,
      nomeFantasia: churchProfiles.nomeFantasia,
      foundationDate: churchProfiles.foundationDate,
      cep: churchProfiles.cep,
      state: churchProfiles.state,
      city: churchProfiles.city,
      neighborhood: churchProfiles.neighborhood,
      address: churchProfiles.address,
      treasurerFirstName: churchProfiles.treasurerFirstName,
      treasurerLastName: churchProfiles.treasurerLastName,
      treasurerCpf: churchProfiles.treasurerCpf,
      facebook: churchProfiles.facebook,
      instagram: churchProfiles.instagram,
      website: churchProfiles.website,
      supervisorId: churchProfiles.supervisorId,
    })
    .from(users)
    .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
    .where(and(eq(users.role, 'church_account'), isNull(users.deletedAt)))

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

  // Formatar dados para o client
  const churches = churchesData.map((church) => ({
    id: church.id,
    email: church.email,
    status: church.status as 'active' | 'inactive',
    phone: church.phone || '',
    titheDay: church.titheDay,
    avatarUrl: church.avatarUrl,
    cnpj: church.cnpj,
    razaoSocial: church.razaoSocial,
    nomeFantasia: church.nomeFantasia,
    foundationDate: church.foundationDate ? new Date(church.foundationDate) : null,
    cep: church.cep || '',
    state: church.state || '',
    city: church.city || '',
    neighborhood: church.neighborhood || '',
    address: church.address || '',
    treasurerFirstName: church.treasurerFirstName,
    treasurerLastName: church.treasurerLastName,
    treasurerCpf: church.treasurerCpf,
    facebook: church.facebook,
    instagram: church.instagram,
    website: church.website,
    supervisorId: church.supervisorId,
  }))

  const supervisors = supervisorsData.map((supervisor) => ({
    id: supervisor.id,
    firstName: supervisor.firstName,
    lastName: supervisor.lastName,
  }))

  return <IgrejasClient initialChurches={churches} supervisors={supervisors} />
}
