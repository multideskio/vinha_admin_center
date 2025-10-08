/**
 * @fileoverview Rota da API para gerenciar o gateway Bradesco.
 * @version 1.2
 * @date 2024-08-07
 * @author PH
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { gatewayConfigurations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'

const COMPANY_ID = process.env.COMPANY_INIT
if (!COMPANY_ID) {
  throw new Error('A variável de ambiente COMPANY_INIT não está definida.')
}
const VALIDATED_COMPANY_ID = COMPANY_ID as string
const GATEWAY_NAME = 'Bradesco'

const bradescoGatewaySchema = z.object({
  isActive: z.boolean().default(false),
  environment: z.enum(['production', 'development']),
  prodClientId: z.string().optional().nullable(),
  prodClientSecret: z.string().optional().nullable(),
  devClientId: z.string().optional().nullable(),
  devClientSecret: z.string().optional().nullable(),
  certificatePassword: z.string().optional().nullable(),
})

export async function GET(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const [config] = await db
      .select()
      .from(gatewayConfigurations)
      .where(
        and(
          eq(gatewayConfigurations.companyId, VALIDATED_COMPANY_ID),
          eq(gatewayConfigurations.gatewayName, GATEWAY_NAME),
        ),
      )
      .limit(1)

    if (!config) {
      const [newConfig] = await db
        .insert(gatewayConfigurations)
        .values({
          companyId: VALIDATED_COMPANY_ID,
          gatewayName: GATEWAY_NAME,
          isActive: false,
          environment: 'development',
        })
        .returning()
      return NextResponse.json({ config: newConfig })
    }

    return NextResponse.json({ config })
  } catch (error: unknown) {
    console.error(`Erro ao buscar configuração do gateway ${GATEWAY_NAME}:`, error)
    return NextResponse.json(
      {
        error: `Erro ao buscar configuração do gateway ${GATEWAY_NAME}`,
        details: getErrorMessage(error),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = bradescoGatewaySchema.parse(body)

    const [updatedConfig] = await db
      .update(gatewayConfigurations)
      .set(validatedData)
      .where(
        and(
          eq(gatewayConfigurations.companyId, VALIDATED_COMPANY_ID),
          eq(gatewayConfigurations.gatewayName, GATEWAY_NAME),
        ),
      )
      .returning()

    return NextResponse.json({ success: true, config: updatedConfig })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error(`Erro ao atualizar configuração do gateway ${GATEWAY_NAME}:`, error)
    return NextResponse.json(
      {
        error: `Erro ao atualizar configuração do gateway ${GATEWAY_NAME}`,
        details: getErrorMessage(error),
      },
      { status: 500 },
    )
  }
}
