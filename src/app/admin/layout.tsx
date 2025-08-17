
/**
* @fileoverview Layout principal para o painel de administrador.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import type { Metadata } from 'next';
import { AppSidebar } from './_components/sidebar';
import { AdminHeader } from './_components/header';
import { validateRequest } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db/drizzle';
import { adminProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';


export const metadata: Metadata = {
  title: 'Vinha Admin Center',
  description: 'Painel de administração para Vinha Ministérios',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const { user } = await validateRequest();

  if (!user || user.role !== 'admin') {
    return redirect('/auth/login');
  }

  const userName = user.email.split('@')[0];
  const userFallback = userName.substring(0, 2).toUpperCase();
  
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <AppSidebar />
      <div className="flex flex-col">
        <AdminHeader userName={userName} userEmail={user.email} userFallback={userFallback} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
            {children}
        </main>
      </div>
    </div>
  );
}
