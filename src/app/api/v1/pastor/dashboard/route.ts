
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, transactions, pastorProfiles } from '@/db/schema';
import { count, sum, eq, and, desc, gte, lt, sql } from 'drizzle-orm';
import { format, subMonths, startOfMonth } from 'date-fns';
import { authenticateApiKey } from '@/lib/api-auth';
import { validateRequest } from '@/lib/auth';

const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) {
        return current > 0 ? "+100%" : "Nenhuma alteração";
    }
    const percentage = ((current - previous) / previous) * 100;
    if (Math.abs(percentage) < 0.1) return "Nenhuma alteração";
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}% em relação ao mês passado`;
};

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'pastor') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    const pastorId = sessionUser.id;

    try {
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const startOfPreviousMonth = startOfMonth(subMonths(now, 1));
        const endOfPreviousMonth = startOfMonth(subMonths(now, 1));


        const [profileData] = await db.select().from(pastorProfiles).where(eq(pastorProfiles.userId, pastorId));

        // KPI Calculations
        const totalContributedResult = await db.select({ value: sum(transactions.amount) }).from(transactions).where(and(eq(transactions.contributorId, pastorId), eq(transactions.status, 'approved')));
        const totalContributed = parseFloat(totalContributedResult[0].value || '0');

        const contributionCurrentMonthResult = await db.select({ value: sum(transactions.amount) }).from(transactions).where(and(eq(transactions.contributorId, pastorId), eq(transactions.status, 'approved'), gte(transactions.createdAt, startOfCurrentMonth)));
        const contributionPreviousMonthResult = await db.select({ value: sum(transactions.amount) }).from(transactions).where(and(eq(transactions.contributorId, pastorId), eq(transactions.status, 'approved'), gte(transactions.createdAt, startOfPreviousMonth), lt(transactions.createdAt, startOfCurrentMonth)));
        const contributionCurrentMonth = parseFloat(contributionCurrentMonthResult[0].value || '0');
        const contributionPreviousMonth = parseFloat(contributionPreviousMonthResult[0].value || '0');

        const totalTransactionsResult = await db.select({ value: count() }).from(transactions).where(eq(transactions.contributorId, pastorId));

        const kpis = {
            totalContributed: {
                value: `R$ ${totalContributed.toFixed(2)}`,
                change: `R$ ${contributionCurrentMonth.toFixed(2)} este mês`
            },
            monthlyContribution: {
                value: `R$ ${contributionCurrentMonth.toFixed(2)}`,
                change: calculateChange(contributionCurrentMonth, contributionPreviousMonth)
            },
            totalTransactions: {
                value: `${totalTransactionsResult[0].value}`,
                change: ""
            },
        };

        const startOfSixMonthsAgo = startOfMonth(subMonths(now, 5));
        const monthlyContributionsData = await db
            .select({
                month: sql<string>`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`,
                total: sum(transactions.amount).mapWith(Number),
            })
            .from(transactions)
            .where(and(
                eq(transactions.contributorId, pastorId), 
                eq(transactions.status, 'approved'),
                gte(transactions.createdAt, startOfSixMonthsAgo)
            ))
            .groupBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM')`);
    
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const formattedMonthlyContributions = monthlyContributionsData.map(item => ({
            month: monthNames[parseInt(item.month.substring(5, 7)) - 1],
            total: item.total,
        }));
        
        const paymentMethodsData = await db.select({
            method: transactions.paymentMethod,
            value: sum(transactions.amount).mapWith(Number)
        })
        .from(transactions)
        .where(and(eq(transactions.contributorId, pastorId), eq(transactions.status, 'approved')))
        .groupBy(transactions.paymentMethod);
        
        const formattedPaymentMethods = paymentMethodsData.map(item => ({
            ...item,
            fill: item.method === 'pix' ? '#10b981' : item.method === 'credit_card' ? '#3b82f6' : '#f59e0b'
        }));


        return NextResponse.json({
            profile: { ...sessionUser, ...profileData },
            kpis,
            monthlyContributions: formattedMonthlyContributions,
            paymentMethods: formattedPaymentMethods
        });

    } catch (error: any) {
        console.error("Erro ao buscar dados para o dashboard do pastor:", error);
        return NextResponse.json({ error: "Erro ao buscar dados do dashboard do pastor", details: error.message }, { status: 500 });
    }
}
