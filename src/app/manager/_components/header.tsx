'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Search,
  User,
  LifeBuoy,
  LogOut,
  PanelLeft,
  LayoutDashboard,
  UserCog,
  Church,
  Settings,
  ArrowRightLeft,
  Handshake,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/shared/Logo'
import { useState } from 'react'
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
import { handleLogout } from '@/actions/logout'
import { sanitizeText } from '@/lib/sanitize'

const menuItems = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/manager/supervisores', label: 'Supervisores', icon: UserCog },
  { href: '/manager/pastores', label: 'Pastores', icon: User },
  { href: '/manager/igrejas', label: 'Igrejas', icon: Church },
  { href: '/manager/transacoes', label: 'Transações', icon: ArrowRightLeft },
  { href: '/manager/contribuicoes', label: 'Contribuições', icon: Handshake },
]

const settingsItem = {
  href: '/manager/perfil',
  label: 'Meu Perfil',
  icon: Settings,
}

type HeaderProps = {
  userName: string
  userEmail: string
  userFallback: string
  avatarUrl?: string
  companyLogo?: string
  companyName?: string
}

export function ManagerHeader({
  userName,
  userEmail,
  userFallback,
  avatarUrl,
  companyLogo,
  companyName,
}: HeaderProps) {
  const [logoError, setLogoError] = useState(false)

  const handleLogoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('User logout initiated:', userEmail)
      const result = await handleLogout()
      if (result.success) {
        console.log('User logout successful')
        window.location.href = '/auth/login'
      } else {
        throw new Error('Falha ao fazer logout')
      }
    } catch (error) {
      console.error('Logout error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer logout'
      alert(errorMessage)
    }
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 shadow-sm">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden border-2 hover:bg-videira-blue/10"
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Alternar menu de navegação</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Menu principal com links para todas as seções do painel gerente
          </SheetDescription>

          {/* Header Mobile com gradiente */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 videira-gradient opacity-90" />
            <div className="relative z-10 flex h-16 items-center px-6">
              <Link href="/manager/dashboard" className="flex items-center gap-3 group">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 shadow-lg">
                  {companyLogo && !logoError ? (
                    <Image
                      src={companyLogo}
                      alt="Logo"
                      width={24}
                      height={24}
                      className="h-6 w-auto object-contain"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <Logo className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <span className="text-base font-bold text-white drop-shadow-lg">
                    {companyName || 'Vinha Ministérios'}
                  </span>
                  <p className="text-xs text-white/80 font-medium">Painel Gerente</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Menu Mobile */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-videira-blue/10 transition-all font-medium"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pb-2">
                Conta
              </p>
              <Link
                href={settingsItem.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all font-medium"
              >
                <settingsItem.icon className="h-5 w-5" />
                {settingsItem.label}
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Procurar..."
              className="w-full appearance-none bg-background pl-9 border-2 focus:border-videira-blue shadow-none md:w-2/3 lg:w-1/3"
            />
          </div>
        </form>
      </div>
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-videira-blue/10">
            <Avatar className="h-9 w-9 ring-2 ring-videira-blue/30 hover:ring-videira-blue/50 transition-all">
              <AvatarImage
                src={avatarUrl || 'https://placehold.co/36x36.png'}
                alt={`@${userName}`}
                data-ai-hint="user avatar"
              />
              <AvatarFallback className="bg-videira-blue/10 text-videira-blue font-semibold">
                {userFallback}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Alternar menu do usuário</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">
                Bem-vindo, {sanitizeText(userName)}!
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {sanitizeText(userEmail)}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/manager/perfil">
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/manager/ajuda">
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>Ajuda</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form onSubmit={handleLogoutSubmit}>
            <button type="submit" className="w-full">
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
