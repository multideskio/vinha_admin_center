'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  UserCheck,
  UserCog,
  User,
  Church,
  Settings,
  FileText,
  Shield,
  ArrowRightLeft,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/SidebarContext'
import packageJson from '../../../../package.json'

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

const menuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, gradient: 'cyan' },
  { href: '/admin/transacoes', label: 'Transações', icon: ArrowRightLeft, gradient: 'blue' },
  { href: '/admin/regioes', label: 'Regiões', icon: Map, gradient: 'purple' },
  { href: '/admin/gerentes', label: 'Gerentes', icon: UserCheck, gradient: 'cyan' },
  { href: '/admin/supervisores', label: 'Supervisores', icon: UserCog, gradient: 'blue' },
  { href: '/admin/pastores', label: 'Pastores', icon: User, gradient: 'purple' },
  { href: '/admin/igrejas', label: 'Igrejas', icon: Church, gradient: 'cyan' },
  { href: '/admin/administradores', label: 'Administradores', icon: Shield, gradient: 'blue' },
  { href: '/admin/relatorios', label: 'Relatórios', icon: FileText, gradient: 'purple' },
]

const settingsItem = {
  href: '/admin/configuracoes',
  label: 'Configurações',
  icon: Settings,
}

type AppSidebarProps = {
  companyLogo?: string
  companyName?: string
}

export function AppSidebar({ companyLogo, companyName }: AppSidebarProps = {}): JSX.Element {
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()

  const getGradientClass = (gradient: string) => {
    switch (gradient) {
      case 'cyan':
        return 'hover:bg-videira-cyan/10 data-[active=true]:bg-videira-cyan/15 data-[active=true]:border-l-videira-cyan'
      case 'blue':
        return 'hover:bg-videira-blue/10 data-[active=true]:bg-videira-blue/15 data-[active=true]:border-l-videira-blue'
      case 'purple':
        return 'hover:bg-videira-purple/10 data-[active=true]:bg-videira-purple/15 data-[active=true]:border-l-videira-purple'
      default:
        return 'hover:bg-primary/10 data-[active=true]:bg-primary/15'
    }
  }

  const getIconColor = (gradient: string, isActive: boolean) => {
    if (!isActive) return 'text-muted-foreground group-hover:text-foreground'

    switch (gradient) {
      case 'cyan':
        return 'text-videira-cyan'
      case 'blue':
        return 'text-videira-blue'
      case 'purple':
        return 'text-videira-purple'
      default:
        return 'text-primary'
    }
  }

  return (
    <div
      className={cn(
        'hidden border-r border-border/40 md:block sticky top-0 h-screen bg-gradient-to-b from-background via-background to-muted/20 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-[220px] lg:w-[280px]',
      )}
    >
      <div className="flex h-full max-h-screen flex-col">
        {/* Logo Header com Gradiente */}
        <div className="flex h-16 items-center border-b border-border/40 px-6 videira-gradient">
          <Link href="/admin/dashboard" className="flex items-center gap-3 font-bold group">
            {companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogo}
                alt={companyName || 'Logo'}
                width={32}
                height={32}
                className="h-8 object-contain flex-shrink-0"
              />
            ) : (
              <div className="relative flex-shrink-0">
                <Logo className="h-8 w-8 text-white drop-shadow-lg" />
                <Sparkles className="h-3 w-3 text-white/80 absolute -top-1 -right-1" />
              </div>
            )}
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-white text-lg tracking-tight truncate">
                  {companyName || 'Videira Admin'}
                </span>
                <span className="text-white/70 text-xs font-normal flex items-center gap-1.5">
                  Centro de Gestão
                  <span className="inline-flex items-center rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
                    v{packageJson.version}
                  </span>
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Menu Principal */}
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="grid items-start gap-1 px-3">
            {!isCollapsed && (
              <div className="px-3 pb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Menu Principal
                </p>
              </div>
            )}
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive}
                  aria-current={isActive ? 'page' : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl transition-all duration-200',
                    'border-l-3 border-l-transparent',
                    'hover:shadow-sm hover:scale-[1.02]',
                    getGradientClass(item.gradient),
                    isActive ? 'font-semibold border-l-4' : 'font-medium',
                    isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 transition-all duration-200 flex-shrink-0',
                      getIconColor(item.gradient, isActive),
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span
                        className={cn(
                          'text-base transition-colors',
                          isActive
                            ? getIconColor(item.gradient, true)
                            : 'text-muted-foreground group-hover:text-foreground',
                        )}
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-current animate-pulse" />
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Settings no Footer */}
        <div className="mt-auto border-t border-border/40 p-4 bg-muted/30">
          <nav className="px-3 space-y-1">
            {!isCollapsed && (
              <div className="pb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Sistema
                </p>
              </div>
            )}
            <Link
              href="/admin/perfil"
              data-active={pathname === '/admin/perfil'}
              aria-current={pathname === '/admin/perfil' ? 'page' : undefined}
              title={isCollapsed ? 'Meu Perfil' : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl transition-all duration-200',
                'border-l-3 border-l-transparent',
                'hover:shadow-sm hover:bg-videira-blue/10',
                pathname === '/admin/perfil'
                  ? 'bg-videira-blue/15 border-l-4 border-l-videira-blue font-semibold text-videira-blue'
                  : 'font-medium text-muted-foreground hover:text-foreground',
                isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
              )}
            >
              <User
                className={cn(
                  'h-5 w-5 transition-all flex-shrink-0',
                  pathname === '/admin/perfil'
                    ? 'text-videira-blue'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              {!isCollapsed && <span className="text-base">Meu Perfil</span>}
            </Link>
            <Link
              href={settingsItem.href}
              data-active={pathname.startsWith(settingsItem.href)}
              aria-current={pathname.startsWith(settingsItem.href) ? 'page' : undefined}
              title={isCollapsed ? settingsItem.label : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-xl transition-all duration-200',
                'border-l-3 border-l-transparent',
                'hover:shadow-sm hover:bg-primary/10',
                pathname.startsWith(settingsItem.href)
                  ? 'bg-primary/15 border-l-4 border-l-primary font-semibold text-primary'
                  : 'font-medium text-muted-foreground hover:text-foreground',
                isCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3',
              )}
            >
              <settingsItem.icon
                className={cn(
                  'h-5 w-5 transition-all flex-shrink-0',
                  pathname.startsWith(settingsItem.href)
                    ? 'text-primary'
                    : 'text-muted-foreground group-hover:text-foreground',
                )}
              />
              {!isCollapsed && <span className="text-base">{settingsItem.label}</span>}
            </Link>
          </nav>
        </div>
      </div>
    </div>
  )
}
