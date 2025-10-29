/**
 * @fileoverview Componente de sidebar padronizado para todos os painéis
 * @version 1.0
 * @date 2025-01-28
 * @author Sistema de Padronização
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LucideIcon,
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

// Mapeamento de ícones para serialização Server/Client
const iconMap: Record<string, LucideIcon> = {
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
}

export interface MenuItem {
  href: string
  label: string
  icon: string // Mudança: agora usa string em vez de LucideIcon
}

export interface StandardizedSidebarProps {
  menuItems: MenuItem[]
  settingsItem: MenuItem
  companyLogo?: string | null
  companyName?: string | null
  basePath: string
}

export function StandardizedSidebar({
  menuItems,
  settingsItem,
  companyLogo,
  companyName = 'Vinha Ministérios',
  basePath,
}: StandardizedSidebarProps): JSX.Element {
  const pathname = usePathname()

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Failed to load company logo:', companyLogo)
    e.currentTarget.style.display = 'none'
  }

  return (
    <div className="hidden border-r bg-muted/40 md:block sticky top-0 h-screen">
      <div className="flex h-full max-h-screen flex-col gap-2">
        {/* Header com Logo da Empresa */}
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href={`${basePath}/dashboard`} className="flex items-center gap-2 font-semibold">
            {companyLogo ? (
              <>
                <img 
                  src={companyLogo} 
                  alt={`Logo ${companyName}`} 
                  className="h-6 object-contain" 
                  onError={handleLogoError}
                />
                <Logo className="h-6 w-6 text-primary hidden" />
              </>
            ) : (
              <Logo className="h-6 w-6 text-primary" />
            )}
            <span className="truncate">{companyName}</span>
          </Link>
        </div>

        {/* Menu Principal */}
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {menuItems.map((item) => {
              const IconComponent = iconMap[item.icon] || LayoutDashboard
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    (pathname === item.href ||
                      (item.href !== `${basePath}/dashboard` && pathname.startsWith(item.href))) &&
                      'bg-muted text-primary',
                  )}
                >
                  <IconComponent className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Menu de Configurações/Perfil */}
        <div className="mt-auto p-4">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link
              href={settingsItem.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                pathname.startsWith(settingsItem.href) && 'bg-muted text-primary',
              )}
            >
              {(() => {
                const IconComponent = iconMap[settingsItem.icon] || Settings
                return <IconComponent className="h-4 w-4" />
              })()}
              {settingsItem.label}
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}