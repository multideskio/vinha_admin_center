/**
 * @fileoverview Layout principal para o painel da igreja.
 * @version 2.0
 * @date 2025-01-28
 * @author Sistema de Padronização
 */

import type { Metadata } from 'next'
import { validateRequest } from '@/lib/jwt'
import { redirect } from 'next/navigation'
import { getCompanySettings } from '@/lib/company'
import { RoleLayout } from '@/components/role-layout'
// Configuração dos itens de menu da igreja
const menuItems = [
  { href: '/igreja/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/igreja/transacoes', label: 'Transações', icon: 'ArrowRightLeft' },
  { href: '/igreja/contribuir', label: 'Contribuir', icon: 'Handshake' },
]

const settingsItem = {
  href: '/igreja/perfil',
  label: 'Meu Perfil',
  icon: 'Settings',
}

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
  const { user } = await validateRequest()

  // Suporte para ambas as roles (church_account e igreja) para compatibilidade
  if (!user || user.role !== 'church_account') {
    return redirect('/auth/login')
  }

  return (
    <RoleLayout
      user={user}
      role="igreja"
      menuItems={menuItems}
      settingsItem={settingsItem}
      basePath="/igreja"
    >
      {children}
    </RoleLayout>
  )
}
