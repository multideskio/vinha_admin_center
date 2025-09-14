/**
 * @fileoverview Layout principal para o painel de supervisor.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import type { Metadata } from 'next'
import { SupervisorSidebar } from './_components/sidebar'
import { SupervisorHeader } from './_components/header'
import { validateRequest } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Vinha Supervisor Center',
  description: 'Painel de Supervisor para Vinha Ministérios',
}

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  const { user } = await validateRequest()

  if (!user || user.role !== 'supervisor') {
    return redirect('/auth/login')
  }

  const userName = user.email?.split('@')[0] || 'user'
  const userFallback = userName.substring(0, 2).toUpperCase()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SupervisorSidebar />
      <div className="flex flex-col">
        <SupervisorHeader
          userName={userName}
          userEmail={user.email || ''}
          userFallback={userFallback}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
