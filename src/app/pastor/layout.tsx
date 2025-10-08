/**
 * @fileoverview Layout principal para o painel do pastor.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import type { Metadata } from 'next'
import { PastorSidebar } from './_components/sidebar'
import { PastorHeader } from './_components/header'
import { validateRequest } from '@/lib/jwt'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Vinha Pastor Center',
  description: 'Painel do Pastor para Vinha Ministérios',
}

export default async function PastorLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'pastor') {
    redirect('/auth/login')
  }

  const userName = user.email?.split('@')[0] || ''
  const userFallback = userName.slice(0, 2).toUpperCase()

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <PastorSidebar />
      <div className="flex flex-col">
        <PastorHeader userName={userName} userEmail={user.email} userFallback={userFallback} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
