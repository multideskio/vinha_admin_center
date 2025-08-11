
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { otherSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/api-auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const whatsappSettingsSchema = z.object({
    apiUrl: z.string().url(),
    apiKey: z.string().min(1),
    apiInstance: z.string().min(1),
});

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
        const [config] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, COMPANY_ID)).limit(1);
        
        if (!config) {
            return NextResponse.json({ config: null });
        }
        
        return NextResponse.json({ 
            config: {
                apiUrl: config.whatsappApiUrl,
                apiKey: config.whatsappApiKey,
                apiInstance: config.whatsappApiInstance,
            }
        });

    } catch (error) {
        console.error(`Erro ao buscar configurações do WhatsApp:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
        const body = await request.json();
        const validatedData = whatsappSettingsSchema.parse(body);

        const [existingConfig] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, COMPANY_ID)).limit(1);

        const dataToUpsert = {
            companyId: COMPANY_ID,
            whatsappApiUrl: validatedData.apiUrl,
            whatsappApiKey: validatedData.apiKey,
            whatsappApiInstance: validatedData.apiInstance,
        };
        
        if(existingConfig) {
            await db.update(otherSettings)
                .set(dataToUpsert)
                .where(eq(otherSettings.id, existingConfig.id));
        } else {
            await db.insert(otherSettings).values(dataToUpsert);
        }
            
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error(`Erro ao atualizar configurações do WhatsApp:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
