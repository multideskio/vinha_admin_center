
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, regions, transactions, pastorProfiles, supervisorProfiles, churchProfiles, managerProfiles } from '@/db/schema';
import { count, sum, eq, isNull, and, desc } from 'drizzle-orm';
import { format } from 'date-fns';

export async function GET() {
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
        
        // CORREÇÃO: Simplificando a query para evitar o erro de join complexo.
        const revenueByRegionData = await db
            .select({
                name: regions.name,
                color: regions.color,
                revenue: sum(transactions.amount).mapWith(Number),
            })
            .from(transactions)
            .innerJoin(users, eq(transactions.contributorId, users.id))
            .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId)) // Assumindo que pastores fazem as contribuições
            .innerJoin(supervisorProfiles, eq(pastorProfiles.supervisorId, supervisorProfiles.userId))
            .innerJoin(regions, eq(supervisorProfiles.regionId, regions.id))
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
                name: users.email, // Ajustar para pegar o nome do perfil
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
                name: users.email, // Ajustar para pegar o nome do perfil
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
            // Mocked data for now
            newMembers: [
                { month: 'Jan', count: 120 }, { month: 'Fev', count: 150 }, { month: 'Mar', count: 170 }, 
                { month: 'Abr', count: 200 }, { month: 'Mai', count: 230 }, { month: 'Jun', count: 180 },
            ]
        });

    } catch (error) {
        console.error("Erro ao buscar dados para o dashboard do admin:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
