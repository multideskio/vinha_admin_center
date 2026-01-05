/**
 * @fileoverview Layout principal para o painel da igreja.
 * @version 2.1
 * @date 2025-11-06
 * @author Sistema de Padronização
 */

import type { Metadata } from 'next'
import { IgrejaSidebar } from './_components/sidebar'
import { IgrejaHeader } from './_components/header'
import { validateRequest } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { db } from '@/db/drizzle'
import { users, churchProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCompanySettings } from '@/lib/company'
import { ErrorBoundary } from '@/components/error-boundary'

// Força renderização dinâmica para páginas autenticadas
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanySettings()
  return {
    title: company?.name ? `${company.name} - Igreja Center` : 'Vinha Igreja Center',
    description: `Painel da Igreja para ${company?.name || 'Vinha Ministérios'}`,
  }
}

export default async function ChurchLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  // ✅ CORRIGIDO BUG #8: Removido try-catch desnecessário
  // redirect() lança NEXT_REDIRECT como comportamento normal, não deve ser capturado
  const { user } = await validateRequest()

  // Suporte para ambas as roles (church_account e igreja) para compatibilidade
  if (!user || user.role !== 'church_account') {
    redirect('/auth/login')
  }

  const [userData, company] = await Promise.all([
    db
      .select({
        avatarUrl: users.avatarUrl,
        nomeFantasia: churchProfiles.nomeFantasia,
        razaoSocial: churchProfiles.razaoSocial,
      })
      .from(users)
      .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(eq(users.id, user.id))
      .limit(1)
      .then((res) => res[0]),
    getCompanySettings(),
  ])

  const churchName =
    userData?.nomeFantasia || userData?.razaoSocial || user.email?.split('@')[0] || 'Igreja'
  const userFallback = userData?.nomeFantasia
    ? userData.nomeFantasia.substring(0, 2).toUpperCase()
    : 'IG'

  return (
    <ErrorBoundary>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <IgrejaSidebar />
        <div className="flex flex-col">
          <IgrejaHeader
            userName={churchName}
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
