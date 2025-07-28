
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { regions } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

const MOCK_USER_ID = 'e7a5c32c-15a5-4482-9a60-281b24385348';

const regionSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório.'),
    color: z
      .string()
      .min(7, { message: 'A cor deve estar no formato hexadecimal.' })
      .regex(/^#[0-9a-fA-F]{6}$/, {
        message: 'Cor inválida. Use o formato #RRGGBB.',
      }),
  });

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const body = await request.json();
    const validatedData = regionSchema.parse(body);

    const updatedRegion = await db
      .update(regions)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(regions.id, id))
      .returning();
    
    if(updatedRegion.length === 0) {
        return NextResponse.json({ error: "Região não encontrada." }, { status: 404 });
    }

    return NextResponse.json({ success: true, region: updatedRegion[0] });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
    }
    console.error("Erro ao atualizar região:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
  
    try {
      const deletedRegion = await db
        .update(regions)
        .set({
          deletedAt: new Date(),
          deletedBy: MOCK_USER_ID,
        })
        .where(eq(regions.id, id))
        .returning();
      
      if (deletedRegion.length === 0) {
        return NextResponse.json({ error: "Região não encontrada." }, { status: 404 });
      }
  
      return NextResponse.json({ success: true, message: "Região excluída com sucesso." });
  
    } catch (error) {
      console.error("Erro ao excluir região:", error);
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
  }
