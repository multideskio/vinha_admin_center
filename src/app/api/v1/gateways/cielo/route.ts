
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { gatewayConfigurations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}
const GATEWAY_NAME = 'Cielo';

const cieloGatewaySchema = z.object({
    isActive: z.boolean().default(false),
    environment: z.enum(['production', 'development']),
    prodClientId: z.string().optional().nullable(),
    prodClientSecret: z.string().optional().nullable(),
    devClientId: z.string().optional().nullable(),
    devClientSecret: z.string().optional().nullable(),
    acceptedPaymentMethods: z.string().optional().nullable(),
});

export async function GET() {
    try {
        const [config] = await db.select()
            .from(gatewayConfigurations)
            .where(and(
                eq(gatewayConfigurations.companyId, COMPANY_ID),
                eq(gatewayConfigurations.gatewayName, GATEWAY_NAME)
            ))
            .limit(1);

        if (!config) {
            // Se não existir, cria uma configuração padrão
            const [newConfig] = await db.insert(gatewayConfigurations).values({
                companyId: COMPANY_ID,
                gatewayName: GATEWAY_NAME,
                isActive: false,
                environment: 'development',
            }).returning();
            return NextResponse.json({ config: newConfig });
        }
        
        return NextResponse.json({ config });
    } catch (error) {
        console.error(`Erro ao buscar configuração do gateway ${GATEWAY_NAME}:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const validatedData = cieloGatewaySchema.parse(body);

        const [updatedConfig] = await db.update(gatewayConfigurations)
            .set(validatedData)
            .where(and(
                eq(gatewayConfigurations.companyId, COMPANY_ID),
                eq(gatewayConfigurations.gatewayName, GATEWAY_NAME)
            ))
            .returning();
            
        return NextResponse.json({ success: true, config: updatedConfig });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error(`Erro ao atualizar configuração do gateway ${GATEWAY_NAME}:`, error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
