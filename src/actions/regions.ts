
'use server';

import { z } from 'zod';
import { db } from '@/db/drizzle';
import { regions, users } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { validateRequest } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const regionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'O nome da região é obrigatório.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Cor inválida.' }),
});

const MOCK_COMPANY_ID = "c33e9e6a-5694-49e4-9e8a-83849f87d466";
const MOCK_USER_ID = "c33e9e6a-5694-49e4-9e8a-83849f87d466";

export async function getRegions() {
  try {
    const companyRegions = await db
      .select()
      .from(regions)
      .where(and(eq(regions.companyId, MOCK_COMPANY_ID), isNull(regions.deletedAt)))
      .orderBy(desc(regions.name));

    return companyRegions;
  } catch (error) {
    console.error("Erro ao buscar regiões:", error);
    return [];
  }
}

export async function saveRegion(values: z.infer<typeof regionSchema>) {
  const validatedFields = regionSchema.safeParse(values);
  if (!validatedFields.success) {
    return { error: 'Campos inválidos.' };
  }

  const { id, name, color } = validatedFields.data;

  try {
    if (id) {
      // Update
      await db
        .update(regions)
        .set({ name, color, updatedAt: new Date() })
        .where(and(eq(regions.id, id), eq(regions.companyId, MOCK_COMPANY_ID)));
    } else {
      // Create
      await db.insert(regions).values({
        name,
        color,
        companyId: MOCK_COMPANY_ID,
      });
    }
    revalidatePath('/admin/regioes');
    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar região:", error);
    return { error: 'Ocorreu um erro ao salvar a região.' };
  }
}

export async function deleteRegion(id: string) {
  try {
    await db
      .update(regions)
      .set({ deletedAt: new Date(), deletedBy: MOCK_USER_ID })
      .where(and(eq(regions.id, id), eq(regions.companyId, MOCK_COMPANY_ID)));

    revalidatePath('/admin/regioes');
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir região:", error);
    return { error: 'Ocorreu um erro ao excluir a região.' };
  }
}
