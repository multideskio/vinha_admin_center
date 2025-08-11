
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { regions } from '@/db/schema';
import { eq, and, isNull, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/api-auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const regionSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

  try {
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

export async function POST(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
      const body = await request.json();
      const validatedData = regionSchema.parse(body);
  
      const newRegion = await db.insert(regions).values({
        ...validatedData,
        companyId: COMPANY_ID,
      }).returning();
  
      return NextResponse.json({ success: true, region: newRegion[0] }, { status: 201 });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar região:", error);
      return NextResponse.json({ error: "Erro ao criar região", details: error.message }, { status: 500 });
    }
}
