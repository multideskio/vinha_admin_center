/**
 * @fileoverview API pública para configurações básicas da empresa (sem autenticação)
 * @date 2026-01-05
 * @author Kiro
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { companies } from '@/db/schema'
import { eq } from 'drizzle-orm'

const COMPANY_ID = process.env.COMPANY_INIT
if (!COMPANY_ID) {
  throw new Error('COMPANY_INIT environment variable is required')
}
const VALIDATED_COMPANY_ID = COMPANY_ID as string

/**
 * GET - Buscar configurações públicas da empresa (sem autenticação)
 * Retorna apenas dados seguros para exibição pública (nome, logo)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const [company] = await db
      .select({
        id: companies.id,
        name: companies.name,
        logoUrl: companies.logoUrl,
        maintenanceMode: companies.maintenanceMode,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt,
      })
      .from(companies)
      .where(eq(companies.id, VALIDATED_COMPANY_ID))
      .limit(1)

    if (!company) {
      // Retornar configurações padrão se empresa não encontrada
      return NextResponse.json({
        company: {
          id: VALIDATED_COMPANY_ID,
          name: 'Vinha Admin Center',
          logoUrl: null,
          maintenanceMode: false,
          createdAt: new Date(),
          updatedAt: null,
        },
      })
    }

    return NextResponse.json({ company })
  } catch (error: unknown) {
    console.error('Erro ao buscar configurações públicas da empresa:', error)

    // Em caso de erro, retornar configurações padrão
    return NextResponse.json({
      company: {
        id: VALIDATED_COMPANY_ID,
        name: 'Vinha Admin Center',
        logoUrl: null,
        maintenanceMode: false,
        createdAt: new Date(),
        updatedAt: null,
      },
    })
  }
}
