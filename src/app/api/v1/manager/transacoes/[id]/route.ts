
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactions as transactionsTable, gatewayConfigurations, users, supervisorProfiles, pastorProfiles, churchProfiles } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { authenticateApiKey } from '@/lib/api-auth';

const GERENTE_INIT_ID = process.env.GERENTE_INIT;
if (!GERENTE_INIT_ID) {
    throw new Error("A variável de ambiente GERENTE_INIT não está definida.");
}


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

async function verifyTransactionOwnership(transactionId: string) {
    const [transaction] = await db.select({ contributorId: transactionsTable.contributorId })
        .from(transactionsTable)
        .where(eq(transactionsTable.id, transactionId))
        .limit(1);

    if (!transaction) return false;

    const contributorId = transaction.contributorId;
    
    // Check if the contributor is the manager himself
    if (contributorId === GERENTE_INIT_ID) return true;

    // Check if the contributor is in the manager's network
    const supervisorsResult = await db.select({ id: supervisorProfiles.userId }).from(supervisorProfiles).where(eq(supervisorProfiles.managerId, GERENTE_INIT_ID));
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


export async function GET(request: Request, { params }: { params: { id: string }}) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    const { id } = params;

    if (!id) {
        return NextResponse.json({ error: "ID da transação não fornecido." }, { status: 400 });
    }

    try {
        const isAuthorized = await verifyTransactionOwnership(id);
        if (!isAuthorized) {
            return NextResponse.json({ error: "Transação não encontrada ou você não tem permissão para visualizá-la." }, { status: 404 });
        }

        const [transaction] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));

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

    } catch (error: any) {
        console.error("Erro ao consultar transação:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
    }
}
