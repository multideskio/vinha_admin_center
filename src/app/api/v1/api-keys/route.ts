
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { apiKeys } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { authenticateApiKey } from '@/lib/api-auth';


const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const newKeySchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.'}),
});

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
        const allKeys = await db
        .select({
            id: apiKeys.id,
            name: apiKeys.name,
            key: sql<string>`LEFT(${apiKeys.key}, 8) || '...'`,
            status: apiKeys.status,
            createdAt: apiKeys.createdAt,
            lastUsedAt: apiKeys.lastUsedAt,
        })
        .from(apiKeys)
        .where(eq(apiKeys.companyId, COMPANY_ID))
        .orderBy(desc(apiKeys.createdAt));
        
        return NextResponse.json({ keys: allKeys });

    } catch (error: any) {
        console.error("Erro ao buscar chaves de API:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
        const body = await request.json();
        const validatedData = newKeySchema.parse(body);

        const newRawKey = `vinha_sk_${randomBytes(24).toString('hex')}`;
        
        const [newKeyRecord] = await db.insert(apiKeys).values({
            companyId: COMPANY_ID,
            name: validatedData.name,
            key: newRawKey, // Em um cenário real, você faria o hash disso
            status: 'active',
        }).returning({ id: apiKeys.id });

        return NextResponse.json({ success: true, key: newRawKey, id: newKeyRecord.id }, { status: 201 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao criar chave de API:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
