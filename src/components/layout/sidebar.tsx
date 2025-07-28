
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Map,
  UserCheck,
  UserCog,
  User,
  Church,
  Settings,
  FileText,
  Building,
  CreditCard,
  Shield,
} from 'lucide-react';

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
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/regioes', label: 'Regiões', icon: Map },
  { href: '/gerentes', label: 'Gerentes', icon: UserCheck },
  { href: '/supervisores', label: 'Supervisores', icon: UserCog },
  { href: '/pastores', label: 'Pastores', icon: User },
  { href: '/igrejas', label: 'Igrejas', icon: Church },
  { href: '/administradores', label: 'Administradores', icon: Shield },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/gateways', label: 'Gateways', icon: CreditCard },
];

const settingsItem = {
  href: '/configuracoes',
  label: 'Configurações',
  icon: Settings,
};

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="none"
      className="group/sidebar w-[250px] border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Logo className="size-7 shrink-0 text-primary" />
          <span className="text-lg font-semibold">Vinha Ministérios</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 overflow-y-auto p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href))
                }
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === settingsItem.href}
            >
              <Link href={settingsItem.href}>
                <settingsItem.icon />
                <span>{settingsItem.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
