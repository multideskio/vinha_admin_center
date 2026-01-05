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

const COMPANY_ID = process.env.COMPANY_INIT
if (!COMPANY_ID) {
  throw new Error('COMPANY_INIT environment variable is required')
}
const VALIDATED_COMPANY_ID = COMPANY_ID as string

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
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, VALIDATED_COMPANY_ID))
      .limit(1)

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ company })
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
