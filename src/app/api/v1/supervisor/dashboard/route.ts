
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, regions, transactions, pastorProfiles, supervisorProfiles, churchProfiles } from '@/db/schema';
import { count, sum, eq, isNull, and, desc, sql, inArray, gte, lt } from 'drizzle-orm';
import { format, subMonths, startOfMonth } from 'date-fns';
import { authenticateApiKey } from '@/lib/api-auth';

const SUPERVISOR_INIT_ID = process.env.SUPERVISOR_INIT;

const calculateChange = (current: number, previous: number): string => {
    if (previous === 0) {
        return current > 0 ? "+100% (era 0)" : "Nenhuma alteração";
    }
    const percentage = ((current - previous) / previous) * 100;
    if (Math.abs(percentage) < 0.1) return "Nenhuma alteração";
    const sign = percentage > 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}% em relação ao mês passado`;
};

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;
    
    if (!SUPERVISOR_INIT_ID) {
        return NextResponse.json({ error: "ID do Supervisor não configurado no ambiente." }, { status: 500 });
    }

    try {
        const now = new Date();
        const startOfCurrentMonth = startOfMonth(now);
        const startOfPreviousMonth = startOfMonth(subMonths(now, 1));

        const pastorsResult = await db.select({ id: pastorProfiles.userId }).from(pastorProfiles).where(and(eq(pastorProfiles.supervisorId, SUPERVISOR_INIT_ID), isNull(users.deletedAt))).leftJoin(users, eq(pastorProfiles.userId, users.id));
        const pastorIds = pastorsResult.map(p => p.id);
        
        const churchesResult = await db.select({ id: churchProfiles.userId }).from(churchProfiles).where(and(eq(churchProfiles.supervisorId, SUPERVISOR_INIT_ID), isNull(users.deletedAt))).leftJoin(users, eq(churchProfiles.userId, users.id));
        const churchIds = churchesResult.map(c => c.id);

        const networkUserIds = [SUPERVISOR_INIT_ID, ...pastorIds, ...churchIds];
        
        const totalPastors = pastorIds.length;
        const totalChurches = churchIds.length;
        const totalMembers = 1 + totalPastors + totalChurches;
        
        // KPI Calculations
        const revenueCurrentMonthResult = await db.select({ value: sum(transactions.amount) }).from(transactions).where(and(eq(transactions.status, 'approved'), gte(transactions.createdAt, startOfCurrentMonth), inArray(transactions.contributorId, networkUserIds)));
        const revenuePreviousMonthResult = await db.select({ value: sum(transactions.amount) }).from(transactions).where(and(eq(transactions.status, 'approved'), gte(transactions.createdAt, startOfPreviousMonth), lt(transactions.createdAt, startOfCurrentMonth), inArray(transactions.contributorId, networkUserIds)));
        const totalRevenueCurrentMonth = parseFloat(revenueCurrentMonthResult[0].value || '0');
        const totalRevenuePreviousMonth = parseFloat(revenuePreviousMonthResult[0].value || '0');

        const newMembersThisMonthResult = await db.select({ value: count() }).from(users).where(and(gte(users.createdAt, startOfCurrentMonth), inArray(users.id, networkUserIds)));
        const newMembersThisMonth = newMembersThisMonthResult[0].value;

        const newTransactionsThisMonthResult = await db.select({ value: count() }).from(transactions).where(and(gte(transactions.createdAt, startOfCurrentMonth), inArray(transactions.contributorId, networkUserIds)));
        const newTransactionsLastMonthResult = await db.select({ value: count() }).from(transactions).where(and(gte(transactions.createdAt, startOfPreviousMonth), lt(transactions.createdAt, startOfCurrentMonth), inArray(transactions.contributorId, networkUserIds)));
        const totalTransactionsThisMonth = newTransactionsThisMonthResult[0].value;
        const totalTransactionsLastMonth = newTransactionsLastMonthResult[0].value;

        const kpis = {
            totalRevenue: { value: `R$ ${totalRevenueCurrentMonth.toFixed(2)}`, change: calculateChange(totalRevenueCurrentMonth, totalRevenuePreviousMonth) },
            totalMembers: { value: `${totalMembers}`, change: `+${newMembersThisMonth} este mês` },
            totalTransactions: { value: `+${totalTransactionsThisMonth}`, change: calculateChange(totalTransactionsThisMonth, totalTransactionsLastMonth) },
            totalChurches: { value: `${totalChurches}`, change: "" },
            totalPastors: { value: `${totalPastors}`, change: "" },
        };

        const revenueByMethod = networkUserIds.length > 0 ? await db.select({
            method: transactions.paymentMethod,
            value: sum(transactions.amount).mapWith(Number)
        })
        .from(transactions)
        .where(and(eq(transactions.status, 'approved'), inArray(transactions.contributorId, networkUserIds)))
        .groupBy(transactions.paymentMethod) : [];

        const recentTransactions = await db
            .select({
                id: transactions.id,
                name: users.email,
                amount: transactions.amount,
                date: transactions.createdAt,
                status: transactions.status
            })
            .from(transactions)
            .innerJoin(users, eq(transactions.contributorId, users.id))
            .where(inArray(transactions.contributorId, networkUserIds))
            .orderBy(desc(transactions.createdAt))
            .limit(10);
        
        const recentRegistrations = await db
            .select({
                id: users.id,
                name: users.email,
                role: users.role,
                date: users.createdAt,
            })
            .from(users)
            .where(inArray(users.id, networkUserIds))
            .orderBy(desc(users.createdAt))
            .limit(10);

        const startOfSixMonthsAgo = startOfMonth(subMonths(now, 5));
        const newMembersByMonthData = await db
            .select({
                month: sql<string>`TO_CHAR(${users.createdAt}, 'YYYY-MM')`,
                count: count(users.id),
            })
            .from(users)
            .where(and(gte(users.createdAt, startOfSixMonthsAgo), inArray(users.id, networkUserIds)))
            .groupBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${users.createdAt}, 'YYYY-MM')`);
    
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const formattedNewMembers = newMembersByMonthData.map(item => ({
            month: monthNames[parseInt(item.month.substring(5, 7)) - 1],
            count: item.count,
        }));
            
        const formattedRevenueByMethod = revenueByMethod.map(item => ({
            ...item,
            fill: item.method === 'pix' ? '#10b981' : item.method === 'credit_card' ? '#3b82f6' : '#f59e0b'
        }));
        
        const revenueByChurchData = await db
            .select({
                name: churchProfiles.nomeFantasia,
                revenue: sum(transactions.amount).mapWith(Number)
            })
            .from(transactions)
            .innerJoin(churchProfiles, eq(transactions.contributorId, churchProfiles.userId))
            .where(inArray(transactions.contributorId, churchIds))
            .groupBy(churchProfiles.nomeFantasia);

        const membersByChurchData = await db
            .select({
                name: churchProfiles.nomeFantasia,
                count: count(pastorProfiles.userId)
            })
            .from(churchProfiles)
            .leftJoin(pastorProfiles, eq(churchProfiles.supervisorId, pastorProfiles.supervisorId))
            .where(inArray(churchProfiles.userId, churchIds))
            .groupBy(churchProfiles.nomeFantasia);

        const colors = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6'];
        const revenueByChurch = revenueByChurchData.map((d, i) => ({ ...d, fill: colors[i % colors.length] }));
        const membersByChurch = membersByChurchData.map((d, i) => ({ ...d, fill: colors[i % colors.length] }));

        return NextResponse.json({
            kpis,
            revenueByMethod: formattedRevenueByMethod,
            revenueByChurch,
            membersByChurch,
            recentTransactions: recentTransactions.map(t => ({...t, amount: Number(t.amount), date: format(new Date(t.date), 'dd/MM/yyyy')})),
            recentRegistrations: recentRegistrations.map(u => ({...u, type: u.role, avatar: u.name.substring(0, 2).toUpperCase(), date: format(new Date(u.date), 'dd/MM/yyyy') })),
            newMembers: formattedNewMembers,
        });

    } catch (error: any) {
        console.error("Erro ao buscar dados para o dashboard do supervisor:", error);
        return NextResponse.json({ error: "Erro ao buscar dados do dashboard do supervisor", details: error.message }, { status: 500 });
    }
}
