'use server';

import { z } from 'zod';
import { db } from '@/db/drizzle';
import { regions } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { validateRequest } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { UTApi } from 'uploadthing/server';

const regionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'O nome da região é obrigatório.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { message: 'Cor inválida.' }),
});

// Mock da companyId por enquanto
const MOCK_COMPANY_ID = "c33e9e6a-5694-49e4-9e8a-83849f87d467";

export async function getRegions() {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error('Não autorizado');
  }

  const companyId = (await db.query.users.findFirst({ where: eq(users.id, user.id) }))?.companyId;

  if(!companyId){
    throw new Error('Empresa não encontrada');
  }

  try {
    const companyRegions = await db
      .select()
      .from(regions)
      .where(and(eq(regions.companyId, companyId), isNull(regions.deletedAt)))
      .orderBy(desc(regions.name));

    return companyRegions;
  } catch (error) {
    console.error("Erro ao buscar regiões:", error);
    return [];
  }
}

export async function saveRegion(values: z.infer<typeof regionSchema>) {
  const { user } = await validateRequest();
  if (!user) {
    throw new Error('Não autorizado');
  }

  const companyId = (await db.query.users.findFirst({ where: eq(users.id, user.id) }))?.companyId;

  if(!companyId){
    throw new Error('Empresa não encontrada');
  }

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
        .where(and(eq(regions.id, id), eq(regions.companyId, companyId)));
    } else {
      // Create
      await db.insert(regions).values({
        name,
        color,
        companyId: companyId,
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
  const { user } = await validateRequest();
  if (!user) {
    throw new Error('Não autorizado');
  }

  const companyId = (await db.query.users.findFirst({ where: eq(users.id, user.id) }))?.companyId;

  if(!companyId){
    throw new Error('Empresa não encontrada');
  }
  
  try {
    await db
      .update(regions)
      .set({ deletedAt: new Date(), deletedBy: user.id })
      .where(and(eq(regions.id, id), eq(regions.companyId, companyId)));

    revalidatePath('/admin/regioes');
    return { success: true };
  } catch (error) {
    console.error("Erro ao excluir região:", error);
    return { error: 'Ocorreu um erro ao excluir a região.' };
  }
}
