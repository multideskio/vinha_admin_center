
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { gatewayConfigurations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateApiKey } from '@/lib/api-auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

  try {
    const allGateways = await db
      .select()
      .from(gatewayConfigurations)
      .where(eq(gatewayConfigurations.companyId, COMPANY_ID));
      
    return NextResponse.json({ gateways: allGateways });

  } catch (error: any) {
    console.error("Erro ao buscar gateways:", error);
    return NextResponse.json({ error: "Erro ao buscar gateways", details: error.message }, { status: 500 });
  }
}
