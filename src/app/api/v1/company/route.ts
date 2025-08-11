
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authenticateApiKey } from '@/lib/api-auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const companyUpdateSchema = z.object({
  name: z.string().min(1, 'O nome da aplicação é obrigatório.').optional(),
  supportEmail: z.string().email('E-mail de suporte inválido.').optional(),
  logoUrl: z.string().url().optional().nullable(),
  maintenanceMode: z.boolean().optional(),
});

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
        const [company] = await db.select().from(companies).where(eq(companies.id, COMPANY_ID)).limit(1);

        if (!company) {
            return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
        }

        return NextResponse.json({ company });

    } catch (error: any) {
        console.error("Erro ao buscar dados da empresa:", error);
        return NextResponse.json({ error: "Erro ao buscar dados da empresa", details: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
        const body = await request.json();
        const validatedData = companyUpdateSchema.parse(body);

        const [updatedCompany] = await db.update(companies)
            .set({ ...validatedData, updatedAt: new Date() })
            .where(eq(companies.id, COMPANY_ID))
            .returning();
            
        return NextResponse.json({ success: true, company: updatedCompany });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao atualizar dados da empresa:", error);
        return NextResponse.json({ error: "Erro ao atualizar dados da empresa", details: error.message }, { status: 500 });
    }
}
