
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, regions, transactions, pastorProfiles, supervisorProfiles, churchProfiles, managerProfiles } from '@/db/schema';
import { count, sum, eq, isNull, and, desc, sql } from 'drizzle-orm';
import { format } from 'date-fns';
import { authenticateApiKey } from '@/lib/api-auth';

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
        const totalManagers = await db.select({ value: count() }).from(users).where(and(eq(users.role, 'manager'), isNull(users.deletedAt)));
        const totalSupervisors = await db.select({ value: count() }).from(users).where(and(eq(users.role, 'supervisor'), isNull(users.deletedAt)));
        const totalPastors = await db.select({ value: count() }).from(users).where(and(eq(users.role, 'pastor'), isNull(users.deletedAt)));
        const totalChurches = await db.select({ value: count() }).from(users).where(and(eq(users.role, 'church_account'), isNull(users.deletedAt)));
        
        const totalMembers = totalManagers[0].value + totalSupervisors[0].value + totalPastors[0].value + totalChurches[0].value;

        const totalTransactions = await db.select({ value: count() }).from(transactions);
        const totalRevenueResult = await db.select({ value: sum(transactions.amount) }).from(transactions).where(eq(transactions.status, 'approved'));
        const totalRevenue = parseFloat(totalRevenueResult[0].value || '0');

        const revenueByMethod = await db.select({
            method: transactions.paymentMethod,
            value: sum(transactions.amount).mapWith(Number)
        })
        .from(transactions)
        .where(eq(transactions.status, 'approved'))
        .groupBy(transactions.paymentMethod);
        
        const revenueByRegionData = await db
            .select({
                name: regions.name,
                color: regions.color,
                revenue: sql<number>`sum(${transactions.amount})`.mapWith(Number),
            })
            .from(supervisorProfiles)
            .innerJoin(regions, eq(supervisorProfiles.regionId, regions.id))
            .innerJoin(pastorProfiles, eq(supervisorProfiles.userId, pastorProfiles.supervisorId))
            .innerJoin(users, eq(pastorProfiles.userId, users.id))
            .innerJoin(transactions, eq(users.id, transactions.contributorId))
            .where(eq(transactions.status, 'approved'))
            .groupBy(regions.id, regions.name, regions.color);

        const churchesByRegionData = await db
            .select({
                name: regions.name,
                color: regions.color,
                count: count(churchProfiles.id),
            })
            .from(regions)
            .leftJoin(supervisorProfiles, eq(regions.id, supervisorProfiles.regionId))
            .leftJoin(churchProfiles, eq(supervisorProfiles.userId, churchProfiles.supervisorId))
            .groupBy(regions.id, regions.name, regions.color);

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
            .orderBy(desc(users.createdAt))
            .limit(10);
            
        const formattedRevenueByMethod = revenueByMethod.map(item => ({
            ...item,
            fill: item.method === 'pix' ? '#10b981' : item.method === 'credit_card' ? '#3b82f6' : '#f59e0b'
        }));
        
        const kpis = {
            totalRevenue,
            totalMembers,
            totalTransactions: totalTransactions[0].value,
            totalChurches: totalChurches[0].value,
            totalPastors: totalPastors[0].value,
            totalSupervisors: totalSupervisors[0].value,
            totalManagers: totalManagers[0].value
        };

        const recentTransactions = recentTransactionsData.map(t => ({...t, amount: Number(t.amount), date: format(new Date(t.date), 'dd/MM/yyyy')}));
        const recentRegistrations = recentRegistrationsData.map(u => ({...u, type: u.role, avatar: u.name.substring(0, 2).toUpperCase(), date: format(new Date(u.date), 'dd/MM/yyyy') }));
        
        return NextResponse.json({
            kpis,
            revenueByMethod: formattedRevenueByMethod,
            revenueByRegion: revenueByRegionData.map(r => ({...r, revenue: Number(r.revenue)})),
            churchesByRegion: churchesByRegionData,
            recentTransactions,
            recentRegistrations,
            newMembers: [
                { month: 'Jan', count: 120 }, { month: 'Fev', count: 150 }, { month: 'Mar', count: 170 }, 
                { month: 'Abr', count: 200 }, { month: 'Mai', count: 230 }, { month: 'Jun', count: 180 },
            ]
        });

    } catch (error: any) {
        console.error("Erro ao buscar dados para o dashboard do admin:", error);
        return NextResponse.json({ error: "Erro ao buscar dados do dashboard", details: error.message }, { status: 500 });
    }
}
