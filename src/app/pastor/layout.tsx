/**
 * @fileoverview Layout principal para o painel do pastor.
 * @version 2.0
 * @date 2025-01-28
 * @author Sistema de Padronização
 */

import type { Metadata } from 'next'
import { validateRequest } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { getCompanySettings } from '@/lib/company'
import { RoleLayout } from '@/components/role-layout'
// Configuração dos itens de menu do pastor
const menuItems = [
  { href: '/pastor/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/pastor/transacoes', label: 'Transações', icon: 'ArrowRightLeft' },
  { href: '/pastor/contribuir', label: 'Contribuir', icon: 'Handshake' },
]

const settingsItem = {
  href: '/pastor/perfil',
  label: 'Meu Perfil',
  icon: 'Settings',
}

export async function generateMetadata(): Promise<Metadata> {
  const company = await getCompanySettings()
  return {
    title: company?.name ? `${company.name} - Pastor Center` : 'Vinha Pastor Center',
    description: `Painel do Pastor para ${company?.name || 'Vinha Ministérios'}`,
  }
}

export default async function PastorLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<JSX.Element> {
  const { user } = await validateRequest()
  
  if (!user || user.role !== 'pastor') {
    return redirect('/auth/login')
  }

  return (
    <RoleLayout
      user={user}
      role="pastor"
      menuItems={menuItems}
      settingsItem={settingsItem}
      basePath="/pastor"
    >
      {children}
    </RoleLayout>
  )
}
