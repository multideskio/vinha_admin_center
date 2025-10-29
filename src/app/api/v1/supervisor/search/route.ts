/**
 * @fileoverview API de busca global para supervisores
 * @version 1.0
 * @date 2025-01-28
 * @author Sistema de Busca Global
 */

import { NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import {
  users,
  pastorProfiles,
  churchProfiles,
  transactions,
} from '@/db/schema'
import { eq, and, isNull, ilike, or, inArray } from 'drizzle-orm'
import { validateRequest } from '@/lib/jwt'

export async function GET(request: Request): Promise<NextResponse> {
  const { user: sessionUser } = await validateRequest()
  
  if (!sessionUser || sessionUser.role !== 'supervisor') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  if (!query || query.length < 3) {
    return NextResponse.json({ results: [] })
  }

  try {
    const searchTerm = `%${query}%`
    
    // Buscar pastores
    const pastorsRaw = await db
      .select({
        id: users.id,
        firstName: pastorProfiles.firstName,
        lastName: pastorProfiles.lastName,
        email: users.email,
      })
      .from(users)
      .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .where(
        and(
          eq(users.role, 'pastor'),
          eq(pastorProfiles.supervisorId, sessionUser.id),
          isNull(users.deletedAt),
          or(
            ilike(pastorProfiles.firstName, searchTerm),
            ilike(pastorProfiles.lastName, searchTerm),
            ilike(users.email, searchTerm),
            ilike(pastorProfiles.cpf, searchTerm)
          )
        )
      )
      .limit(5)

    const pastors = pastorsRaw.map(p => ({
      id: p.id,
      type: 'pastor' as const,
      title: p.firstName,
      subtitle: p.lastName,
      description: p.email,
      href: `/supervisor/pastores/${p.id}`,
    }))

    // Buscar igrejas
    const churchesRaw = await db
      .select({
        id: users.id,
        nomeFantasia: churchProfiles.nomeFantasia,
        razaoSocial: churchProfiles.razaoSocial,
        cnpj: churchProfiles.cnpj,
      })
      .from(users)
      .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(
        and(
          eq(users.role, 'church_account'),
          eq(churchProfiles.supervisorId, sessionUser.id),
          isNull(users.deletedAt),
          or(
            ilike(churchProfiles.nomeFantasia, searchTerm),
            ilike(churchProfiles.razaoSocial, searchTerm),
            ilike(churchProfiles.cnpj, searchTerm)
          )
        )
      )
      .limit(5)

    const churches = churchesRaw.map(c => ({
      id: c.id,
      type: 'igreja' as const,
      title: c.nomeFantasia,
      subtitle: c.razaoSocial,
      description: c.cnpj,
      href: `/supervisor/igrejas/${c.id}`,
    }))

    // Buscar transações (IDs de pastores e igrejas da supervisão)
    const pastorIds = await db
      .select({ id: pastorProfiles.userId })
      .from(pastorProfiles)
      .where(eq(pastorProfiles.supervisorId, sessionUser.id))

    const churchIds = await db
      .select({ id: churchProfiles.userId })
      .from(churchProfiles)
      .where(eq(churchProfiles.supervisorId, sessionUser.id))

    const networkUserIds = [
      sessionUser.id,
      ...pastorIds.map(p => p.id),
      ...churchIds.map(c => c.id)
    ]

    const transactionResultsRaw = networkUserIds.length > 0 ? await db
      .select({
        id: transactions.id,
        email: users.email,
        amount: transactions.amount,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.contributorId, users.id))
      .where(
        and(
          inArray(transactions.contributorId, networkUserIds),
          or(
            ilike(users.email, searchTerm)
          )
        )
      )
      .limit(5) : []

    const transactionResults = transactionResultsRaw.map(t => ({
      id: t.id,
      type: 'transacao' as const,
      title: t.id,
      subtitle: t.email,
      description: t.amount,
      href: `/supervisor/transacoes/${t.id}`,
    }))

    const results = [
      ...pastors.map(p => ({
        ...p,
        title: `${p.title} ${p.subtitle}`,
        subtitle: p.description,
        description: 'Pastor',
      })),
      ...churches.map(c => ({
        ...c,
        subtitle: c.description,
        description: 'Igreja',
      })),
      ...transactionResults.map(t => ({
        ...t,
        title: `#${t.title}`,
        subtitle: t.subtitle || 'Contribuinte',
        description: `R$ ${Number(t.description).toFixed(2)}`,
      })),
    ]

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Erro na busca global:', error)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}