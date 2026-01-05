/**
 * @fileoverview Componente de header padronizado para todos os painéis
 * @version 1.0
 * @date 2025-01-28
 * @author Sistema de Padronização
 */

'use client'

import Link from 'next/link'
import NextImage from 'next/image'
import {
  Search,
  User,
  LifeBuoy,
  LogOut,
  PanelLeft,
  MapPin,
  History,
  LayoutDashboard,
  Church,
  Settings,
  ArrowRightLeft,
  Handshake,
  Users,
  Building,
  CreditCard,
  FileText,
  UserCheck,
  Shield,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Bell,
  Mail,
  Phone,
  Globe,
  Lock,
  Key,
  Database,
  Server,
  Cloud,
  Zap,
  Activity,
  Monitor,
  Home,
  Menu,
  Edit,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Share,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Grid,
  List,
  Table,
  Image,
  File,
  Folder,
  Archive,
  Package,
  Box,
  Layers,
  Move,
  RefreshCw,
  Power,
  LogIn,
  UserPlus,
  UserMinus,
  UserX,
  Users2,
  Crown,
  Award,
  Medal,
  Trophy,
  Target,
  Crosshair,
  Focus,
  Compass,
  Navigation,
  Map,
  Route,
  Car,
  Truck,
  Bus,
  Bike,
  Plane,
  Train,
  Ship,
  Rocket,
  Moon,
  Sun,
  CloudRain,
  Umbrella,
  Thermometer,
  Wind,
  Droplets,
  Flame,
  Battery,
  Plug,
  Lightbulb,
  Clock,
  Timer,
  Watch,
  Hourglass,
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { logoutUser } from '@/actions/auth'
import { MenuItem } from './standardized-sidebar'
import { GlobalSearch } from './global-search'

// Mapeamento de ícones para serialização Server/Client (mesmo do sidebar)
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  User,
  Church,
  Settings,
  ArrowRightLeft,
  Handshake,
  Users,
  Building,
  MapPin,
  CreditCard,
  FileText,
  UserCheck,
  Shield,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Bell,
  Mail,
  Phone,
  Globe,
  Lock,
  Key,
  Database,
  Server,
  Cloud,
  Zap,
  Activity,
  Monitor,
  Home,
  Search,
  Menu,
  Edit,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  Share,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Grid,
  List,
  Table,
  Image,
  File,
  Folder,
  Archive,
  Package,
  Box,
  Layers,
  Move,
  RefreshCw,
  Power,
  LogOut,
  LogIn,
  UserPlus,
  UserMinus,
  UserX,
  Users2,
  Crown,
  Award,
  Medal,
  Trophy,
  Target,
  Crosshair,
  Focus,
  Compass,
  Navigation,
  Map,
  Route,
  Car,
  Truck,
  Bus,
  Bike,
  Plane,
  Train,
  Ship,
  Rocket,
  Moon,
  Sun,
  CloudRain,
  Umbrella,
  Thermometer,
  Wind,
  Droplets,
  Flame,
  Battery,
  Plug,
  Lightbulb,
  Clock,
  Timer,
  Watch,
  Hourglass,
  LifeBuoy,
  History,
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

export interface StandardizedHeaderProps {
  userName: string
  userEmail: string
  userFallback: string
  avatarUrl?: string | null
  companyLogo?: string | null
  companyName?: string | null
  basePath: string
  menuItems: MenuItem[]
  settingsItem: MenuItem
  role: string
}

export function StandardizedHeader({
  userName,
  userEmail,
  userFallback,
  avatarUrl,
  companyLogo,
  companyName = 'Vinha Ministérios',
  basePath,
  menuItems,
  settingsItem,
  role,
}: StandardizedHeaderProps): JSX.Element {
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Failed to load company logo in header:', companyLogo)
    e.currentTarget.style.display = 'none'
  }

  // Menu items específicos por role para dropdown
  const getDropdownMenuItems = () => {
    const commonItems = [
      { href: `${basePath}/perfil`, label: 'Perfil', icon: 'User' },
      { href: `${basePath}/ajuda`, label: 'Ajuda', icon: 'LifeBuoy' },
    ]

    // Admin tem itens extras
    if (role === 'admin') {
      return [
        ...commonItems.slice(0, 1), // Perfil
        { href: `${basePath}/roadmap`, label: 'Roadmap', icon: 'MapPin' },
        { href: `${basePath}/changelog`, label: 'Changelog', icon: 'History' },
        ...commonItems.slice(1), // Ajuda
      ]
    }

    return commonItems
  }

  const dropdownItems = getDropdownMenuItems()

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      {/* Menu Mobile */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <nav className="grid gap-2 text-lg font-medium">
            {/* Logo Mobile */}
            <Link
              href={`${basePath}/dashboard`}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              {companyLogo ? (
                <>
                  <NextImage
                    src={companyLogo}
                    alt={`Logo ${companyName}`}
                    width={24}
                    height={24}
                    className="h-6 object-contain"
                    onError={handleLogoError}
                  />
                  <Logo className="h-6 w-6 text-primary hidden" />
                </>
              ) : (
                <Logo className="h-6 w-6 text-primary" />
              )}
              <span className="sr-only">{companyName}</span>
            </Link>

            {/* Menu Items Mobile */}
            {menuItems.map((item) => {
              const IconComponent = iconMap[item.icon] || LayoutDashboard
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
                >
                  <IconComponent className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}

            {/* Settings Item Mobile */}
            <Link
              href={settingsItem.href}
              className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              {(() => {
                const IconComponent = iconMap[settingsItem.icon] || Settings
                return <IconComponent className="h-5 w-5" />
              })()}
              {settingsItem.label}
            </Link>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Barra de Pesquisa Global */}
      <GlobalSearch role={role} className="flex-1" />

      {/* Toggle de Tema */}
      <ThemeToggle />

      {/* Menu do Usuário */}
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

          {/* Menu Items Dinâmicos */}
          {dropdownItems.map((item) => {
            const IconComponent = iconMap[item.icon] || User
            return (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>
                  <IconComponent className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          {/* Logout */}
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
