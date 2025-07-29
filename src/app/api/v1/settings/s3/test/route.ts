
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

const s3SettingsSchema = z.object({
    endpoint: z.string().min(1),
    bucket: z.string().min(1),
    region: z.string().min(1),
    accessKeyId: z.string().min(1),
    secretAccessKey: z.string().min(1),
    forcePathStyle: z.boolean().default(false),
});


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = s3SettingsSchema.parse(body);

        const s3Client = new S3Client({
            endpoint: validatedData.endpoint,
            region: validatedData.region,
            credentials: {
                accessKeyId: validatedData.accessKeyId,
                secretAccessKey: validatedData.secretAccessKey,
            },
            forcePathStyle: validatedData.forcePathStyle,
        });

        await s3Client.send(new ListBucketsCommand({}));

        return NextResponse.json({ success: true, message: 'Conexão bem-sucedida!' });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados de configuração inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao testar conexão S3:", error);
        return NextResponse.json({ error: `Falha na conexão: ${error.name || error.message}` }, { status: 500 });
    }
}
