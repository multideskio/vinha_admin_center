/**
 * @fileoverview Layout principal para o painel da igreja.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import type { Metadata } from 'next'
import { IgrejaSidebar } from './_components/sidebar'
import { IgrejaHeader } from './_components/header'
import { validateRequest } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Vinha Igreja Center',
  description: 'Painel da Igreja para Vinha Ministérios',
}

export default async function ChurchLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  const { user } = await validateRequest()

  if (!user || user.role !== 'church_account') {
    return redirect('/auth/login')
  }

  const userName = user.email?.split('@')[0] || 'Usuario'
  const userFallback = userName.substring(0, 2).toUpperCase()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <IgrejaSidebar />
      <div className="flex flex-col">
        <IgrejaHeader userName={userName} userEmail={user.email} userFallback={userFallback} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
