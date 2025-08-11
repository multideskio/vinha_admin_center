
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactions as transactionsTable, gatewayConfigurations, users, supervisorProfiles, pastorProfiles, churchProfiles } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { authenticateApiKey } from '@/lib/api-auth';
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

async function verifyTransactionOwnership(transactionId: string, supervisorId: string) {
    const [transaction] = await db.select({ contributorId: transactionsTable.contributorId })
        .from(transactionsTable)
        .where(eq(transactionsTable.gatewayTransactionId, transactionId))
        .limit(1);

    if (!transaction) return false;

    const contributorId = transaction.contributorId;
    
    if (contributorId === supervisorId) return true;

    const pastorIdsResult = await db.select({ id: pastorProfiles.userId }).from(pastorProfiles).where(eq(pastorProfiles.supervisorId, supervisorId));
    const pastorIds = pastorIdsResult.map(p => p.id);
    if (pastorIds.includes(contributorId)) return true;

    const churchIdsResult = await db.select({ id: churchProfiles.userId }).from(churchProfiles).where(eq(churchProfiles.supervisorId, supervisorId));
    const churchIds = churchIdsResult.map(c => c.id);
    if (churchIds.includes(contributorId)) return true;
    
    return false;
}


export async function GET(request: Request, { params }: { params: { id: string }}) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'supervisor') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id: gatewayTransactionId } = params;

    if (!gatewayTransactionId) {
        return NextResponse.json({ error: "ID da transação não fornecido." }, { status: 400 });
    }

    try {
        const isAuthorized = await verifyTransactionOwnership(gatewayTransactionId, sessionUser.id);
        if (!isAuthorized) {
            return NextResponse.json({ error: "Transação não encontrada ou você não tem permissão para visualizá-la." }, { status: 404 });
        }

        const [transaction] = await db.select().from(transactionsTable).where(eq(transactionsTable.gatewayTransactionId, gatewayTransactionId));
        if(!transaction) {
            return NextResponse.json({ error: "Transação não encontrada no banco de dados local." }, { status: 404 });
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

    } catch (error: any) {
        console.error("Erro ao consultar transação:", error);
        return NextResponse.json({ error: error.message || "Erro interno do servidor." }, { status: 500 });
    }
}
