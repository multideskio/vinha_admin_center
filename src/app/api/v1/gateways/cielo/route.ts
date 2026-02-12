/**
 * @fileoverview Rota da API para gerenciar o gateway Cielo.
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
import { env } from '@/lib/env'
import { configCache, CACHE_KEYS } from '@/lib/config-cache'

const COMPANY_ID = env.COMPANY_INIT
const VALIDATED_COMPANY_ID = COMPANY_ID
const GATEWAY_NAME = 'Cielo'

/** Campos sensíveis que não devem ser retornados na resposta da API */
const SECRET_FIELDS = ['prodClientSecret', 'devClientSecret'] as const

/** Remove campos sensíveis e adiciona flags de presença */
function sanitizeGatewayResponse(config: Record<string, unknown>) {
  const safe: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(config)) {
    if (!(SECRET_FIELDS as readonly string[]).includes(key)) {
      safe[key] = value
    }
  }
  safe.hasProdSecret = !!config.prodClientSecret
  safe.hasDevSecret = !!config.devClientSecret
  return safe
}

const cieloGatewaySchema = z.object({
  isActive: z.boolean().default(false),
  environment: z.enum(['production', 'development']),
  prodClientId: z.string().optional().nullable(),
  prodClientSecret: z.string().optional().nullable(),
  devClientId: z.string().optional().nullable(),
  devClientSecret: z.string().optional().nullable(),
  acceptedPaymentMethods: z.string().optional().nullable(),
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
      // Se não existir, cria uma configuração padrão
      const [newConfig] = await db
        .insert(gatewayConfigurations)
        .values({
          companyId: VALIDATED_COMPANY_ID,
          gatewayName: GATEWAY_NAME,
          isActive: false,
          environment: 'development',
        })
        .returning()
      // Não retornar secrets na resposta
      if (!newConfig) {
        return NextResponse.json({ error: 'Falha ao criar configuração.' }, { status: 500 })
      }
      return NextResponse.json({
        config: sanitizeGatewayResponse(newConfig),
      })
    }

    // ✅ SEGURANÇA: Não retornar secrets (MerchantKey) na resposta
    return NextResponse.json({
      config: sanitizeGatewayResponse(config),
    })
  } catch (error) {
    console.error(`Erro ao buscar configuração do gateway ${GATEWAY_NAME}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro ao buscar configuração do gateway ${GATEWAY_NAME}`, details: errorMessage },
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
    const validatedData = cieloGatewaySchema.parse(body)

    // ✅ SEGURANÇA: Não sobrescrever secrets com string vazia
    // Se o frontend envia vazio/null, significa que não alterou o secret
    const updateData: Record<string, unknown> = { ...validatedData }
    if (!validatedData.prodClientSecret) {
      delete updateData.prodClientSecret
    }
    if (!validatedData.devClientSecret) {
      delete updateData.devClientSecret
    }

    // Se ativando a Cielo, desativar outros gateways (exclusão mútua)
    if (validatedData.isActive) {
      await db
        .update(gatewayConfigurations)
        .set({ isActive: false })
        .where(
          and(
            eq(gatewayConfigurations.companyId, VALIDATED_COMPANY_ID),
            eq(gatewayConfigurations.isActive, true),
          ),
        )
    }

    const [updatedConfig] = await db
      .update(gatewayConfigurations)
      .set(updateData)
      .where(
        and(
          eq(gatewayConfigurations.companyId, VALIDATED_COMPANY_ID),
          eq(gatewayConfigurations.gatewayName, GATEWAY_NAME),
        ),
      )
      .returning()

    // ✅ Invalidar cache após atualização
    configCache.invalidate(CACHE_KEYS.CIELO_CONFIG(VALIDATED_COMPANY_ID))

    // ✅ SEGURANÇA: Não retornar secrets na resposta do PUT
    if (!updatedConfig) {
      return NextResponse.json({ error: 'Falha ao atualizar configuração.' }, { status: 500 })
    }
    return NextResponse.json({
      success: true,
      config: sanitizeGatewayResponse(updatedConfig),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error(`Erro ao atualizar configuração do gateway ${GATEWAY_NAME}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro ao atualizar configuração do gateway ${GATEWAY_NAME}`, details: errorMessage },
      { status: 500 },
    )
  }
}
