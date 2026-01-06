/**
 * @fileoverview API para perfil rápido do contribuinte
 * @version 1.0
 * @date 2026-01-06
 * @author Kiro
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  users,
  transactions,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
  churchProfiles,
  regions,
} from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await validateRequest()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { id: userId } = await params

    // Buscar dados básicos do usuário
    const [userData] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!userData) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Buscar perfil específico baseado no role
    let profile: Record<string, unknown> | null = null
    let hierarchyInfo: Record<string, unknown> | null = null

    if (userData.role === 'manager') {
      const [managerProfile] = await db
        .select()
        .from(managerProfiles)
        .where(eq(managerProfiles.userId, userId))
        .limit(1)
      profile = managerProfile || null
    } else if (userData.role === 'supervisor') {
      const [supervisorProfile] = await db
        .select()
        .from(supervisorProfiles)
        .where(eq(supervisorProfiles.userId, userId))
        .limit(1)
      profile = supervisorProfile || null

      // Buscar informações do gerente
      if (supervisorProfile?.managerId) {
        const [managerData] = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: managerProfiles.firstName,
            lastName: managerProfiles.lastName,
          })
          .from(users)
          .innerJoin(managerProfiles, eq(users.id, managerProfiles.userId))
          .where(eq(users.id, supervisorProfile.managerId))
          .limit(1)

        // Buscar informações da região
        let regionData = null
        if (supervisorProfile.regionId) {
          const [region] = await db
            .select({
              id: regions.id,
              name: regions.name,
              color: regions.color,
            })
            .from(regions)
            .where(eq(regions.id, supervisorProfile.regionId))
            .limit(1)
          regionData = region
        }

        hierarchyInfo = {
          manager: managerData
            ? {
                id: managerData.id,
                name: `${managerData.firstName} ${managerData.lastName}`,
                email: managerData.email,
              }
            : null,
          region: regionData
            ? {
                id: regionData.id,
                name: regionData.name,
                color: regionData.color,
              }
            : null,
        }
      }
    } else if (userData.role === 'pastor') {
      const [pastorProfile] = await db
        .select()
        .from(pastorProfiles)
        .where(eq(pastorProfiles.userId, userId))
        .limit(1)
      profile = pastorProfile || null

      // Buscar informações do supervisor e gerente
      if (pastorProfile?.supervisorId) {
        const [supervisorData] = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: supervisorProfiles.firstName,
            lastName: supervisorProfiles.lastName,
            managerId: supervisorProfiles.managerId,
            regionId: supervisorProfiles.regionId,
          })
          .from(users)
          .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
          .where(eq(users.id, pastorProfile.supervisorId))
          .limit(1)

        let managerData = null
        let regionData = null

        if (supervisorData?.managerId) {
          const [manager] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: managerProfiles.firstName,
              lastName: managerProfiles.lastName,
            })
            .from(users)
            .innerJoin(managerProfiles, eq(users.id, managerProfiles.userId))
            .where(eq(users.id, supervisorData.managerId))
            .limit(1)
          managerData = manager
        }

        if (supervisorData?.regionId) {
          const [region] = await db
            .select({
              id: regions.id,
              name: regions.name,
              color: regions.color,
            })
            .from(regions)
            .where(eq(regions.id, supervisorData.regionId))
            .limit(1)
          regionData = region
        }

        hierarchyInfo = {
          supervisor: supervisorData
            ? {
                id: supervisorData.id,
                name: `${supervisorData.firstName} ${supervisorData.lastName}`,
                email: supervisorData.email,
              }
            : null,
          manager: managerData
            ? {
                id: managerData.id,
                name: `${managerData.firstName} ${managerData.lastName}`,
                email: managerData.email,
              }
            : null,
          region: regionData
            ? {
                id: regionData.id,
                name: regionData.name,
                color: regionData.color,
              }
            : null,
        }

        // Buscar igrejas supervisionadas pelo pastor
        const churches = await db
          .select({
            id: users.id,
            email: users.email,
            nomeFantasia: churchProfiles.nomeFantasia,
          })
          .from(users)
          .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
          .where(eq(churchProfiles.supervisorId, userId))

        if (churches.length > 0) {
          hierarchyInfo.churches = churches.map((church) => ({
            id: church.id,
            name: church.nomeFantasia,
            email: church.email,
          }))
        }
      }
    } else if (userData.role === 'church_account') {
      const [churchProfile] = await db
        .select()
        .from(churchProfiles)
        .where(eq(churchProfiles.userId, userId))
        .limit(1)
      profile = churchProfile || null

      // Buscar informações do supervisor e gerente através do supervisorId
      if (churchProfile?.supervisorId) {
        const [supervisorData] = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: supervisorProfiles.firstName,
            lastName: supervisorProfiles.lastName,
            managerId: supervisorProfiles.managerId,
            regionId: supervisorProfiles.regionId,
          })
          .from(users)
          .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
          .where(eq(users.id, churchProfile.supervisorId))
          .limit(1)

        let managerData = null
        let regionData = null

        if (supervisorData?.managerId) {
          const [manager] = await db
            .select({
              id: users.id,
              email: users.email,
              firstName: managerProfiles.firstName,
              lastName: managerProfiles.lastName,
            })
            .from(users)
            .innerJoin(managerProfiles, eq(users.id, managerProfiles.userId))
            .where(eq(users.id, supervisorData.managerId))
            .limit(1)
          managerData = manager
        }

        if (supervisorData?.regionId) {
          const [region] = await db
            .select({
              id: regions.id,
              name: regions.name,
              color: regions.color,
            })
            .from(regions)
            .where(eq(regions.id, supervisorData.regionId))
            .limit(1)
          regionData = region
        }

        hierarchyInfo = {
          supervisor: supervisorData
            ? {
                id: supervisorData.id,
                name: `${supervisorData.firstName} ${supervisorData.lastName}`,
                email: supervisorData.email,
              }
            : null,
          manager: managerData
            ? {
                id: managerData.id,
                name: `${managerData.firstName} ${managerData.lastName}`,
                email: managerData.email,
              }
            : null,
          region: regionData
            ? {
                id: regionData.id,
                name: regionData.name,
                color: regionData.color,
              }
            : null,
        }
      }
    }

    // Buscar últimas 10 transações aprovadas (pagas)
    const recentTransactions = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        paymentMethod: transactions.paymentMethod,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.contributorId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(50) // Buscar mais para filtrar apenas as aprovadas

    // Filtrar apenas transações aprovadas e pegar as 10 mais recentes
    const approvedTransactions = recentTransactions
      .filter((t) => t.status === 'approved')
      .slice(0, 10)

    // Formatar nome do usuário
    let userName = userData.email
    if (profile) {
      if (profile.firstName && profile.lastName) {
        userName = `${profile.firstName} ${profile.lastName}`
      } else if (profile.nomeFantasia) {
        userName = profile.nomeFantasia as string
      }
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        name: userName,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt,
      },
      profile,
      hierarchy: hierarchyInfo,
      recentTransactions: approvedTransactions.map((t) => ({
        id: t.id,
        amount: parseFloat(t.amount),
        status: t.status,
        paymentMethod: t.paymentMethod,
        date: t.createdAt,
      })),
    })
  } catch (error) {
    console.error('[QUICK_PROFILE_ERROR]', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
