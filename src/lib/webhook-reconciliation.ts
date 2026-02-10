/**
 * Sistema de Reconciliação de Webhooks
 *
 * Trata race conditions onde webhooks da Cielo podem chegar antes
 * da criação da transação no banco de dados.
 *
 * Funcionalidades:
 * - Verificação de existência de transação
 * - Reconciliação de estados divergentes
 * - Retry com backoff exponencial
 * - Logging estruturado para debug
 */

import { db } from '@/db/drizzle'
import { transactions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { logger } from '@/lib/logger'

/**
 * Status de transação aceitos pelo sistema
 */
type TransactionStatus = 'pending' | 'approved' | 'refused' | 'refunded'

/**
 * Resultado da reconciliação
 */
interface ReconciliationResult {
  success: boolean
  transactionFound: boolean
  statusUpdated: boolean
  previousStatus?: TransactionStatus
  newStatus?: TransactionStatus
  error?: string
}

/**
 * Opções de configuração para retry
 */
interface RetryOptions {
  maxAttempts?: number
  initialDelayMs?: number
  maxDelayMs?: number
  backoffMultiplier?: number
}

/**
 * Configuração padrão de retry
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 5,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
}

/**
 * Aguarda um período de tempo (Promise-based)
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calcula o delay para o próximo retry usando backoff exponencial
 */
function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt)
  return Math.min(delay, maxDelay)
}

/**
 * Busca uma transação por ID com retry
 *
 * Útil para casos onde o webhook chega antes da transação ser criada.
 * Implementa backoff exponencial para não sobrecarregar o banco.
 */
async function findTransactionWithRetry(
  transactionId: string,
  options: RetryOptions = {},
): Promise<{ id: string; status: TransactionStatus } | null> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options }

  logger.setContext({
    operation: 'findTransactionWithRetry',
    transactionId,
  })

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      // Buscar transação por gatewayTransactionId
      let [transaction] = await db
        .select({
          id: transactions.id,
          status: transactions.status,
          gatewayTransactionId: transactions.gatewayTransactionId,
        })
        .from(transactions)
        .where(eq(transactions.gatewayTransactionId, transactionId))
        .limit(1)

      // Fallback: buscar por ID direto
      if (!transaction) {
        ;[transaction] = await db
          .select({
            id: transactions.id,
            status: transactions.status,
            gatewayTransactionId: transactions.gatewayTransactionId,
          })
          .from(transactions)
          .where(eq(transactions.id, transactionId))
          .limit(1)
      }

      if (transaction) {
        logger.info('Transaction found', {
          attempt: attempt + 1,
          transactionId: transaction.id,
          status: transaction.status,
        })
        logger.clearContext()
        return transaction
      }

      // Se não encontrou e ainda tem tentativas, aguardar antes de tentar novamente
      if (attempt < config.maxAttempts - 1) {
        const delay = calculateBackoffDelay(
          attempt,
          config.initialDelayMs,
          config.maxDelayMs,
          config.backoffMultiplier,
        )

        logger.warn('Transaction not found, retrying', {
          attempt: attempt + 1,
          maxAttempts: config.maxAttempts,
          nextRetryInMs: delay,
        })

        await sleep(delay)
      }
    } catch (error) {
      logger.error('Error finding transaction', error, {
        attempt: attempt + 1,
        maxAttempts: config.maxAttempts,
      })

      // Se não é a última tentativa, aguardar antes de tentar novamente
      if (attempt < config.maxAttempts - 1) {
        const delay = calculateBackoffDelay(
          attempt,
          config.initialDelayMs,
          config.maxDelayMs,
          config.backoffMultiplier,
        )
        await sleep(delay)
      }
    }
  }

  logger.warn('Transaction not found after all retry attempts', {
    maxAttempts: config.maxAttempts,
  })
  logger.clearContext()

  return null
}

/**
 * Reconcilia o estado de uma transação com o status recebido do webhook
 *
 * Esta função trata os seguintes cenários:
 * 1. Webhook chega antes da transação ser criada (early arrival)
 * 2. Estados divergentes entre webhook e banco de dados
 * 3. Transação já está no estado correto (noop)
 *
 * @param transactionId - ID da transação (gatewayTransactionId ou ID interno)
 * @param webhookStatus - Status recebido do webhook da Cielo
 * @param retryOptions - Opções de configuração para retry (opcional)
 * @returns Resultado da reconciliação
 *
 * @example
 * ```typescript
 * const result = await reconcileTransactionState(
 *   'payment-123',
 *   'approved',
 *   { maxAttempts: 3 }
 * )
 *
 * if (!result.success) {
 *   console.error('Reconciliation failed:', result.error)
 * }
 * ```
 */
