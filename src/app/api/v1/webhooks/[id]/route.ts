
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { notificationRules } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const webhookSchema = z.object({
    url: z.string().url(),
    secret: z.string().min(1),
    events: z.array(z.string()),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
    try {
        const body = await request.json();
        const validatedData = webhookSchema.parse(body);

        // Como um ID pode representar múltiplas regras (uma por evento),
        // a lógica de atualização é mais complexa.
        // Por simplicidade aqui, vamos assumir que o ID se refere a uma única regra
        // e que apenas URL e segredo podem ser atualizados. A gestão de eventos
        // seria mais complexa (delete/insert).

        const [updatedWebhook] = await db.update(notificationRules)
            .set({
                name: validatedData.secret, // Reutilizando campo
                messageTemplate: validatedData.url, // Reutilizando campo
                updatedAt: new Date(),
            })
            .where(eq(notificationRules.id, id))
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
        const [deletedWebhook] = await db.delete(notificationRules)
            .where(eq(notificationRules.id, id))
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
