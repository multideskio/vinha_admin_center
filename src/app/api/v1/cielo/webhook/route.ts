
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("Webhook da Cielo recebido:", body);
        
        // Lógica para processar a notificação:
        // 1. Obter o PaymentId da notificação
        // 2. Consultar o status da transação na Cielo
        // 3. Atualizar o status da transação no banco de dados local

        return NextResponse.json({ success: true, message: "Webhook recebido." }, { status: 200 });

    } catch (error) {
        console.error("Erro no webhook da Cielo:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
