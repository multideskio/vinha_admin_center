
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { notificationRules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const notificationRuleSchema = z.object({
    name: z.string().min(1, "O nome da automação é obrigatório."),
    eventTrigger: z.enum(['user_registered', 'payment_received', 'payment_due_reminder', 'payment_overdue']),
    daysOffset: z.coerce.number().int(),
    messageTemplate: z.string().min(1, "O modelo da mensagem é obrigatório."),
    isActive: z.boolean().default(true),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const body = await request.json();
        const validatedData = notificationRuleSchema.partial().parse(body);

        const [updatedRule] = await db.update(notificationRules)
            .set({ ...validatedData, updatedAt: new Date() })
            .where(eq(notificationRules.id, id))
            .returning();
        
        if (!updatedRule) {
            return NextResponse.json({ error: "Regra não encontrada." }, { status: 404 });
        }

        return NextResponse.json({ success: true, rule: updatedRule });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao atualizar regra de notificação:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const [deletedRule] = await db.delete(notificationRules)
            .where(eq(notificationRules.id, id))
            .returning();
        
        if (!deletedRule) {
            return NextResponse.json({ error: "Regra não encontrada." }, { status: 404 });
        }
  
        return NextResponse.json({ success: true, message: "Regra excluída com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir regra de notificação:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
