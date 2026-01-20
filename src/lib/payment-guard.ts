import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { and, eq, gte, inArray } from 'drizzle-orm'

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingTransaction?: typeof transactions.$inferSelect
}

/**
 * Verifica se já existe uma transação pendente ou aprovada para o mesmo usuário
 * dentro de uma janela de tempo especificada.
 *
 * Esta função previne cobranças duplicadas verificando transações recentes
 * com o mesmo valor e usuário.
 *
 * @param userId - ID do usuário/contribuinte
 * @param amount - Valor da transação em centavos (inteiro)
 * @param windowMinutes - Janela de tempo em minutos para verificar duplicação (padrão: 5)
 * @returns Objeto com isDuplicate e existingTransaction (se encontrada)
 */
export async function checkDuplicatePayment(
  userId: string,
  amount: number,
  windowMinutes: number = 5,
): Promise<DuplicateCheckResult> {
  // Calcular timestamp da janela de tempo
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)

  // Buscar transação existente com mesmo usuário, valor e status pendente/aprovado
  const [existing] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.contributorId, userId),
        eq(transactions.amount, amount.toString()),
        gte(transactions.createdAt, windowStart),
        inArray(transactions.status, ['pending', 'approved']),
      ),
    )
    .limit(1)

  return {
    isDuplicate: !!existing,
    existingTransaction: existing,
  }
}
