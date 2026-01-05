/**
 * @fileoverview Componente de cabeçalho para o painel da igreja.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

'use client'

import Link from 'next/link'
import {
  Search,
  User,
  LifeBuoy,
  LogOut,
  PanelLeft,
  LayoutDashboard,
  Settings,
  ArrowRightLeft,
  Handshake,
  Grape,
} from 'lucide-react'
import packageJson from '../../../../package.json'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { logoutUser } from '@/actions/auth'

const menuItems = [
  { href: '/igreja/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/igreja/transacoes', label: 'Transações', icon: ArrowRightLeft },
  { href: '/igreja/contribuir', label: 'Contribuir', icon: Handshake },
]

const settingsItem = {
  href: '/igreja/perfil',
  label: 'Meu Perfil',
  icon: Settings,
}

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
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

type HeaderProps = {
  userName: string
  userEmail: string
  userFallback: string
  avatarUrl?: string
}

export function IgrejaHeader({
  userName,
  userEmail,
  userFallback,
  avatarUrl,
}: HeaderProps): JSX.Element {
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
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          {/* Mobile Header com Gradiente */}
          <div className="relative overflow-hidden rounded-xl mb-4 -mx-6 -mt-6 p-4">
            <div className="absolute inset-0 videira-gradient opacity-90" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 shadow-lg">
                <Grape className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-white drop-shadow-lg">
                  Vinha Ministérios
                </span>
                <p className="text-xs text-white/80 font-medium">
                  Painel Igreja - v{packageJson.version}
                </p>
              </div>
            </div>
          </div>
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="/igreja/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Grape className="h-6 w-6 text-primary" />
              <span className="sr-only">Vinha Ministérios</span>
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
      <div className="flex-1">
        <form>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Procurar..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-auto"
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
              <AvatarFallback className="bg-videira-blue/10 text-videira-blue font-bold">
                {userFallback}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
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
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Ajuda</span>
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
    </header>
  )
}
