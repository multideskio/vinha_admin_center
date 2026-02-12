/**
 * @fileoverview Layout principal para o painel de gerente.
 * @version 1.3
 * @date 2024-08-07
 * @author PH
 */

import type { Metadata } from 'next'
import { ManagerSidebar } from './_components/sidebar'
import { ManagerHeader } from './_components/header'
import { validateRequest } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { db } from '@/db/drizzle'
import { users, managerProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCompanySettings } from '@/lib/company'
import { ErrorBoundary } from '@/components/error-boundary'
import { ImpersonationBanner } from '@/components/ui/impersonation-banner'
import { checkImpersonationStatus } from '@/actions/impersonation'

// Força renderização dinâmica para páginas autenticadas
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanySettings()
  return {
    title: company?.name || 'Vinha Admin Center',
    description: `Painel de gerente para ${company?.name || 'Vinha Ministérios'}`,
  }
}

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  // ✅ CORRIGIDO BUG #8: Removido try-catch desnecessário
  // redirect() lança NEXT_REDIRECT como comportamento normal, não deve ser capturado
  const { user } = await validateRequest()

  if (!user || user.role !== 'manager') {
    redirect('/auth/login')
  }

  const [userData, company] = await Promise.all([
    db
      .select({
        avatarUrl: users.avatarUrl,
        firstName: managerProfiles.firstName,
        lastName: managerProfiles.lastName,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(eq(users.id, user.id))
      .limit(1)
      .then((res) => res[0]),
    getCompanySettings(),
  ])

  // Verificar se está em modo impersonation
  const { isImpersonating } = await checkImpersonationStatus()

  const userName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName}`
    : user.email?.split('@')[0] || 'User'
  const userFallback = userData?.firstName
    ? `${userData.firstName[0]}${userData.lastName?.[0] || ''}`
    : userName.substring(0, 2).toUpperCase()

  return (
    <ErrorBoundary>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <ManagerSidebar
          companyLogo={company?.logoUrl || undefined}
          companyName={company?.name || undefined}
        />
        <div className="flex flex-col">
          <ManagerHeader
            userName={userName}
            userEmail={user.email}
            userFallback={userFallback}
            avatarUrl={userData?.avatarUrl || undefined}
            companyLogo={company?.logoUrl || undefined}
            companyName={company?.name || undefined}
          />
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
            <ImpersonationBanner isImpersonating={isImpersonating} />
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
