/**
 * Sistema de Deduplicação de Notificações
 *
 * Previne spam de notificações duplicadas verificando o histórico
 * de notificações enviadas em uma janela de tempo configurável.
 *
 * @module notification-dedup
 */

import { db } from '@/db/drizzle'
import { notificationLogs } from '@/db/schema'
import { and, eq, gte } from 'drizzle-orm'
import { logger } from '@/lib/logger'

/**
 * Verifica se uma notificação deve ser enviada com base no histórico recente
 *
 * Esta função implementa deduplicação de notificações verificando se uma
 * notificação do mesmo tipo já foi enviada com sucesso para o usuário
 * dentro da janela de tempo especificada.
 *
 * @param userId - ID do usuário que receberá a notificação
 * @param notificationType - Tipo da notificação (ex: 'payment_confirmation', 'welcome_email')
 * @param deduplicationWindowHours - Janela de tempo em horas para verificar duplicação (padrão: 24h)
 * @returns Promise<boolean> - true se a notificação deve ser enviada, false se é duplicada
 *
 * @example
 * ```typescript
 * const shouldSend = await shouldSendNotification(
 *   userId,
 *   'payment_confirmation',
 *   24
 * )
 *
 * if (shouldSend) {
 *   await sendNotification(userId, message)
 * } else {
 *   logger.info('Notificação duplicada bloqueada', { userId, notificationType })
 * }
 * ```
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: string,
  deduplicationWindowHours: number = 24,
): Promise<boolean> {
  try {
    // Calcular timestamp do início da janela de deduplicação
    const windowStart = new Date(Date.now() - deduplicationWindowHours * 60 * 60 * 1000)

    // Buscar notificação recente do mesmo tipo enviada com sucesso
    const [recent] = await db
      .select()
      .from(notificationLogs)
      .where(
        and(
          eq(notificationLogs.userId, userId),
          eq(notificationLogs.notificationType, notificationType),
          eq(notificationLogs.status, 'sent'),
          gte(notificationLogs.sentAt, windowStart),
        ),
      )
      .limit(1)

    // Se encontrou notificação recente, não deve enviar (é duplicada)
    if (recent) {
      logger.warn('Tentativa de envio de notificação duplicada bloqueada', {
        userId,
        notificationType,
        lastSentAt: recent.sentAt.toISOString(),
        windowHours: deduplicationWindowHours,
      })
      return false
    }

    // Não encontrou duplicação, pode enviar
    return true
  } catch (error) {
    // Em caso de erro na verificação, logar mas permitir envio
    // (fail-open para não bloquear notificações críticas)
    logger.error('Erro ao verificar deduplicação de notificação', error, {
      userId,
      notificationType,
      deduplicationWindowHours,
    })

    // Retornar true para permitir envio em caso de erro
    return true
  }
}

/**
 * Configurações de janela de deduplicação por tipo de notificação
 *
 * Permite configurar diferentes janelas de tempo para diferentes tipos
 * de notificação. Por exemplo, notificações de pagamento podem ter
 * janela menor que lembretes de dízimo.
 */
export const DEDUPLICATION_WINDOWS: Record<string, number> = {
  // Notificações de pagamento - janela curta (1 hora)
  payment_confirmation: 1,
  payment_failed: 1,
  payment_refunded: 1,

  // Notificações de boas-vindas - janela longa (7 dias)
  welcome_email: 168, // 7 dias

  // Lembretes de dízimo - janela média (24 horas)
  tithe_reminder: 24,
  tithe_due_soon: 24,

  // Notificações administrativas - janela média (24 horas)
  account_created: 24,
  password_reset: 1,
  profile_updated: 24,

  // Padrão para tipos não especificados
  default: 24,
}

/**
 * Obtém a janela de deduplicação apropriada para um tipo de notificação
 *
 * @param notificationType - Tipo da notificação
 * @returns Janela de deduplicação em horas
 *
 * @example
 * ```typescript
 * const windowHours = getDeduplicationWindow('payment_confirmation')
 * const shouldSend = await shouldSendNotification(userId, type, windowHours)
 * ```
 */
export function getDeduplicationWindow(notificationType: string): number {
  return DEDUPLICATION_WINDOWS[notificationType] ?? DEDUPLICATION_WINDOWS.default ?? 24
}

/**
 * Verifica se deve enviar notificação usando janela configurada por tipo
 *
 * Esta é uma função de conveniência que combina shouldSendNotification
 * com getDeduplicationWindow para usar automaticamente a janela
 * apropriada para cada tipo de notificação.
 *
 * @param userId - ID do usuário que receberá a notificação
 * @param notificationType - Tipo da notificação
 * @returns Promise<boolean> - true se a notificação deve ser enviada
 *
 * @example
 * ```typescript
 * // Usa automaticamente a janela configurada para o tipo
 * const shouldSend = await shouldSendNotificationWithConfig(
 *   userId,
 *   'payment_confirmation'
 * )
 * ```
 */
export async function shouldSendNotificationWithConfig(
  userId: string,
  notificationType: string,
): Promise<boolean> {
  const windowHours = getDeduplicationWindow(notificationType)
  return shouldSendNotification(userId, notificationType, windowHours)
}
