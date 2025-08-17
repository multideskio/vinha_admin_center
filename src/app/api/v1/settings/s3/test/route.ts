/**
* @fileoverview Rota da API para testar conexão com S3.
* @version 1.0
* @date 2024-08-08
* @author PH
*/
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

const s3SettingsSchema = z.object({
    endpoint: z.string().min(1, "Endpoint é obrigatório."),
    bucket: z.string().min(1, "Nome do bucket é obrigatório."),
    region: z.string().min(1, "Região é obrigatória."),
    accessKeyId: z.string().min(1, "Access Key ID é obrigatório."),
    secretAccessKey: z.string().min(1, "Secret Access Key é obrigatório."),
    forcePathStyle: z.boolean().default(false),
});


export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = await request.json();
        const validatedData = s3SettingsSchema.parse(body);

        let endpointUrl = validatedData.endpoint;
        if (!endpointUrl.startsWith('http://') && !endpointUrl.startsWith('https://')) {
            endpointUrl = `https://${endpointUrl}`;
        }

        const s3Client = new S3Client({
            endpoint: endpointUrl,
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
        
        let errorMessage = "Erro interno do servidor.";
        if (error.name === 'TypeError' && error.message.includes('Invalid URL')) {
            errorMessage = "Falha na conexão: URL do Endpoint inválida.";
        } else if (error.name) {
             errorMessage = `Falha na conexão: ${error.name}`;
        }

        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
