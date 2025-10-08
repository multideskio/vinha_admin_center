/**
* @fileoverview API para buscar detalhes de uma transação específica (visão do admin).
* @version 1.1
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactions as transactionsTable, gatewayConfigurations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { validateRequest } from '@/lib/jwt';
import { ApiError } from '@/lib/errors';


async function getCieloCredentials(): Promise<{ merchantId: string | null; merchantKey: string | null; apiUrl: string; }> {
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


export async function GET(request: Request, props: { params: Promise<{ id: string }>}): Promise<NextResponse> {
    const params = await props.params;
    const { user } = await validateRequest();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id: paymentId } = await params;

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
            throw new ApiError(response.status, 'Falha ao consultar o status da transação na Cielo.');
        }

        const cieloData = await response.json();
        
        await db.update(transactionsTable)
          .set({ status: cieloData.Payment?.Status === 2 ? 'approved' : cieloData.Payment?.Status === 10 ? 'refused' : 'pending' })
          .where(eq(transactionsTable.gatewayTransactionId, paymentId));

        return NextResponse.json({ success: true, transaction: cieloData });

    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Erro ao consultar transação:", error);
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
        return NextResponse.json({ error: "Erro interno do servidor.", details: errorMessage }, { status: 500 });
    }
}
