/**
* @fileoverview Rota da API para gerenciar regiões.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { regions } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import { validateRequest } from '@/lib/auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const regionSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function GET(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

  try {
    const url = new URL(request.url);
    const minimal = url.searchParams.get('minimal') === 'true';

    if (minimal) {
        const allRegions = await db
            .select({ id: regions.id, name: regions.name })
            .from(regions)
            .where(and(eq(regions.companyId, COMPANY_ID), isNull(regions.deletedAt)))
            .orderBy(desc(regions.updatedAt));
        return NextResponse.json({ regions: allRegions });
    }

    const allRegions = await db
      .select()
      .from(regions)
      .where(and(eq(regions.companyId, COMPANY_ID), isNull(regions.deletedAt)))
      .orderBy(desc(regions.updatedAt));
      
    return NextResponse.json({ regions: allRegions });

  } catch (error: any) {
    console.error("Erro ao buscar regiões:", error);
    return NextResponse.json({ error: "Erro ao buscar regiões", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    try {
      const body = await request.json();
      const validatedData = regionSchema.parse(body);
  
      const [newRegion] = await db.insert(regions).values({
        ...validatedData,
        companyId: COMPANY_ID,
      }).returning();
  
      return NextResponse.json({ success: true, region: newRegion }, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar região:", error);
      return NextResponse.json({ error: "Erro ao criar região", details: error.message }, { status: 500 });
    }
}
