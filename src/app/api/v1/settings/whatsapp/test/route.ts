
import { NextResponse } from 'next/server';
import { z } from 'zod';

const testMessageSchema = z.object({
    phone: z.string().min(10),
    message: z.string().min(1),
    config: z.object({
        apiUrl: z.string().url(),
        apiKey: z.string(),
    }),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = testMessageSchema.parse(body);

        const { phone, message, config } = validatedData;

        // Aqui iria a lógica para enviar a mensagem usando a API do WhatsApp
        // Exemplo (genérico):
        /*
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                to: phone,
                text: message,
            }),
        });

        if (!response.ok) {
            throw new Error('Falha ao enviar mensagem pela API do WhatsApp.');
        }
        */

        // Como não temos uma API real, vamos simular o sucesso.
        console.log(`Simulando envio para ${phone}: "${message}"`);
        
        return NextResponse.json({ success: true, message: 'Simulação de envio bem-sucedida.' });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao enviar mensagem de teste do WhatsApp:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
    }
}
