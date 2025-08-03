
import type { Metadata } from 'next';
import { ManagerSidebar } from './_components/sidebar';
import { ManagerHeader } from './_components/header';
import { validateRequest } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { managerProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Vinha Gerente Center',
  description: 'Painel de Gerente para Vinha Ministérios',
};

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();
  
  /*
  if (!user) {
    return redirect('/auth/login');
  }
  */

  let userName = 'Gerente';
  let userFallback = 'GE';
  let userEmail = 'gerente@vinha.com';
  
  if (user) {
    const [profile] = await db.select().from(managerProfiles).where(eq(managerProfiles.userId, user.id));
    userName = profile?.firstName || 'Gerente';
    userFallback = (profile?.firstName?.[0] || '') + (profile?.lastName?.[0] || '');
    userEmail = user.email;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <ManagerSidebar />
      <div className="flex flex-col">
        <ManagerHeader userName={userName} userEmail={userEmail} userFallback={userFallback} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
