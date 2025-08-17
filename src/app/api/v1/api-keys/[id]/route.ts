/**
* @fileoverview Rota da API para gerenciar uma chave de API específica.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { apiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/api-auth';
import { type ApiKeyStatus } from '@/lib/types';


const updateKeySchema = z.object({
    status: z.enum(['active', 'inactive']),
});

export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    const { id } = params;
    try {
        const body = await request.json();
        const validatedData = updateKeySchema.parse(body);

        const [updatedKey] = await db.update(apiKeys)
            .set({ status: validatedData.status as ApiKeyStatus })
            .where(eq(apiKeys.id, id))
            .returning();
        
        if (!updatedKey) {
            return NextResponse.json({ error: "Chave não encontrada." }, { status: 404 });
        }

        return NextResponse.json({ success: true, key: updatedKey });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao atualizar chave de API:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;
    
    const { id } = params;
    try {
        const [deletedKey] = await db.delete(apiKeys)
            .where(eq(apiKeys.id, id))
            .returning();
        
        if (!deletedKey) {
            return NextResponse.json({ error: "Chave não encontrada." }, { status: 404 });
        }
  
        return NextResponse.json({ success: true, message: "Chave de API excluída com sucesso." });
    } catch (error: any) {
        console.error("Erro ao excluir chave de API:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
