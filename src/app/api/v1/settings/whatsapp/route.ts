
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { otherSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";

const whatsappSettingsSchema = z.object({
    apiUrl: z.string().url(),
    apiKey: z.string().min(1),
});

export async function GET() {
    try {
        const [config] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, MOCK_COMPANY_ID)).limit(1);
        
        if (!config) {
            return NextResponse.json({ config: null });
        }
        
        return NextResponse.json({ 
            config: {
                apiUrl: config.whatsappApiUrl,
                apiKey: config.whatsappApiKey,
            }
        });

    } catch (error) {
        console.error(`Erro ao buscar configurações do WhatsApp:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const validatedData = whatsappSettingsSchema.parse(body);

        await db.insert(otherSettings)
            .values({
                companyId: MOCK_COMPANY_ID,
                whatsappApiUrl: validatedData.apiUrl,
                whatsappApiKey: validatedData.apiKey,
            })
            .onConflictDoUpdate({
                target: otherSettings.companyId,
                set: {
                    whatsappApiUrl: validatedData.apiUrl,
                    whatsappApiKey: validatedData.apiKey,
                }
            });
            
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error(`Erro ao atualizar configurações do WhatsApp:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
