
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { otherSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";

const smtpSettingsSchema = z.object({
  host: z.string().min(1, 'Servidor SMTP é obrigatório.'),
  port: z.coerce.number().min(1, 'Porta é obrigatória.'),
  user: z.string().min(1, 'Usuário SMTP é obrigatório.'),
  password: z.string().min(1, 'Senha SMTP é obrigatória.'),
  from: z.string().email('E-mail de envio inválido.').optional().nullable(),
});

export async function GET() {
    try {
        const [config] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, MOCK_COMPANY_ID)).limit(1);
        
        if (!config) {
            return NextResponse.json({ config: null });
        }
        
        return NextResponse.json({ 
            config: {
                host: config.smtpHost,
                port: config.smtpPort,
                user: config.smtpUser,
                password: config.smtpPass,
                from: config.smtpFrom,
            }
        });

    } catch (error) {
        console.error(`Erro ao buscar configurações de SMTP:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const validatedData = smtpSettingsSchema.parse(body);

        const [existingConfig] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, MOCK_COMPANY_ID)).limit(1);

        const dataToUpsert = {
            companyId: MOCK_COMPANY_ID,
            smtpHost: validatedData.host,
            smtpPort: validatedData.port,
            smtpUser: validatedData.user,
            smtpPass: validatedData.password,
            smtpFrom: validatedData.from,
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
        console.error(`Erro ao atualizar configurações de SMTP:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
