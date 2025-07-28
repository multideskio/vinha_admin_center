import type { Metadata } from 'next';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Vinha Admin Center',
  description: 'Painel de administração para Vinha Ministérios',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center border-b bg-background/80 px-4 backdrop-blur-sm md:hidden">
          <SidebarTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
            </Button>
          </SidebarTrigger>
          <h2 className="ml-4 text-lg font-semibold">Vinha Ministérios</h2>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
