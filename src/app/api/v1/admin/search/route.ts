/**
 * @fileoverview API de busca global para administradores
 * @version 1.0
 * @date 2025-01-06
 * @author PH
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/lib/jwt'
import { db } from '@/db/drizzle'
import {
  users,
  adminProfiles,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
  churchProfiles,
  transactions,
} from '@/db/schema'
import { and, eq, isNull, or, ilike } from 'drizzle-orm'
import { handleApiError } from '@/lib/api-error-handler'

export async function GET(request: NextRequest) {
  const { user } = await validateRequest()

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [] })
  }

  try {
    const searchTerm = `%${query.toLowerCase()}%`
    const results = []

    // Buscar administradores
    const admins = await db
      .select({
        id: users.id,
        firstName: adminProfiles.firstName,
        lastName: adminProfiles.lastName,
        email: users.email,
        cpf: adminProfiles.cpf,
      })
      .from(users)
      .leftJoin(adminProfiles, eq(users.id, adminProfiles.userId))
      .where(
        and(
          eq(users.role, 'admin'),
          isNull(users.deletedAt),
          or(
            ilike(adminProfiles.firstName, searchTerm),
            ilike(adminProfiles.lastName, searchTerm),
            ilike(users.email, searchTerm),
            ilike(adminProfiles.cpf, searchTerm),
          ),
        ),
      )
      .limit(5)

    results.push(
      ...admins.map((admin) => ({
        id: admin.id,
        type: 'admin' as const,
        title: `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email,
        subtitle: admin.email,
        description: `Administrador • CPF: ${admin.cpf || 'N/A'}`,
        href: `/admin/administradores/${admin.id}`,
      })),
    )

    // Buscar gerentes
    const managers = await db
      .select({
        id: users.id,
        firstName: managerProfiles.firstName,
        lastName: managerProfiles.lastName,
        email: users.email,
        cpf: managerProfiles.cpf,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(
        and(
          eq(users.role, 'manager'),
          isNull(users.deletedAt),
          or(
            ilike(managerProfiles.firstName, searchTerm),
            ilike(managerProfiles.lastName, searchTerm),
            ilike(users.email, searchTerm),
            ilike(managerProfiles.cpf, searchTerm),
          ),
        ),
      )
      .limit(5)

    results.push(
      ...managers.map((manager) => ({
        id: manager.id,
        type: 'manager' as const,
        title: `${manager.firstName || ''} ${manager.lastName || ''}`.trim() || manager.email,
        subtitle: manager.email,
        description: `Gerente • CPF: ${manager.cpf || 'N/A'}`,
        href: `/admin/gerentes/${manager.id}`,
      })),
    )

    // Buscar supervisores
    const supervisors = await db
      .select({
        id: users.id,
        firstName: supervisorProfiles.firstName,
        lastName: supervisorProfiles.lastName,
        email: users.email,
        cpf: supervisorProfiles.cpf,
      })
      .from(users)
      .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .where(
        and(
          eq(users.role, 'supervisor'),
          isNull(users.deletedAt),
          or(
            ilike(supervisorProfiles.firstName, searchTerm),
            ilike(supervisorProfiles.lastName, searchTerm),
            ilike(users.email, searchTerm),
            ilike(supervisorProfiles.cpf, searchTerm),
          ),
        ),
      )
      .limit(5)

    results.push(
      ...supervisors.map((supervisor) => ({
        id: supervisor.id,
        type: 'supervisor' as const,
        title:
          `${supervisor.firstName || ''} ${supervisor.lastName || ''}`.trim() || supervisor.email,
        subtitle: supervisor.email,
        description: `Supervisor • CPF: ${supervisor.cpf || 'N/A'}`,
        href: `/admin/supervisores/${supervisor.id}`,
      })),
    )

    // Buscar pastores
    const pastors = await db
      .select({
        id: users.id,
        firstName: pastorProfiles.firstName,
        lastName: pastorProfiles.lastName,
        email: users.email,
        cpf: pastorProfiles.cpf,
      })
      .from(users)
      .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .where(
        and(
          eq(users.role, 'pastor'),
          isNull(users.deletedAt),
          or(
            ilike(pastorProfiles.firstName, searchTerm),
            ilike(pastorProfiles.lastName, searchTerm),
            ilike(users.email, searchTerm),
            ilike(pastorProfiles.cpf, searchTerm),
          ),
        ),
      )
      .limit(5)

    results.push(
      ...pastors.map((pastor) => ({
        id: pastor.id,
        type: 'pastor' as const,
        title: `${pastor.firstName || ''} ${pastor.lastName || ''}`.trim() || pastor.email,
        subtitle: pastor.email,
        description: `Pastor • CPF: ${pastor.cpf || 'N/A'}`,
        href: `/admin/pastores/${pastor.id}`,
      })),
    )

    // Buscar igrejas
    const churches = await db
      .select({
        id: users.id,
        nomeFantasia: churchProfiles.nomeFantasia,
        razaoSocial: churchProfiles.razaoSocial,
        email: users.email,
        cnpj: churchProfiles.cnpj,
      })
      .from(users)
      .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(
        and(
          eq(users.role, 'church_account'),
          isNull(users.deletedAt),
          or(
            ilike(churchProfiles.nomeFantasia, searchTerm),
            ilike(churchProfiles.razaoSocial, searchTerm),
            ilike(churchProfiles.cnpj, searchTerm),
            ilike(users.email, searchTerm),
          ),
        ),
      )
      .limit(5)

    results.push(
      ...churches.map((church) => ({
        id: church.id,
        type: 'igreja' as const,
        title: church.nomeFantasia || church.razaoSocial || church.email,
        subtitle: church.email,
        description: `Igreja • CNPJ: ${church.cnpj || 'N/A'}`,
        href: `/admin/igrejas/${church.id}`,
      })),
    )

    // Buscar transações (últimas 10 que correspondem ao termo)
    const transactionResults = await db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        createdAt: transactions.createdAt,
        contributorEmail: users.email,
        contributorId: users.id,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.contributorId, users.id))
      .where(and(isNull(transactions.deletedAt), ilike(users.email, searchTerm)))
      .orderBy(transactions.createdAt)
      .limit(5)

    results.push(
      ...transactionResults.map((transaction) => ({
        id: transaction.id,
        type: 'transacao' as const,
        title: `Transação ${transaction.id.slice(0, 8)}...`,
        subtitle: `R$ ${(Number(transaction.amount || 0) / 100).toFixed(2)}`,
        description: `${transaction.contributorEmail} • ${new Date(transaction.createdAt).toLocaleDateString('pt-BR')}`,
        href: `/admin/transacoes/${transaction.id}`,
        status: transaction.status,
      })),
    )

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Erro na busca global:', error)
    return handleApiError(error)
  }
}
