/**
 * @fileoverview Layout principal para o painel de supervisor.
 * @version 2.1
 * @date 2025-11-06
 * @author Sistema de Padronização
 */

import type { Metadata } from 'next'
import { SupervisorSidebar } from './_components/sidebar'
import { SupervisorHeader } from './_components/header'
import { validateRequest } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { db } from '@/db/drizzle'
import { users, supervisorProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCompanySettings } from '@/lib/company'
import { ErrorBoundary } from '@/components/error-boundary'

// Força renderização dinâmica para páginas autenticadas
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanySettings()
  return {
    title: company?.name ? `${company.name} - Supervisor Center` : 'Vinha Supervisor Center',
    description: `Painel de Supervisor para ${company?.name || 'Vinha Ministérios'}`,
  }
}

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  // ✅ CORRIGIDO BUG #8: Removido try-catch desnecessário
  // redirect() lança NEXT_REDIRECT como comportamento normal, não deve ser capturado
  const { user } = await validateRequest()

  if (!user || user.role !== 'supervisor') {
    redirect('/auth/login')
  }

  const [userData, company] = await Promise.all([
    db
      .select({
        avatarUrl: users.avatarUrl,
        firstName: supervisorProfiles.firstName,
        lastName: supervisorProfiles.lastName,
      })
      .from(users)
      .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .where(eq(users.id, user.id))
      .limit(1)
      .then((res) => res[0]),
    getCompanySettings(),
  ])

  const userName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName}`
    : user.email?.split('@')[0] || 'User'
  const userFallback = userData?.firstName
    ? `${userData.firstName[0]}${userData.lastName?.[0] || ''}`
    : userName.substring(0, 2).toUpperCase()

  return (
    <ErrorBoundary>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <SupervisorSidebar />
        <div className="flex flex-col">
          <SupervisorHeader
            userName={userName}
            userEmail={user.email}
            userFallback={userFallback}
            avatarUrl={userData?.avatarUrl || undefined}
          />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
