
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { gatewayConfigurations } from '@/db/schema';
import { eq } from 'drizzle-orm';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

export async function GET() {
  try {
    const allGateways = await db
      .select()
      .from(gatewayConfigurations)
      .where(eq(gatewayConfigurations.companyId, COMPANY_ID));
      
    return NextResponse.json({ gateways: allGateways });

  } catch (error) {
    console.error("Erro ao buscar gateways:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
