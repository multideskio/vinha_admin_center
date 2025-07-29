
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { otherSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";

const s3SettingsSchema = z.object({
    endpoint: z.string().min(1),
    bucket: z.string().min(1),
    region: z.string().min(1),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
    forcePathStyle: z.boolean().default(false),
});

export async function GET() {
    try {
        const [config] = await db.select().from(otherSettings).where(eq(otherSettings.companyId, MOCK_COMPANY_ID)).limit(1);
        
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

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const validatedData = s3SettingsSchema.parse(body);

        await db.insert(otherSettings)
            .values({
                companyId: MOCK_COMPANY_ID,
                s3Endpoint: validatedData.endpoint,
                s3Bucket: validatedData.bucket,
                s3Region: validatedData.region,
                s3AccessKeyId: validatedData.accessKeyId,
                s3SecretAccessKey: validatedData.secretAccessKey,
                s3ForcePathStyle: validatedData.forcePathStyle,
            })
            .onConflictDoUpdate({
                target: otherSettings.companyId,
                set: {
                    s3Endpoint: validatedData.endpoint,
                    s3Bucket: validatedData.bucket,
                    s3Region: validatedData.region,
                    s3AccessKeyId: validatedData.accessKeyId,
                    s3SecretAccessKey: validatedData.secretAccessKey,
                    s3ForcePathStyle: validatedData.forcePathStyle,
                }
            });
            
        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error(`Erro ao atualizar configurações de S3:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
