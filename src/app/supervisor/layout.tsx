/**
 * @fileoverview Layout principal para o painel de supervisor.
 * @version 2.0
 * @date 2025-01-28
 * @author Sistema de Padronização
 */

import type { Metadata } from 'next'
import { validateRequest } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { getCompanySettings } from '@/lib/company'
import { RoleLayout } from '@/components/role-layout'
// Configuração dos itens de menu do supervisor
const menuItems = [
  { href: '/supervisor/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/supervisor/pastores', label: 'Pastores', icon: 'User' },
  { href: '/supervisor/igrejas', label: 'Igrejas', icon: 'Church' },
  { href: '/supervisor/transacoes', label: 'Transações', icon: 'ArrowRightLeft' },
  { href: '/supervisor/contribuicoes', label: 'Contribuições', icon: 'Handshake' },
]

const settingsItem = {
  href: '/supervisor/perfil',
  label: 'Meu Perfil',
  icon: 'Settings',
}

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
  const { user } = await validateRequest()

  if (!user || user.role !== 'supervisor') {
    return redirect('/auth/login')
  }

  return (
    <RoleLayout
      user={user}
      role="supervisor"
      menuItems={menuItems}
      settingsItem={settingsItem}
      basePath="/supervisor"
    >
      {children}
    </RoleLayout>
  )
}
