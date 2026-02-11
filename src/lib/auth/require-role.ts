/**
 * @fileoverview Helper para validação de autorização por role
 * @version 1.0
 * @date 2026-02-11
 * @author Kiro AI Assistant
 */

import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/jwt'
import type { UserRole } from '@/lib/types'

/**
 * Valida se o usuário está autenticado e possui uma das roles permitidas
 *
 * @param allowedRoles - Array de roles permitidas ou uma única role
 * @param redirectTo - URL para redirecionar se não autorizado (padrão: '/login')
 * @returns Usuário autenticado
 * @throws Redireciona para login se não autorizado
 *
 * @example
 * // Apenas admin
 * const user = await requireRole('admin')
 *
 * @example
 * // Admin ou manager
 * const user = await requireRole(['admin', 'manager'])
 */
export async function requireRole(
  allowedRoles: UserRole | UserRole[],
  redirectTo: string = '/login',
) {
  const { user } = await validateRequest()

  // Verificar se usuário está autenticado
  if (!user) {
    redirect(redirectTo)
  }

  // Normalizar allowedRoles para array
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  // Verificar se usuário possui uma das roles permitidas
  if (!rolesArray.includes(user.role as UserRole)) {
    redirect(redirectTo)
  }

  return user
}

/**
 * Valida se o usuário é admin
 * Atalho para requireRole('admin')
 */
export async function requireAdmin(redirectTo: string = '/login') {
  return requireRole('admin', redirectTo)
}

/**
 * Valida se o usuário é manager ou admin
 * Atalho para requireRole(['admin', 'manager'])
 */
export async function requireManagerOrAdmin(redirectTo: string = '/login') {
  return requireRole(['admin', 'manager'], redirectTo)
}

/**
 * Valida se o usuário é supervisor, manager ou admin
 * Atalho para requireRole(['admin', 'manager', 'supervisor'])
 */
export async function requireSupervisorOrAbove(redirectTo: string = '/login') {
  return requireRole(['admin', 'manager', 'supervisor'], redirectTo)
}
