/**
 * @fileoverview Rota da API para gerenciar os dados da empresa.
 * @version 1.3
 * @date 2024-08-07
 * @author PH
 * @lastReview 2026-01-05 14:30 - Segurança e funcionalidades verificadas
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { companies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { validateRequest } from '@/lib/jwt'
import { getErrorMessage } from '@/lib/error-types'
import { env } from '@/lib/env'
import { getCache, setCache, invalidateCache } from '@/lib/cache'

const COMPANY_ID = env.COMPANY_INIT
const VALIDATED_COMPANY_ID = COMPANY_ID

/** TTL de 15 minutos — dados da empresa mudam quase nunca */
const COMPANY_CACHE_TTL = 900

const companyUpdateSchema = z.object({
  name: z.string().min(1, 'O nome da aplicação é obrigatório.').optional(),
  supportEmail: z.string().email('E-mail de suporte inválido.').optional(),
  logoUrl: z.string().url('URL da logo inválida.').optional().nullable(),
  maintenanceMode: z.boolean().optional(),
})

export async function GET(): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const cacheKey = `company:${VALIDATED_COMPANY_ID}`
    const cached = await getCache<{ company: unknown }>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, VALIDATED_COMPANY_ID))
      .limit(1)

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
    }

    const response = { company }
    await setCache(cacheKey, response, COMPANY_CACHE_TTL)
    return NextResponse.json(response)
  } catch (error: unknown) {
    console.error('Erro ao buscar dados da empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados da empresa', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request): Promise<NextResponse> {
  const { user } = await validateRequest()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const validatedData = companyUpdateSchema.parse(body)

    const [updatedCompany] = await db
      .update(companies)
      .set({ ...validatedData, updatedAt: new Date() })
      .where(eq(companies.id, VALIDATED_COMPANY_ID))
      .returning()

    // Invalidar cache da empresa após atualização
    await invalidateCache(`company:${VALIDATED_COMPANY_ID}`)

    return NextResponse.json({ success: true, company: updatedCompany })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: error.errors },
        { status: 400 },
      )
    }
    console.error('Erro ao atualizar dados da empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar dados da empresa', details: getErrorMessage(error) },
      { status: 500 },
    )
  }
}
