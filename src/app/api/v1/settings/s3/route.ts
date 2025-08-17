/**
* @fileoverview Rota da API para gerenciar configurações de S3.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { otherSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/api-auth';
import { validateRequest } from '@/lib/auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const s3SettingsSchema = z.object({
    endpoint: z.string().min(1),
    bucket: z.string().min(1),
    region: z.string().min(1),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
    forcePathStyle: z.boolean().default(false),
});

export async function GET(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const [config] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, COMPANY_ID)).limit(1);
        
        if (!config) {
            return NextResponse.json({ config: null });
        }
        
        return NextResponse.json({ 
            config: {
                endpoint: config.s3Endpoint,
                bucket: config.s3Bucket,
                region: config.s3Region,
                accessKeyId: config.s3AccessKeyId,
                secretAccessKey: config.s3SecretAccessKey,
                forcePathStyle: config.s3ForcePathStyle,
            }
        });

    } catch (error) {
        console.error(`Erro ao buscar configurações de S3:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function PUT(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const validatedData = s3SettingsSchema.parse(body);

        const [existingConfig] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, COMPANY_ID)).limit(1);

        const dataToUpsert = {
            companyId: COMPANY_ID,
            s3Endpoint: validatedData.endpoint,
            s3Bucket: validatedData.bucket,
            s3Region: validatedData.region,
            s3AccessKeyId: validatedData.accessKeyId,
            s3SecretAccessKey: validatedData.secretAccessKey,
            s3ForcePathStyle: validatedData.forcePathStyle,
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
        console.error(`Erro ao atualizar configurações de S3:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
