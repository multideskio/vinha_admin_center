'use client'

import Link from 'next/link'
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
  companyLogo?: string
  companyName?: string
}

export function ManagerHeader({ userName, userEmail, userFallback, avatarUrl, companyLogo, companyName }: HeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            <Link
              href="/manager/dashboard"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="h-6 w-6 object-contain" />
              ) : (
                <Logo className="h-6 w-6 text-primary" />
              )}
              <span className="sr-only">{companyName || 'Vinha Ministérios'}</span>
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
          <Button variant="secondary" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={avatarUrl || 'https://placehold.co/32x32.png'}
                alt={`@${userName}`}
                data-ai-hint="user avatar"
              />
              <AvatarFallback>{userFallback}</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Bem vindo {sanitizeText(userName)}!</p>
              <p className="text-xs leading-none text-muted-foreground">{sanitizeText(userEmail)}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/manager/perfil">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/ajuda">
              <LifeBuoy className="mr-2 h-4 w-4" />
              <span>Ajuda</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={handleLogout}>
            <button type="submit" className="w-full">
              <DropdownMenuItem>
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
