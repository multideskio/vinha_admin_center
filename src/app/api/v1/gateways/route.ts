/**
* @fileoverview Rota da API para listar todos os gateways configurados.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { gatewayConfigurations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateApiKey } from '@/lib/api-auth';
import { validateRequest } from '@/lib/auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

export async function GET(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

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
