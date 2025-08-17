/**
* @fileoverview Rota da API para gerenciar regras de notificação.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { notificationRules, webhookEventEnum } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/api-auth';
import { validateRequest } from '@/lib/auth';
import { NOTIFICATION_EVENT_TRIGGERS } from '@/lib/types';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const notificationRuleSchema = z.object({
    name: z.string().min(1, "O nome da automação é obrigatório."),
    eventTrigger: z.enum(NOTIFICATION_EVENT_TRIGGERS),
    daysOffset: z.coerce.number().int(),
    messageTemplate: z.string().min(1, "O modelo da mensagem é obrigatório."),
    sendViaEmail: z.boolean().default(true),
    sendViaWhatsapp: z.boolean().default(false),
    isActive: z.boolean().default(true),
});

export async function GET(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

  try {
    const allRules = await db
      .select()
      .from(notificationRules)
      .where(eq(notificationRules.companyId, COMPANY_ID))
      .orderBy(desc(notificationRules.createdAt));
      
    return NextResponse.json({ rules: allRules });
  } catch (error: any) {
    console.error("Erro ao buscar regras de notificação:", error);
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
      const validatedData = notificationRuleSchema.parse(body);
      
      const [newRule] = await db.insert(notificationRules).values({
        ...validatedData,
        companyId: COMPANY_ID,
      }).returning();
  
      return NextResponse.json({ success: true, rule: newRule }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar regra de notificação:", error);
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
