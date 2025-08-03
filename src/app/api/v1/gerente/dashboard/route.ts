
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, regions, transactions, pastorProfiles, supervisorProfiles, churchProfiles, managerProfiles } from '@/db/schema';
import { count, sum, eq, isNull, and, desc, sql, inArray } from 'drizzle-orm';
import { format } from 'date-fns';

const GERENTE_INIT_ID = process.env.GERENTE_INIT;

export async function GET() {
    if (!GERENTE_INIT_ID) {
        return NextResponse.json({ error: "ID do Gerente não configurado no ambiente." }, { status: 500 });
    }

    try {
        const supervisorsResult = await db
            .select({ id: users.id })
            .from(users)
            .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
            .where(and(eq(supervisorProfiles.managerId, GERENTE_INIT_ID), isNull(users.deletedAt)));
        
        const supervisorIds = supervisorsResult.map(s => s.id);

        const pastorIds = supervisorIds.length > 0 ? (await db
            .select({ id: users.id })
            .from(users)
            .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
            .where(and(inArray(pastorProfiles.supervisorId, supervisorIds), isNull(users.deletedAt)))).map(p => p.id) : [];
        
        const churchIds = supervisorIds.length > 0 ? (await db
            .select({ id: users.id })
            .from(users)
            .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
            .where(and(inArray(churchProfiles.supervisorId, supervisorIds), isNull(users.deletedAt)))).map(c => c.id) : [];

        const networkUserIds = [GERENTE_INIT_ID, ...supervisorIds, ...pastorIds, ...churchIds];
        if(networkUserIds.length === 0) networkUserIds.push(GERENTE_INIT_ID);

        const totalSupervisors = supervisorIds.length;
        const totalPastors = pastorIds.length;
        const totalChurches = churchIds.length;
        const totalMembers = 1 + totalSupervisors + totalPastors + totalChurches;

        const totalTransactionsResult = await db.select({ value: count() }).from(transactions).where(inArray(transactions.contributorId, networkUserIds));
        const totalRevenueResult = await db.select({ value: sum(transactions.amount) }).from(transactions).where(and(eq(transactions.status, 'approved'), inArray(transactions.contributorId, networkUserIds)));
        const totalRevenue = parseFloat(totalRevenueResult[0].value || '0');

        const revenueByMethod = await db.select({
            method: transactions.paymentMethod,
            value: sum(transactions.amount).mapWith(Number)
        })
        .from(transactions)
        .where(and(eq(transactions.status, 'approved'), inArray(transactions.contributorId, networkUserIds)))
        .groupBy(transactions.paymentMethod);
        
        const revenueByChurchData = churchIds.length > 0 ? await db
            .select({
                name: churchProfiles.nomeFantasia,
                revenue: sum(transactions.amount).mapWith(Number),
            })
            .from(transactions)
            .innerJoin(churchProfiles, eq(transactions.contributorId, churchProfiles.userId))
            .where(and(eq(transactions.status, 'approved'), inArray(transactions.contributorId, churchIds)))
            .groupBy(churchProfiles.nomeFantasia) : [];

        const membersByChurchData = churchIds.length > 0 ? await db
            .select({
                name: churchProfiles.nomeFantasia,
                count: count(pastorProfiles.id),
            })
            .from(churchProfiles)
            .leftJoin(pastorProfiles, eq(churchProfiles.supervisorId, pastorProfiles.supervisorId))
            .where(inArray(churchProfiles.userId, churchIds))
            .groupBy(churchProfiles.nomeFantasia) : [];

        const recentTransactionsData = await db
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
        
        const recentRegistrationsData = await db
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
            
        const formattedRevenueByMethod = revenueByMethod.map(item => ({
            ...item,
            fill: item.method === 'pix' ? '#10b981' : item.method === 'credit_card' ? '#3b82f6' : '#f59e0b'
        }));
        
        const kpis = {
            totalRevenue,
            totalMembers,
            totalTransactions: totalTransactionsResult[0].value,
            totalChurches,
            totalPastors,
            totalSupervisors,
            totalManagers: 1 
        };

        const recentTransactions = recentTransactionsData.map(t => ({...t, amount: Number(t.amount), date: format(new Date(t.date), 'dd/MM/yyyy')}));
        const recentRegistrations = recentRegistrationsData.map(u => ({...u, type: u.role, avatar: u.name.substring(0, 2).toUpperCase(), date: format(new Date(u.date), 'dd/MM/yyyy') }));
        
        const colors = ['#16a34a', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6'];
        const revenueByChurch = revenueByChurchData.map((r, i) => ({...r, revenue: Number(r.revenue), fill: colors[i % colors.length]}));
        const membersByChurch = membersByChurchData.map((m, i) => ({ ...m, fill: colors[i % colors.length] }));

        return NextResponse.json({
            kpis,
            revenueByMethod: formattedRevenueByMethod,
            revenueByChurch,
            membersByChurch,
            recentTransactions,
            recentRegistrations,
            newMembers: [
                { month: 'Jan', count: 12 }, { month: 'Fev', count: 15 }, { month: 'Mar', count: 17 }, 
                { month: 'Abr', count: 20 }, { month: 'Mai', count: 23 }, { month: 'Jun', count: 18 },
            ]
        });

    } catch (error) {
        console.error("Erro ao buscar dados para o dashboard do gerente:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
