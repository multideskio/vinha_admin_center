import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/jwt'
import { db } from '@/db/drizzle'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { UserRole } from '@/lib/types'
import type { DashboardData } from '@/lib/types/dashboard-types'
import { DashboardClient } from './_components/dashboard-client'

/**
 * Dashboard do Administrador - Server Component
 * Faz fetch inicial dos dados no servidor e renderiza componente client
 */
export default async function DashboardPage() {
  // Validar autenticação
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    redirect('/login')
  }

  // Buscar nome do usuário
  const userProfile = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: {
      email: true,
    },
  })

  // Buscar dados iniciais do dashboard
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/v1/dashboard/admin`,
    {
      cache: 'no-store',
    },
  )

  if (!response.ok) {
    throw new Error('Falha ao carregar dados do dashboard')
  }

  const initialData: DashboardData = await response.json()

  // Extrair primeiro nome do email
  const userName = userProfile?.email.split('@')[0] || 'Admin'

  return <DashboardClient initialData={initialData} userName={userName} />
}
