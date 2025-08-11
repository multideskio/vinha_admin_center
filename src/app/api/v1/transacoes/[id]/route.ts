
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactions as transactionsTable, gatewayConfigurations, users, churchProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { format, parseISO } from 'date-fns';
import { validateRequest } from '@/lib/auth';


async function getCieloCredentials() {
    const [config] = await db.select()
        .from(gatewayConfigurations)
        .where(eq(gatewayConfigurations.gatewayName, 'Cielo'))
        .limit(1);

    if (!config) throw new Error("Configuração do gateway Cielo não encontrada.");

    const isProduction = config.environment === 'production';
    return {
        merchantId: isProduction ? config.prodClientId : config.devClientId,
        merchantKey: isProduction ? config.prodClientSecret : config.devClientSecret,
        apiUrl: isProduction ? 'https://api.cieloecommerce.cielo.com.br' : 'https://apisandbox.cieloecommerce.cielo.com.br'
    };
}


export async function GET(request: Request, { params }: { params: { id: string }}) {
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id: paymentId } = params;

    if (!paymentId) {
        return NextResponse.json({ error: "ID da transação não fornecido." }, { status: 400 });
    }

    try {
        const credentials = await getCieloCredentials();

        const response = await fetch(`${credentials.apiUrl}/1/sales/${paymentId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'MerchantId': credentials.merchantId || '',
                'MerchantKey': credentials.merchantKey || '',
            }
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("Erro ao consultar transação na Cielo:", errorBody);
            throw new Error('Falha ao consultar o status da transação na Cielo.');
        }

        const cieloData = await response.json();
        
        // Opcional: Atualizar o banco de dados com o status mais recente da Cielo
        await db.update(transactionsTable)
          .set({ status: cieloData.Payment?.Status === 2 ? 'approved' : cieloData.Payment?.Status === 10 ? 'refused' : 'pending' }) // Mapear status da Cielo para o seu
          .where(eq(transactionsTable.gatewayTransactionId, paymentId));

        return NextResponse.json({ success: true, transaction: cieloData });

    } catch (error: any) {
        console.error("Erro ao consultar transação:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
    }
}
