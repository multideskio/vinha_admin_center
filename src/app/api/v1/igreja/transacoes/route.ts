/**
* @fileoverview Rota da API para buscar transações da igreja logada.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactions as transactionsTable, users, churchProfiles } from '@/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { format } from 'date-fns';
import { authenticateApiKey } from '@/lib/api-auth';
import { validateRequest } from '@/lib/auth';

export async function GET(request: Request): Promise<NextResponse> {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'church_account') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const results = await db.select({
            id: transactionsTable.gatewayTransactionId, // Use gateway ID for client-side routing
            contributor: users.email,
            church: churchProfiles.nomeFantasia,
            amount: transactionsTable.amount,
            method: transactionsTable.paymentMethod,
            status: transactionsTable.status,
            date: transactionsTable.createdAt,
            refundRequestReason: transactionsTable.refundRequestReason,
        })
        .from(transactionsTable)
        .leftJoin(users, eq(transactionsTable.contributorId, users.id))
        .leftJoin(churchProfiles, eq(transactionsTable.originChurchId, churchProfiles.userId))
        .where(and(eq(transactionsTable.originChurchId, sessionUser.id), isNull(transactionsTable.deletedAt)))
        .orderBy(desc(transactionsTable.createdAt));
        
        const formattedTransactions = results.map(t => ({
            ...t,
            amount: Number(t.amount),
            date: format(new Date(t.date), 'dd/MM/yyyy')
        }));

        return NextResponse.json({ transactions: formattedTransactions });
    } catch (error: any) {
        console.error("Erro ao buscar transações da igreja:", error);
        return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
    }
}
