
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { webhooks, webhookEventEnum } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";

const webhookSchema = z.object({
    url: z.string().url(),
    secret: z.string().min(1),
    events: z.array(z.enum(webhookEventEnum.enumValues)).min(1, 'Selecione ao menos um evento.'),
});

export async function GET() {
  try {
    const allWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.companyId, MOCK_COMPANY_ID))
      .orderBy(desc(webhooks.createdAt));
      
    return NextResponse.json({ webhooks: allWebhooks });

  } catch (error) {
    console.error("Erro ao buscar webhooks:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const validatedData = webhookSchema.parse(body);
      
      const [newWebhook] = await db.insert(webhooks).values({
        companyId: MOCK_COMPANY_ID,
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

    