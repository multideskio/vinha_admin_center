/**
 * @fileoverview Layout principal para o painel de administrador.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import type { Metadata } from 'next'
import { AppSidebar } from './_components/sidebar'
import { AdminHeader } from './_components/header'
import { validateRequest } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { users, adminProfiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCompanySettings } from '@/lib/company'

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanySettings()
  return {
    title: company?.name || 'Vinha Admin Center',
    description: `Painel de administração para ${company?.name || 'Vinha Ministérios'}`,
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  const { user } = await validateRequest()

  if (!user || user.role !== 'admin') {
    return redirect('/auth/login')
  }

  const [userData, company] = await Promise.all([
    db
      .select({
        avatarUrl: users.avatarUrl,
        firstName: adminProfiles.firstName,
        lastName: adminProfiles.lastName,
      })
      .from(users)
      .leftJoin(adminProfiles, eq(users.id, adminProfiles.userId))
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
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <AppSidebar companyLogo={company?.logoUrl || undefined} companyName={company?.name || undefined} />
      <div className="flex flex-col">
        <AdminHeader
          userName={userName}
          userEmail={user.email}
          userFallback={userFallback}
          avatarUrl={userData?.avatarUrl || undefined}
          companyLogo={company?.logoUrl || undefined}
          companyName={company?.name || undefined}
        />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
