/**
* @fileoverview Rota da API para buscar transações da supervisão.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactions as transactionsTable, users, churchProfiles, pastorProfiles } from '@/db/schema';
import { eq, desc, and, isNull, inArray } from 'drizzle-orm';
import { format } from 'date-fns';
import { authenticateApiKey } from '@/lib/api-auth';
import { validateRequest } from '@/lib/auth';


export async function GET(request: Request): Promise<NextResponse> {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;
    
    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'supervisor') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const pastorIdsResult = await db.select({ id: pastorProfiles.userId })
            .from(pastorProfiles)
            .where(eq(pastorProfiles.supervisorId, sessionUser.id));
        const pastorIds = pastorIdsResult.map(p => p.id);
        
        const churchIdsResult = await db.select({ id: churchProfiles.userId })
            .from(churchProfiles)
            .where(eq(churchProfiles.supervisorId, sessionUser.id));
        const churchIds = churchIdsResult.map(c => c.id);

        const networkUserIds = [sessionUser.id, ...pastorIds, ...churchIds];
        if (networkUserIds.length === 0) {
            return NextResponse.json({ transactions: [] });
        }

        const results = await db.select({
            id: transactionsTable.id,
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
        .where(inArray(transactionsTable.contributorId, networkUserIds))
        .orderBy(desc(transactionsTable.createdAt));
        
        const formattedTransactions = results.map(t => ({
            ...t,
            amount: Number(t.amount),
            date: format(new Date(t.date), 'dd/MM/yyyy')
        }));

        return NextResponse.json({ transactions: formattedTransactions });
    } catch (error: any) {
        console.error("Erro ao buscar transações da supervisão:", error);
        return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
    }
}
