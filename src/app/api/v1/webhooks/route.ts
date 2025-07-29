
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { notificationRules } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";

const webhookSchema = z.object({
    url: z.string().url(),
    secret: z.string().min(1),
    events: z.array(z.string()),
});

export async function GET() {
  try {
    const webhooks = await db
      .select({
          id: notificationRules.id,
          url: notificationRules.messageTemplate, // Reutilizando campo
          secret: notificationRules.name, // Reutilizando campo
          events: notificationRules.eventTrigger, // Reutilizando campo
      })
      .from(notificationRules)
      .where(eq(notificationRules.companyId, MOCK_COMPANY_ID))
      .orderBy(desc(notificationRules.createdAt));
      
    // Este é um workaround. Idealmente, teríamos uma tabela separada para webhooks.
    // Por enquanto, adaptamos a tabela de regras de notificação.
    const formattedWebhooks = webhooks.map(wh => ({
        ...wh,
        // O campo 'events' é na verdade um único evento. Vamos formatar para parecer um array.
        events: wh.events ? [wh.events] : []
    }));

    return NextResponse.json({ webhooks: formattedWebhooks });

  } catch (error) {
    console.error("Erro ao buscar webhooks:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const validatedData = webhookSchema.parse(body);
      
      // Criando uma "regra" para cada evento selecionado
      const newWebhooks = await db.transaction(async (tx) => {
        const results = [];
        for (const event of validatedData.events) {
            const [newWebhook] = await tx.insert(notificationRules).values({
                companyId: MOCK_COMPANY_ID,
                name: validatedData.secret, // Reutilizando campo
                eventTrigger: event as any, // Reutilizando campo
                messageTemplate: validatedData.url, // Reutilizando campo
                isActive: true, // Webhooks são sempre ativos por padrão
            }).returning();
            results.push(newWebhook);
        }
        return results;
      });
  
      return NextResponse.json({ success: true, webhooks: newWebhooks }, { status: 201 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar webhook:", error);
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
