

'use client';

import Link from 'next/link';
import {
  Search,
  User,
  LifeBuoy,
  LogOut,
  PanelLeft,
  LayoutDashboard,
  Map,
  UserCheck,
  UserCog,
  Church,
  Settings,
  FileText,
  CreditCard,
  Shield,
  ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { logoutUser } from '@/actions/auth';

const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/transacoes', label: 'Transações', icon: ArrowRightLeft },
    { href: '/admin/regioes', label: 'Regiões', icon: Map },
    { href: '/admin/gerentes', label: 'Gerentes', icon: UserCheck },
    { href: '/admin/supervisores', label: 'Supervisores', icon: UserCog },
    { href: '/admin/pastores', label: 'Pastores', icon: User },
    { href: '/admin/igrejas', label: 'Igrejas', icon: Church },
    { href: '/admin/administradores', label: 'Administradores', icon: Shield },
    { href: '/admin/relatorios', label: 'Relatórios', icon: FileText },
    { href: '/admin/gateways', label: 'Gateways', icon: CreditCard },
];
  
const settingsItem = {
    href: '/admin/configuracoes',
    label: 'Configurações',
    icon: Settings,
};

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

type AdminHeaderProps = {
    userName: string;
    userEmail: string;
    userFallback: string;
}

export function AdminHeader({ userName, userEmail, userFallback }: AdminHeaderProps) {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
            <Sheet>
                <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                >
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-2 text-lg font-medium">
                    <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-2 text-lg font-semibold"
                    >
                    <Logo className="h-6 w-6 text-primary" />
                    <span className="sr-only">Vinha Ministérios</span>
                    </Link>
                    {menuItems.map(item => (
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
                        src="https://placehold.co/32x32.png"
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
                        <p className="text-sm font-medium leading-none">
                            Bem vindo {userName}!
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {userEmail}
                        </p>
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
                    <form action={logoutUser}>
                        <button type="submit" className='w-full'>
                            <DropdownMenuItem>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                            </DropdownMenuItem>
                        </button>
                    </form>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
