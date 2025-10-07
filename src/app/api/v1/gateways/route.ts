/**
 * @fileoverview Rota da API para listar todos os gateways configurados.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'

const COMPANY_ID = process.env.COMPANY_INIT
if (!COMPANY_ID) {
  throw new Error('A variável de ambiente COMPANY_INIT não está definida.')
}
const VALIDATED_COMPANY_ID = COMPANY_ID as string

export async function GET(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const allGateways = await db
      .select()
      .from(gatewayConfigurations)
      .where(eq(gatewayConfigurations.companyId, VALIDATED_COMPANY_ID))

    return NextResponse.json({ gateways: allGateways })
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error)
    console.error('Erro ao buscar gateways:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar gateways', details: errorMessage },
      { status: 500 },
    )
  }
}
