/**
* @fileoverview Rota da API para gerenciar webhooks.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { webhooks, webhookEventEnum } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/api-auth';
import { validateRequest } from '@/lib/auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const webhookSchema = z.object({
    url: z.string().url(),
    secret: z.string().min(1),
    events: z.array(z.enum(webhookEventEnum.enumValues)).min(1, 'Selecione ao menos um evento.'),
});

export async function GET(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

  try {
    const allWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.companyId, COMPANY_ID))
      .orderBy(desc(webhooks.createdAt));
      
    return NextResponse.json({ webhooks: allWebhooks });

  } catch (error: any) {
    console.error("Erro ao buscar webhooks:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
      const body = await request.json();
      const validatedData = webhookSchema.parse(body);
      
      const [newWebhook] = await db.insert(webhooks).values({
        companyId: COMPANY_ID,
        url: validatedData.url,
        secret: validatedData.secret,
        events: validatedData.events,
        isActive: true,
      }).returning();
  
      return NextResponse.json({ success: true, webhook: newWebhook }, { status: 201 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar webhook:", error);
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
