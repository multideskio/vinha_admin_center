
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { companies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";

const companyUpdateSchema = z.object({
  name: z.string().min(1, 'O nome da aplicação é obrigatório.').optional(),
  supportEmail: z.string().email('E-mail de suporte inválido.').optional(),
  logoUrl: z.string().url().optional().nullable(),
  maintenanceMode: z.boolean().optional(),
});

export async function GET() {
    try {
        const [company] = await db.select().from(companies).where(eq(companies.id, MOCK_COMPANY_ID)).limit(1);

        if (!company) {
            return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
        }

        return NextResponse.json({ company });

    } catch (error) {
        console.error("Erro ao buscar dados da empresa:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const validatedData = companyUpdateSchema.parse(body);

        const [updatedCompany] = await db.update(companies)
            .set({ ...validatedData, updatedAt: new Date() })
            .where(eq(companies.id, MOCK_COMPANY_ID))
            .returning();
            
        return NextResponse.json({ success: true, company: updatedCompany });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao atualizar dados da empresa:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
