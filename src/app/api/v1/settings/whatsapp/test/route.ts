
import { NextResponse } from 'next/server';
import { z } from 'zod';

const testMessageSchema = z.object({
    phone: z.string().min(10),
    message: z.string().min(1),
    config: z.object({
        apiUrl: z.string().url(),
        apiKey: z.string(),
        apiInstance: z.string(),
    }),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = testMessageSchema.parse(body);

        const { phone, message, config } = validatedData;
        
        const url = `${config.apiUrl.replace(/\/$/, '')}/message/sendText/${config.apiInstance}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': config.apiKey,
            },
            body: JSON.stringify({
                number: phone,
                text: message,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Erro da Evolution API:", errorBody);
            throw new Error(errorBody.message || 'Falha ao enviar mensagem pela API do WhatsApp.');
        }

        const responseData = await response.json();
        
        return NextResponse.json({ success: true, data: responseData });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao enviar mensagem de teste do WhatsApp:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
    }
}
