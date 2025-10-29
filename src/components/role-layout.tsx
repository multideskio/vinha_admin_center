/**
 * @fileoverview Componente wrapper de layout padronizado para todos os painéis
 * @version 1.0
 * @date 2025-01-28
 * @author Sistema de Padronização
 */

'use client'

import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { StandardizedSidebar, MenuItem } from './standardized-sidebar'
import { StandardizedHeader } from './standardized-header'
import { ErrorBoundary } from './error-boundary'
import { useLayoutData } from '@/hooks/use-layout-data'

export interface RoleLayoutProps {
  children: ReactNode
  user: {
    id: string
    email: string
    role: string
  }
  role: 'admin' | 'manager' | 'supervisor' | 'pastor' | 'igreja'
  menuItems: MenuItem[]
  settingsItem: MenuItem
  basePath: string
}

export function RoleLayout({
  children,
  user,
  role,
  menuItems,
  settingsItem,
  basePath,
}: RoleLayoutProps): JSX.Element {
  // Carrega dados do layout usando o hook centralizado
  const { data: layoutData, loading, error } = useLayoutData(user.id, user.role)

  // Se houver erro crítico, redireciona para login
  if (error && error.message.includes('não encontrados')) {
    console.error('Erro crítico no layout:', error)
    redirect('/auth/login')
  }

  // Estados de loading
  if (loading || !layoutData) {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Sidebar Skeleton */}
        <div className="hidden border-r bg-muted/40 md:block sticky top-0 h-screen">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex-1 p-4 space-y-2">
              {Array.from({ length: menuItems.length }).map((_, i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex flex-col">
          <div className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
            <div className="flex-1 h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </div>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <div className="h-32 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </main>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Sidebar Padronizada */}
        <StandardizedSidebar
          menuItems={menuItems}
          settingsItem={settingsItem}
          companyLogo={layoutData.company.logoUrl}
          companyName={layoutData.company.name}
          basePath={basePath}
        />

        {/* Conteúdo Principal */}
        <div className="flex flex-col">
          {/* Header Padronizado */}
          <StandardizedHeader
            userName={layoutData.displayName}
            userEmail={user.email}
            userFallback={layoutData.userFallback}
            avatarUrl={layoutData.user.avatarUrl}
            companyLogo={layoutData.company.logoUrl}
            companyName={layoutData.company.name}
            basePath={basePath}
            menuItems={menuItems}
            settingsItem={settingsItem}
            role={role}
          />

          {/* Área de Conteúdo */}
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}