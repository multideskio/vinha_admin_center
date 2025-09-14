/**
 * @fileoverview Layout principal para o painel de gerente.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import type { Metadata } from 'next'
import { ManagerSidebar } from './_components/sidebar'
import { ManagerHeader } from './_components/header'
import { validateRequest } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Vinha Gerente Center',
  description: 'Painel de Gerente para Vinha Ministérios',
}

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  const { user } = await validateRequest()

  if (!user || user.role !== 'manager') {
    return redirect('/auth/login')
  }

  const userName = user.email?.split('@')[0] || 'Usuario'
  const userFallback = userName.substring(0, 2).toUpperCase()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <ManagerSidebar />
      <div className="flex flex-col">
        <ManagerHeader userName={userName} userEmail={user.email} userFallback={userFallback} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
