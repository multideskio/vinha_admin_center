import { requireAdmin } from '@/lib/auth/require-role'
import { GerentesClient } from './_components'
import type { Manager } from './_components'
import { db } from '@/db/drizzle'
import { users, managerProfiles } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

/**
 * Página de Gerentes - Server Component
 * Busca dados iniciais no servidor e renderiza componente client
 * @lastReview 2026-02-11 - Refatorado para Server Component
 */
export default async function GerentesPage() {
  // Validar autenticação e autorização
  await requireAdmin()

  // Buscar gerentes diretamente do banco (evita problema de cookies)
  const managersData = await db
    .select({
      id: users.id,
      email: users.email,
      status: users.status,
      phone: users.phone,
      avatarUrl: users.avatarUrl,
      firstName: managerProfiles.firstName,
      lastName: managerProfiles.lastName,
      cpf: managerProfiles.cpf,
      cep: managerProfiles.cep,
      state: managerProfiles.state,
      city: managerProfiles.city,
      neighborhood: managerProfiles.neighborhood,
      address: managerProfiles.address,
    })
    .from(users)
    .innerJoin(managerProfiles, eq(users.id, managerProfiles.userId))
    .where(and(eq(users.role, 'manager'), isNull(users.deletedAt)))
    .orderBy(managerProfiles.firstName)

  // Formatar dados para o componente client
  const initialManagers: Manager[] = managersData.map((m) => ({
    id: m.id,
    email: m.email,
    status: m.status as 'active' | 'inactive',
    phone: m.phone,
    avatarUrl: m.avatarUrl,
    firstName: m.firstName,
    lastName: m.lastName,
    cpf: m.cpf,
    cep: m.cep || '',
    state: m.state || '',
    city: m.city || '',
    neighborhood: m.neighborhood || '',
    address: m.address || '',
  }))

  return <GerentesClient initialManagers={initialManagers} />
}
