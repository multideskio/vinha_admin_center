
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  );

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

  return (
    <div className="hidden border-r bg-muted/40 md:block sticky top-0 h-screen">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/manager/dashboard" className="flex items-center gap-2 font-semibold">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo" className="h-6 w-6 object-contain" />
            ) : (
              <Logo className="h-6 w-6 text-primary" />
            )}
            <span className="">{companyName || 'Vinha Ministérios'}</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  (pathname === item.href || (item.href !== '/manager/dashboard' && pathname.startsWith(item.href))) &&
                    'bg-muted text-primary'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <Link
                    href={settingsItem.href}
                    className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    pathname.startsWith(settingsItem.href) && 'bg-muted text-primary'
                    )}
                >
                    <settingsItem.icon className="h-4 w-4" />
                    {settingsItem.label}
                </Link>
            </nav>
        </div>
      </div>
    </div>
  );
}
