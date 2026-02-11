import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'
import { ArrowRightLeft } from 'lucide-react'
import { TransactionsTable } from './_components/transactions-table'
import type { Transaction } from '@/types/transaction'
import { db } from '@/db/drizzle'
import {
  transactions,
  users,
  churchProfiles,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
} from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

/**
 * Página de Transações - Server Component
 * Busca dados iniciais no servidor e renderiza componente client
 * @lastReview 2026-02-11 - Refatorado para Server Component
 */
export default async function TransacoesPage() {
  // Validar autenticação
  const { user } = await validateRequest()
  if (!user || (user.role as UserRole) !== 'admin') {
    redirect('/login')
  }

  // Buscar transações diretamente do banco (evita problema de cookies)
  const userTransactions = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      status: transactions.status,
      createdAt: transactions.createdAt,
      paymentMethod: transactions.paymentMethod,
      contributorId: users.id,
      contributorRole: users.role,
      contributorEmail: users.email,
      churchId: transactions.originChurchId,
      refundRequestReason: transactions.refundRequestReason,
      isFraud: transactions.isFraud,
      managerFirstName: managerProfiles.firstName,
      managerLastName: managerProfiles.lastName,
      supervisorFirstName: supervisorProfiles.firstName,
      supervisorLastName: supervisorProfiles.lastName,
      pastorFirstName: pastorProfiles.firstName,
      pastorLastName: pastorProfiles.lastName,
      churchNomeFantasia: churchProfiles.nomeFantasia,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.contributorId, users.id))
    .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
    .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
    .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
    .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
    .orderBy(desc(transactions.createdAt))
    .limit(100)

  // Formatar dados
  const initialData: Transaction[] = userTransactions.map((t) => {
    let contributorName = t.contributorEmail

    if (t.contributorRole === 'manager' && t.managerFirstName && t.managerLastName) {
      contributorName = `${t.managerFirstName} ${t.managerLastName}`
    } else if (
      t.contributorRole === 'supervisor' &&
      t.supervisorFirstName &&
      t.supervisorLastName
    ) {
      contributorName = `${t.supervisorFirstName} ${t.supervisorLastName}`
    } else if (t.contributorRole === 'pastor' && t.pastorFirstName && t.pastorLastName) {
      contributorName = `${t.pastorFirstName} ${t.pastorLastName}`
    } else if (t.contributorRole === 'church_account' && t.churchNomeFantasia) {
      contributorName = t.churchNomeFantasia
    }

    return {
      id: t.id,
      contributor: contributorName,
      contributorEmail: t.contributorEmail,
      contributorId: t.contributorId,
      church: t.churchId || null,
      amount: parseFloat(t.amount),
      method: t.paymentMethod as 'pix' | 'credit_card' | 'boleto',
      status: t.status as 'approved' | 'pending' | 'refused' | 'refunded',
      date: new Date(t.createdAt).toLocaleDateString('pt-BR'),
      paidAt: new Date(t.createdAt).toISOString(),
      refundRequestReason: t.refundRequestReason,
      isFraud: t.isFraud,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header inline para evitar problema de serialização de componentes */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 videira-gradient opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-lg flex items-center gap-3">
                <ArrowRightLeft className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0" />
                <span className="truncate">Transações</span>
              </h1>
              <p className="text-sm sm:text-base text-white/90 mt-2 font-medium">
                Gerencie todas as transações financeiras da plataforma
              </p>
            </div>
          </div>
        </div>
      </div>

      <TransactionsTable initialData={initialData} />
    </div>
  )
}
