
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { gatewayConfigurations } from '@/db/schema';
import { eq } from 'drizzle-orm';

const MOCK_COMPANY_ID = "b46ba55d-32d7-43d2-a176-7ab93d7b14dc";

export async function GET() {
  try {
    const allGateways = await db
      .select()
      .from(gatewayConfigurations)
      .where(eq(gatewayConfigurations.companyId, MOCK_COMPANY_ID));
      
    return NextResponse.json({ gateways: allGateways });

  } catch (error) {
    console.error("Erro ao buscar gateways:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
