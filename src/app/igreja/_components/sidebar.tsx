
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  ArrowRightLeft,
  Handshake,
  Grape,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import packageJson from '../../../../package.json';

const menuItems = [
  { href: '/igreja/dashboard', label: 'Dashboard', icon: LayoutDashboard, gradient: 'cyan' },
  { href: '/igreja/transacoes', label: 'Transações', icon: ArrowRightLeft, gradient: 'blue' },
  { href: '/igreja/contribuir', label: 'Contribuir', icon: Handshake, gradient: 'purple' },
];

const settingsItem = {
  href: '/igreja/perfil',
  label: 'Meu Perfil',
  icon: Settings,
};

export function IgrejaSidebar() {
  const pathname = usePathname();

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
    <div className="hidden border-r bg-gradient-to-b from-background via-muted/20 to-background md:block sticky top-0 h-screen shadow-xl">
      <div className="flex h-full max-h-screen flex-col">
        {/* Header com gradiente Videira */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 videira-gradient opacity-90" />
          <div className="relative z-10 flex h-16 items-center px-6 lg:h-20">
            <Link href="/igreja/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 group-hover:ring-white/50 transition-all shadow-lg">
                <Grape className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-white drop-shadow-lg">
                  Vinha Ministérios
                </span>
                <p className="text-xs text-white/80 font-medium">Painel Igreja - v{packageJson.version}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Menu principal */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/igreja/dashboard' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-active={isActive}
                  className={cn(
                    'group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                    'border-l-3 border-l-transparent',
                    'hover:shadow-sm hover:scale-[1.02]',
                    getGradientClass(item.gradient),
                    isActive ? 'font-semibold border-l-4' : 'font-medium'
                  )}
                >
                  <item.icon 
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      getIconColor(item.gradient, isActive)
                    )} 
                  />
                  <span className={cn(
                    'text-base transition-colors',
                    isActive ? getIconColor(item.gradient, true) : 'text-muted-foreground group-hover:text-foreground'
                  )}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-current animate-pulse" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer com Perfil */}
        <div className="mt-auto border-t border-border/40 p-4 bg-muted/30">
          <nav className="px-3 space-y-1">
            <div className="pb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Conta
              </p>
            </div>
            <Link
              href={settingsItem.href}
              data-active={pathname.startsWith(settingsItem.href)}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                'border-l-3 border-l-transparent',
                'hover:shadow-sm hover:bg-primary/10',
                pathname.startsWith(settingsItem.href)
                  ? 'bg-primary/15 border-l-4 border-l-primary font-semibold text-primary'
                  : 'font-medium text-muted-foreground hover:text-foreground'
              )}
            >
              <settingsItem.icon 
                className={cn(
                  'h-5 w-5 transition-all',
                  pathname.startsWith(settingsItem.href) ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )} 
              />
              <span className="text-base">{settingsItem.label}</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
