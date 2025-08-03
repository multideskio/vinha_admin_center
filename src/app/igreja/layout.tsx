
import type { Metadata } from 'next';
import { IgrejaSidebar } from './_components/sidebar';
import { IgrejaHeader } from './_components/header';
import { validateRequest } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { churchProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Vinha Igreja Center',
  description: 'Painel da Igreja para Vinha Ministérios',
};

export default async function ChurchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();

  if (!user) {
    return redirect('/auth/login');
  }

  let userName = 'Igreja';
  let userFallback = 'IG';
  let userEmail = 'igreja@vinha.com';
  
  if (user) {
    const [profile] = await db.select().from(churchProfiles).where(eq(churchProfiles.userId, user.id));
    userName = profile?.nomeFantasia || 'Igreja';
    userFallback = profile?.nomeFantasia?.substring(0, 2) || 'IG';
    userEmail = user.email;
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <IgrejaSidebar />
      <div className="flex flex-col">
        <IgrejaHeader userName={userName} userEmail={userEmail} userFallback={userFallback} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
