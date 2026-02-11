/**
 * @fileoverview Componente de cabeçalho para o painel de administrador.
 * @version 1.3
 * @date 2024-08-07
 * @author PH
 */

'use client'

import Link from 'next/link'
import {
  User,
  LifeBuoy,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  Map,
  UserCheck,
  UserCog,
  Church,
  Settings,
  FileText,
  Shield,
  ArrowRightLeft,
  MapPin,
  History,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { logoutUser } from '@/actions/auth'
import { useSidebar } from '@/contexts/SidebarContext'
import { GlobalSearch } from '@/components/global-search'

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/transacoes', label: 'Transações', icon: ArrowRightLeft },
  { href: '/admin/regioes', label: 'Regiões', icon: Map },
  { href: '/admin/gerentes', label: 'Gerentes', icon: UserCheck },
  { href: '/admin/supervisores', label: 'Supervisores', icon: UserCog },
  { href: '/admin/pastores', label: 'Pastores', icon: User },
  { href: '/admin/igrejas', label: 'Igrejas', icon: Church },
  { href: '/admin/administradores', label: 'Administradores', icon: Shield },
  { href: '/admin/relatorios', label: 'Relatórios', icon: FileText },
]

const settingsItem = {
  href: '/admin/configuracoes',
  label: 'Configurações',
  icon: Settings,
}

const Logo = (props: React.SVGProps<SVGSVGElement>): JSX.Element => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22a2.5 2.5 0 0 1-2.5-2.5V18h5v1.5A2.5 2.5 0 0 1 12 22Z" />
    <path d="M12 2v2" />
    <path d="M12 18v-8" />
    <path d="M15 9.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    <path d="M19 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
    <path d="M9 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
  </svg>
)

type AdminHeaderProps = {
  userName: string
  userEmail: string
  userFallback: string
  avatarUrl?: string
  companyLogo?: string
  companyName?: string
}

export function AdminHeader({
  userName,
  userEmail,
  userFallback,
  avatarUrl,
  companyLogo,
  companyName,
}: AdminHeaderProps): JSX.Element {
  const { isCollapsed, toggleSidebar } = useSidebar()

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      {/* Toggle Sidebar Button - Desktop */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="hidden md:flex shrink-0"
        title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
        <span className="sr-only">
          {isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
        </span>
      </Button>

      {/* Mobile Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Abrir menu de navegação</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Menu principal de navegação do sistema administrativo
          </SheetDescription>
          <nav className="grid gap-2 text-lg font-medium">
            <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold">
              {companyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={companyLogo}
                  alt={companyName || 'Logo'}
                  width={24}
                  height={24}
                  className="h-6 object-contain"
                />
              ) : (
                <Logo className="h-6 w-6 text-primary" />
              )}
              <span className="truncate">{companyName || 'Vinha Ministérios'}</span>
            </Link>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <Link
              href={settingsItem.href}
              className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <settingsItem.icon className="h-5 w-5" />
              {settingsItem.label}
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Company Name - Responsive */}
      {/* Removido para evitar duplicação com o sidebar */}

      <div className="flex-1 min-w-0">
        <GlobalSearch role="admin" className="max-w-md" />
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={avatarUrl || undefined}
                  alt={`@${userName}`}
                  data-ai-hint="user avatar"
                />
                <AvatarFallback>{userFallback}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Abrir menu do usuário</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Bem vindo {userName}!</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/perfil">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/roadmap">
                <MapPin className="mr-2 h-4 w-4" />
                <span>Roadmap</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/changelog">
                <History className="mr-2 h-4 w-4" />
                <span>Changelog</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/releases">
                <Package className="mr-2 h-4 w-4" />
                <span>Releases</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/ajuda">
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>Ajuda</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={async () => {
                const result = await logoutUser()
                if (result.success) {
                  window.location.href = '/auth/login'
                }
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
