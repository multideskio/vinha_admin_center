
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { transactions as transactionsTable, users, churchProfiles, pastorProfiles } from '@/db/schema';
import { eq, desc, and, isNull, inArray } from 'drizzle-orm';
import { format } from 'date-fns';
import { authenticateApiKey } from '@/lib/api-auth';

const SUPERVISOR_INIT_ID = process.env.SUPERVISOR_INIT;

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    if (!SUPERVISOR_INIT_ID) {
        return NextResponse.json({ error: "ID do Supervisor não configurado no ambiente." }, { status: 500 });
    }

    try {
        const pastorIdsResult = await db.select({ id: pastorProfiles.userId })
            .from(pastorProfiles)
            .where(eq(pastorProfiles.supervisorId, SUPERVISOR_INIT_ID));
        const pastorIds = pastorIdsResult.map(p => p.id);
        
        const churchIdsResult = await db.select({ id: churchProfiles.userId })
            .from(churchProfiles)
            .where(eq(churchProfiles.supervisorId, SUPERVISOR_INIT_ID));
        const churchIds = churchIdsResult.map(c => c.id);

        const networkUserIds = [SUPERVISOR_INIT_ID, ...pastorIds, ...churchIds];
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
