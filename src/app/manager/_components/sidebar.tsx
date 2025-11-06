
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserCog,
  User,
  Church,
  Settings,
  ArrowRightLeft,
  Handshake,
  Grape,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import packageJson from '../../../../package.json';

const menuItems = [
    { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/manager/supervisores', label: 'Supervisores', icon: UserCog },
    { href: '/manager/pastores', label: 'Pastores', icon: User },
    { href: '/manager/igrejas', label: 'Igrejas', icon: Church },
    { href: '/manager/transacoes', label: 'Transações', icon: ArrowRightLeft },
    { href: '/manager/contribuicoes', label: 'Contribuições', icon: Handshake },
];

const settingsItem = {
  href: '/manager/perfil',
  label: 'Meu Perfil',
  icon: Settings,
};

type SidebarProps = {
  companyLogo?: string
  companyName?: string
}

export function ManagerSidebar({ companyLogo, companyName }: SidebarProps) {
  const pathname = usePathname();

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Failed to load company logo:', companyLogo);
    e.currentTarget.style.display = 'none';
  };

  return (
    <div className="hidden border-r bg-gradient-to-b from-background via-muted/20 to-background md:block sticky top-0 h-screen shadow-xl">
      <div className="flex h-full max-h-screen flex-col">
        {/* Header com gradiente Videira */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 videira-gradient opacity-90" />
          <div className="relative z-10 flex h-16 items-center px-6 lg:h-20">
            <Link href="/manager/dashboard" className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm ring-2 ring-white/30 group-hover:ring-white/50 transition-all shadow-lg">
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" className="h-6 w-6 object-contain" onError={handleLogoError} />
                ) : (
                  <Grape className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <span className="text-base font-bold text-white drop-shadow-lg">
                  {companyName || 'Vinha Ministérios'}
                </span>
                <p className="text-xs text-white/80 font-medium">Painel Gerente - v{packageJson.version}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Menu principal */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={pathname === item.href || (item.href !== '/manager/dashboard' && pathname.startsWith(item.href))}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200',
                  'border-l-3 border-l-transparent',
                  'hover:shadow-sm',
                  (pathname === item.href || (item.href !== '/manager/dashboard' && pathname.startsWith(item.href)))
                    ? 'bg-videira-blue/15 border-l-4 border-l-videira-blue font-semibold text-videira-blue hover:bg-videira-blue/20'
                    : 'font-medium text-muted-foreground hover:text-foreground hover:bg-videira-blue/10'
                )}
              >
                <item.icon 
                  className={cn(
                    'h-5 w-5 transition-all',
                    (pathname === item.href || (item.href !== '/manager/dashboard' && pathname.startsWith(item.href)))
                      ? 'text-videira-blue'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )} 
                />
                <span className="text-base">{item.label}</span>
              </Link>
            ))}
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
