/**
 * @fileoverview Utilitários para gerenciar configurações da empresa
 * @date 2026-01-05
 */

import { db } from '@/db/drizzle'
import { companies, otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCompanyId } from './utils'

export interface CompanySettings {
  id: string
  name: string
  logoUrl?: string | null
  supportEmail?: string | null
  maintenanceMode: boolean
  createdAt: Date
  updatedAt?: Date | null
}

/**
 * Busca as configurações da empresa atual
 */
export async function getCompanySettings(): Promise<CompanySettings | null> {
  try {
    const companyId = getCompanyId()
    
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1)

    if (!company) {
      return null
    }

    return {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      supportEmail: company.supportEmail,
      maintenanceMode: company.maintenanceMode,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    }
  } catch (error) {
    console.error('Erro ao buscar configurações da empresa:', error)
    return null
  }
}

/**
 * Busca configurações completas da empresa (incluindo outras configurações)
 */
export async function getFullCompanySettings(companyId?: string) {
  try {
    const targetCompanyId = companyId || getCompanyId()
    
    const [company, settings] = await Promise.all([
      db
        .select()
        .from(companies)
        .where(eq(companies.id, targetCompanyId))
        .limit(1),
      db
        .select()
        .from(otherSettings)
        .where(eq(otherSettings.companyId, targetCompanyId))
        .limit(1)
    ])

    return {
      company: company[0] || null,
      settings: settings[0] || null,
    }
  } catch (error) {
    console.error('Erro ao buscar configurações completas da empresa:', error)
    return {
      company: null,
      settings: null,
    }
  }
}