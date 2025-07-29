
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { webhooks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const webhookSchema = z.object({
    url: z.string().url().optional(),
    secret: z.string().min(1).optional(),
    events: z.array(z.string()).min(1).optional(),
    isActive: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const body = await request.json();
        const validatedData = webhookSchema.parse(body);

        const [updatedWebhook] = await db.update(webhooks)
            .set({ ...validatedData, updatedAt: new Date() })
            .where(eq(webhooks.id, id))
            .returning();
        
        if (!updatedWebhook) {
            return NextResponse.json({ error: "Webhook não encontrado." }, { status: 404 });
        }

        return NextResponse.json({ success: true, webhook: updatedWebhook });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao atualizar webhook:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const [deletedWebhook] = await db.delete(webhooks)
            .where(eq(webhooks.id, id))
            .returning();
        
        if (!deletedWebhook) {
            return NextResponse.json({ error: "Webhook não encontrado." }, { status: 404 });
        }
  
        return NextResponse.json({ success: true, message: "Webhook excluído com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir webhook:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
