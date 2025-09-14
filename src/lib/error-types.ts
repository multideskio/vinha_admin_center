/**
 * @fileoverview Tipos personalizados para tratamento de erros
 * @version 1.0
 * @date 2024-01-15
 * @author Sistema
 */

/**
 * Tipo para erros desconhecidos capturados em catch blocks
 */
export type UnknownError = unknown

/**
 * Função utilitária para extrair mensagem de erro de forma segura
 */
export function getErrorMessage(error: UnknownError): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'Erro desconhecido'
}

/**
 * Função utilitária para verificar se o erro é uma instância de Error
 */
export function isError(error: UnknownError): error is Error {
  return error instanceof Error
}
