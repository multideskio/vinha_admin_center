/**
* @fileoverview API para buscar detalhes de uma transação específica (visão do gerente).
* @version 1.1
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactions as transactionsTable, gatewayConfigurations, supervisorProfiles, pastorProfiles, churchProfiles } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { authenticateApiKey } from '@/lib/api-auth';
import { validateRequest } from '@/lib/auth';
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

async function verifyTransactionOwnership(transactionId: string, managerId: string): Promise<boolean> {
    const [transaction] = await db.select({ contributorId: transactionsTable.contributorId })
        .from(transactionsTable)
        .where(eq(transactionsTable.id, transactionId))
        .limit(1);

    if (!transaction || !transaction.contributorId) return false;

    const contributorId = transaction.contributorId;
    
    // Check if the contributor is the manager himself
    if (contributorId === managerId) return true;

    // Check if the contributor is in the manager's network
    const supervisorsResult = await db.select({ id: supervisorProfiles.userId }).from(supervisorProfiles).where(eq(supervisorProfiles.managerId, managerId));
    const supervisorIds = supervisorsResult.map(s => s.id);
    if (supervisorIds.includes(contributorId)) return true;

    if (supervisorIds.length > 0) {
        const pastorsResult = await db.select({ id: pastorProfiles.userId }).from(pastorProfiles).where(inArray(pastorProfiles.supervisorId, supervisorIds));
        const pastorIds = pastorsResult.map(p => p.id);
        if (pastorIds.includes(contributorId)) return true;

        const churchesResult = await db.select({ id: churchProfiles.userId }).from(churchProfiles).where(inArray(churchProfiles.supervisorId, supervisorIds));
        const churchIds = churchesResult.map(c => c.id);
        if (churchIds.includes(contributorId)) return true;
    }
    
    return false;
}


export async function GET(request: Request, { params }: { params: { id: string }}): Promise<NextResponse> {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "ID da transação não fornecido." }, { status: 400 });
    }

    try {
        const isAuthorized = await verifyTransactionOwnership(id, sessionUser.id);
        if (!isAuthorized) {
            throw new ApiError(404, "Transação não encontrada ou você não tem permissão para visualizá-la.");
        }

        const [transaction] = await db.select().from(transactionsTable).where(eq(transactionsTable.gatewayTransactionId, id));

        if (!transaction || !transaction.gatewayTransactionId) {
            throw new ApiError(404, "Transação não possui um ID de gateway válido.");
        }

        const credentials = await getCieloCredentials();

        const response = await fetch(`${credentials.apiUrl}/1/sales/${transaction.gatewayTransactionId}`, {
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