export async function reconcileTransactionState(
  transactionId: string,
  webhookStatus: TransactionStatus,
  retryOptions: RetryOptions = {},
): Promise<ReconciliationResult> {
  // Configurar contexto do logger
  logger.setContext({
    operation: 'reconcileTransactionState',
    transactionId,
  })

  logger.info('Starting transaction reconciliation', {
    webhookStatus,
    retryOptions,
  })

  try {
    // Validar status do webhook
    const validStatuses: TransactionStatus[] = ['pending', 'approved', 'refused', 'refunded']
    if (!validStatuses.includes(webhookStatus)) {
      const error = `Invalid webhook status: ${webhookStatus}`
      logger.error(error)
      logger.clearContext()
      return {
        success: false,
        transactionFound: false,
        statusUpdated: false,
        error,
      }
    }

    // Buscar transação com retry
    const transaction = await findTransactionWithRetry(transactionId, retryOptions)

    // Cenário 1: Transação não encontrada após todas as tentativas
    if (!transaction) {
      logger.warn('Webhook early arrival - transaction not found after retries', {
        webhookStatus,
        recommendation: 'Transaction may be created later, webhook should be reprocessed',
      })
      logger.clearContext()

      return {
        success: false,
        transactionFound: false,
        statusUpdated: false,
        error: 'Transaction not found after retry attempts',
      }
    }

    // Cenário 2: Transação encontrada, verificar se precisa atualizar
    const currentStatus = transaction.status

    // Se o status já está correto, não fazer nada
    if (currentStatus === webhookStatus) {
      logger.info('Transaction status already correct, no update needed', {
        currentStatus,
        webhookStatus,
      })
      logger.clearContext()

      return {
        success: true,
        transactionFound: true,
        statusUpdated: false,
        previousStatus: currentStatus,
        newStatus: webhookStatus,
      }
    }

    // Cenário 3: Estados divergentes, reconciliar
    logger.warn('Transaction status divergence detected, reconciling', {
      currentStatus,
      webhookStatus,
    })

    // Atualizar status da transação
    await db
      .update(transactions)
      .set({ status: webhookStatus })
      .where(eq(transactions.id, transaction.id))

    logger.info('Transaction status reconciled successfully', {
      previousStatus: currentStatus,
      newStatus: webhookStatus,
    })
    logger.clearContext()

    return {
      success: true,
      transactionFound: true,
      statusUpdated: true,
      previousStatus: currentStatus,
      newStatus: webhookStatus,
    }
  } catch (error) {
    logger.error('Error during transaction reconciliation', error)
    logger.clearContext()

    return {
      success: false,
      transactionFound: false,
      statusUpdated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Verifica se uma transação existe no banco de dados
 *
 * Função auxiliar para verificação rápida sem retry.
 * Útil para validações iniciais antes de processar webhooks.
 *
 * @param transactionId - ID da transação (gatewayTransactionId ou ID interno)
 * @returns true se a transação existe, false caso contrário
 */
export async function transactionExists(transactionId: string): Promise<boolean> {
  try {
    // Buscar por gatewayTransactionId
    let [transaction] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.gatewayTransactionId, transactionId))
      .limit(1)

    // Fallback: buscar por ID direto
    if (!transaction) {
      ;[transaction] = await db
        .select({ id: transactions.id })
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .limit(1)
    }

    return !!transaction
  } catch (error) {
    logger.error('Error checking transaction existence', error, { transactionId })
    return false
  }
}

/**
 * Obtém o status atual de uma transação
 *
 * @param transactionId - ID da transação (gatewayTransactionId ou ID interno)
 * @returns Status da transação ou null se não encontrada
 */
export async function getTransactionStatus(
  transactionId: string,
): Promise<TransactionStatus | null> {
  try {
    // Buscar por gatewayTransactionId
    let [transaction] = await db
      .select({ status: transactions.status })
      .from(transactions)
      .where(eq(transactions.gatewayTransactionId, transactionId))
      .limit(1)

    // Fallback: buscar por ID direto
    if (!transaction) {
      ;[transaction] = await db
        .select({ status: transactions.status })
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .limit(1)
    }

    return transaction?.status || null
  } catch (error) {
    logger.error('Error getting transaction status', error, { transactionId })
    return null
  }
}
