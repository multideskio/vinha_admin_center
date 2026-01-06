/**
 * @fileoverview API para buscar detalhes de uma transação específica
 * @version 1.0
 * @date 2025-01-06
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  transactions,
  users,
  churchProfiles,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
  adminProfiles,
} from '@/db/schema'
import { eq } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await validateRequest()
    if (!user || !['admin', 'manager', 'supervisor'].includes(user.role)) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const { id } = await params

    // Buscar transação com dados do contribuinte
    const [transactionData] = await db
      .select({
        // Dados da transação
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        paymentMethod: transactions.paymentMethod,
        description: transactions.description,
        gatewayTransactionId: transactions.gatewayTransactionId,
        refundRequestReason: transactions.refundRequestReason,
        installments: transactions.installments,
        createdAt: transactions.createdAt,
        // Campos de fraude
        isFraud: transactions.isFraud,
        fraudMarkedAt: transactions.fraudMarkedAt,
        fraudReason: transactions.fraudReason,
        fraudMarkedBy: transactions.fraudMarkedBy,
        // Dados do contribuinte
        contributorId: users.id,
        contributorEmail: users.email,
        contributorPhone: users.phone,
        contributorRole: users.role,
        // Igreja de origem
        originChurchId: transactions.originChurchId,
      })
      .from(transactions)
      .innerJoin(users, eq(transactions.contributorId, users.id))
      .where(eq(transactions.id, id))
      .limit(1)

    if (!transactionData) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    // Buscar nome do contribuinte baseado no role
    let contributorName = transactionData.contributorEmail
    if (transactionData.contributorRole === 'admin') {
      const [profile] = await db
        .select({ firstName: adminProfiles.firstName, lastName: adminProfiles.lastName })
        .from(adminProfiles)
        .where(eq(adminProfiles.userId, transactionData.contributorId))
        .limit(1)
      if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
    } else if (transactionData.contributorRole === 'manager') {
      const [profile] = await db
        .select({ firstName: managerProfiles.firstName, lastName: managerProfiles.lastName })
        .from(managerProfiles)
        .where(eq(managerProfiles.userId, transactionData.contributorId))
        .limit(1)
      if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
    } else if (transactionData.contributorRole === 'supervisor') {
      const [profile] = await db
        .select({ firstName: supervisorProfiles.firstName, lastName: supervisorProfiles.lastName })
        .from(supervisorProfiles)
        .where(eq(supervisorProfiles.userId, transactionData.contributorId))
        .limit(1)
      if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
    } else if (transactionData.contributorRole === 'pastor') {
      const [profile] = await db
        .select({ firstName: pastorProfiles.firstName, lastName: pastorProfiles.lastName })
        .from(pastorProfiles)
        .where(eq(pastorProfiles.userId, transactionData.contributorId))
        .limit(1)
      if (profile) contributorName = `${profile.firstName} ${profile.lastName}`
    } else if (transactionData.contributorRole === 'church_account') {
      const [profile] = await db
        .select({ nomeFantasia: churchProfiles.nomeFantasia })
        .from(churchProfiles)
        .where(eq(churchProfiles.userId, transactionData.contributorId))
        .limit(1)
      if (profile) contributorName = profile.nomeFantasia
    }

    // Buscar dados da igreja de origem (se houver)
    let churchData = null
    if (transactionData.originChurchId) {
      const [church] = await db
        .select({ nomeFantasia: churchProfiles.nomeFantasia, address: churchProfiles.address })
        .from(churchProfiles)
        .where(eq(churchProfiles.userId, transactionData.originChurchId))
        .limit(1)
      if (church) {
        churchData = {
          name: church.nomeFantasia,
          address: church.address,
        }
      }
    }

    // Formatar resposta
    const transaction = {
      id: transactionData.id,
      date: new Date(transactionData.createdAt).toLocaleString('pt-BR'),
      amount: parseFloat(transactionData.amount),
      status: transactionData.status,
      contributor: {
        id: transactionData.contributorId,
        name: contributorName,
        email: transactionData.contributorEmail,
        phone: transactionData.contributorPhone,
        role: transactionData.contributorRole,
      },
      church: churchData,
      payment: {
        method: transactionData.paymentMethod,
        details: transactionData.gatewayTransactionId || 'Não disponível',
      },
      refundRequestReason: transactionData.refundRequestReason,
      // Campos de fraude
      isFraud: transactionData.isFraud,
      fraudMarkedAt: transactionData.fraudMarkedAt?.toISOString() || null,
      fraudReason: transactionData.fraudReason,
    }

    return NextResponse.json({
      success: true,
      transaction,
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar transação' },
      { status: 500 },
    )
  }
}
