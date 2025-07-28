
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { regions } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";
const MOCK_USER_ID = "c33e9e6a-5694-49e4-9e8a-83849f87d466";

const regionSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export async function GET() {
  try {
    const allRegions = await db
      .select()
      .from(regions)
      .where(and(eq(regions.companyId, MOCK_COMPANY_ID), isNull(regions.deletedAt)));

    return NextResponse.json({ regions: allRegions });
  } catch (error) {
    console.error("Erro ao buscar regiões:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const validatedData = regionSchema.parse(body);
  
      const newRegion = await db.insert(regions).values({
        ...validatedData,
        companyId: MOCK_COMPANY_ID,
      }).returning();
  
      return NextResponse.json({ success: true, region: newRegion[0] }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar região:", error);
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
