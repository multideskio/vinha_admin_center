import { notFound } from 'next/navigation'
import { requireSupervisorOrAbove } from '@/lib/auth/require-role'
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
import type { TransactionDetails } from '@/types/transaction'
import { TransactionDetailsClient } from './_components/transaction-details-client'

/**
 * Página de Detalhes de Transação - Server Component
 * Busca dados no servidor e renderiza componente client
 * @lastReview 2026-02-11 - Refatorado para Server Component
 */
export default async function TransacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Validar autenticação e autorização (admin, manager ou supervisor)
  await requireSupervisorOrAbove()

  const { id } = await params

  // Buscar transação diretamente do banco
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
      gateway: transactions.gateway,
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
    notFound()
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

  // Formatar dados para o tipo TransactionDetails
  const transaction: TransactionDetails = {
    id: transactionData.id,
    date: new Date(transactionData.createdAt).toLocaleString('pt-BR'),
    amount: parseFloat(transactionData.amount),
    status: transactionData.status as 'approved' | 'pending' | 'refused' | 'refunded',
    gateway: transactionData.gateway || 'Cielo',
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
    isFraud: transactionData.isFraud || false,
    fraudMarkedAt: transactionData.fraudMarkedAt?.toISOString() || null,
    fraudReason: transactionData.fraudReason,
  }

  return <TransactionDetailsClient transaction={transaction} />
}
