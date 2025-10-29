/**
 * @fileoverview API para geração de relatórios
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { users, transactions, churchProfiles } from '@/db/schema'
import { eq, and, between, isNull, desc } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'

export async function POST(request: Request) {
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  try {
    const { reportType, startDate, endDate, paymentMethod, paymentStatus } = await request.json()

    let data: Record<string, unknown> = {}

    const filters = { startDate, endDate, paymentMethod, paymentStatus }
    
    switch (reportType) {
      case 'fin-01':
        data = await generateFinancialReport(user.companyId, filters)
        break
      case 'mem-01':
        data = await generateMembershipReport(user.companyId, filters)
        break
      case 'ch-01':
        data = await generateChurchesReport(user.companyId, filters)
        break
      case 'con-01':
        data = await generateContributionsReport(user.companyId, filters)
        break
      default:
        return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}

type Filters = {
  startDate?: string
  endDate?: string
  paymentMethod?: string
  paymentStatus?: string
}

async function generateFinancialReport(companyId: string, filters: Filters) {
  const conditions = [eq(transactions.companyId, companyId)]
  
  if (filters.startDate && filters.endDate) {
    conditions.push(between(transactions.createdAt, new Date(filters.startDate), new Date(filters.endDate)))
  }
  if (filters.paymentMethod) {
    conditions.push(eq(transactions.paymentMethod, filters.paymentMethod as 'pix' | 'credit_card' | 'boleto'))
  }
  if (filters.paymentStatus) {
    conditions.push(eq(transactions.status, filters.paymentStatus as 'approved' | 'pending' | 'refused' | 'refunded'))
  }
  
  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

  const txs = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      status: transactions.status,
      paymentMethod: transactions.paymentMethod,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(whereClause)
    .orderBy(desc(transactions.createdAt))

  const total = txs.reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
  const approved = txs.filter(tx => tx.status === 'approved').length
  const pending = txs.filter(tx => tx.status === 'pending').length
  const refused = txs.filter(tx => tx.status === 'refused').length

  return {
    title: 'Relatório Financeiro Completo',
    headers: ['ID', 'Valor', 'Status', 'Método', 'Data'],
    rows: txs.map(tx => [
      tx.id.substring(0, 8),
      `R$ ${parseFloat(tx.amount).toFixed(2)}`,
      tx.status,
      tx.paymentMethod,
      new Date(tx.createdAt).toLocaleDateString('pt-BR'),
    ]),
    summary: [
      { label: 'Total de Transações', value: txs.length },
      { label: 'Aprovadas', value: approved },
      { label: 'Pendentes', value: pending },
      { label: 'Recusadas', value: refused },
      { label: 'Valor Total', value: `R$ ${total.toFixed(2)}` },
    ],
  }
}

async function generateMembershipReport(companyId: string, filters: Filters) {
  const allUsers = await db
    .select({
      id: users.id,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.companyId, companyId), isNull(users.deletedAt)))

  const byRole = allUsers.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const active = allUsers.filter(u => u.status === 'active').length
  const inactive = allUsers.filter(u => u.status === 'inactive').length

  return {
    title: 'Relatório de Membresia',
    headers: ['Tipo', 'Quantidade'],
    rows: Object.entries(byRole).map(([role, count]) => [role, count]),
    summary: [
      { label: 'Total de Usuários', value: allUsers.length },
      { label: 'Ativos', value: active },
      { label: 'Inativos', value: inactive },
    ],
  }
}

async function generateChurchesReport(companyId: string, filters: Filters) {
  const whereClause = and(eq(users.companyId, companyId), eq(users.role, 'church_account'), isNull(users.deletedAt))
  
  const churches = await db
    .select({
      id: users.id,
      nomeFantasia: churchProfiles.nomeFantasia,
      city: churchProfiles.city,
      state: churchProfiles.state,
      status: users.status,
    })
    .from(users)
    .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
    .where(whereClause)

  return {
    title: 'Relatório de Igrejas',
    headers: ['Nome', 'Cidade', 'Estado', 'Status'],
    rows: churches.map(ch => [
      ch.nomeFantasia || 'N/A',
      ch.city || 'N/A',
      ch.state || 'N/A',
      ch.status,
    ]),
    summary: [
      { label: 'Total de Igrejas', value: churches.length },
      { label: 'Ativas', value: churches.filter(c => c.status === 'active').length },
    ],
  }
}

async function generateContributionsReport(companyId: string, filters: Filters) {
  const conditions = [
    eq(transactions.companyId, companyId),
    eq(transactions.status, (filters.paymentStatus as 'approved' | 'pending' | 'refused' | 'refunded') || 'approved')
  ]
  
  if (filters.startDate && filters.endDate) {
    conditions.push(between(transactions.createdAt, new Date(filters.startDate), new Date(filters.endDate)))
  }
  if (filters.paymentMethod) {
    conditions.push(eq(transactions.paymentMethod, filters.paymentMethod as 'pix' | 'credit_card' | 'boleto'))
  }
  
  const whereClause = and(...conditions)

  const contributions = await db
    .select({
      paymentMethod: transactions.paymentMethod,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(whereClause)

  const byMethod = contributions.reduce((acc, c) => {
    const method = c.paymentMethod
    if (!acc[method]) {
      acc[method] = { count: 0, total: 0 }
    }
    acc[method].count++
    acc[method].total += parseFloat(c.amount)
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  const totalAmount = contributions.reduce((sum, c) => sum + parseFloat(c.amount), 0)

  return {
    title: 'Relatório de Contribuições por Tipo',
    headers: ['Método', 'Quantidade', 'Valor Total'],
    rows: Object.entries(byMethod).map(([method, data]) => [
      method,
      data.count,
      `R$ ${data.total.toFixed(2)}`,
    ]),
    summary: [
      { label: 'Total de Contribuições', value: contributions.length },
      { label: 'Valor Total Arrecadado', value: `R$ ${totalAmount.toFixed(2)}` },
    ],
  }
}
