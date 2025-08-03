
import type { Metadata } from 'next';
import { SupervisorSidebar } from './_components/sidebar';
import { SupervisorHeader } from './_components/header';
import { validateRequest } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { supervisorProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Vinha Supervisor Center',
  description: 'Painel de Supervisor para Vinha Ministérios',
};

export default async function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();

   if (!user) {
    return redirect('/auth/login');
  }

  let userName = 'Supervisor';
  let userFallback = 'SU';
  let userEmail = 'supervisor@vinha.com';
  
  if (user) {
    const [profile] = await db.select().from(supervisorProfiles).where(eq(supervisorProfiles.userId, user.id));
    userName = profile?.firstName || 'Supervisor';
    userFallback = (profile?.firstName?.[0] || '') + (profile?.lastName?.[0] || '');
    userEmail = user.email;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SupervisorSidebar />
      <div className="flex flex-col">
        <SupervisorHeader userName={userName} userEmail={userEmail} userFallback={userFallback} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
