/**
* @fileoverview Layout principal para o painel do pastor.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import type { Metadata } from 'next';
import { PastorSidebar } from './_components/sidebar';
import { PastorHeader } from './_components/header';
import { validateRequest } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { pastorProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Vinha Pastor Center',
  description: 'Painel do Pastor para Vinha Ministérios',
};

export default async function PastorLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const { user } = await validateRequest();

  if (!user || user.role !== 'pastor') {
    return redirect('/auth/login');
  }

  let userName = 'Pastor';
  let userFallback = 'PA';
  let userEmail = user.email;
  
  if (user) {
    const [profile] = await db.select().from(pastorProfiles).where(eq(pastorProfiles.userId, user.id));
    if(profile) {
      userName = profile.firstName || 'Pastor';
      userFallback = (profile.firstName?.[0] || '') + (profile.lastName?.[0] || '');
    }
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <PastorSidebar />
      <div className="flex flex-col">
        <PastorHeader userName={userName} userEmail={userEmail} userFallback={userFallback} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
