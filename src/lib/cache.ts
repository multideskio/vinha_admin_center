/**
 * @fileoverview Cache Redis para dados de aplicação
 * @description Usa instância Redis singleton de @/lib/redis
 *
 * TEMP: CACHE DISABLED — restore before production release
 * Para reativar: importar redis, remover early returns e restaurar implementação
 */

/* eslint-disable @typescript-eslint/no-unused-vars -- TEMP: params mantidos para API, cache desabilitado */
export async function setCache(key: string, value: unknown, ttlSeconds = 60) {
  void key
  void value
  void ttlSeconds
  return
}

export async function getCache<T = unknown>(key: string): Promise<T | null> {
  void key
  return null
}

export async function delCache(key: string) {
  void key
  return
}

/**
 * Invalida chaves por padrão usando SCAN (não-bloqueante)
 * Substitui redis.keys() que é O(N) e bloqueia o Redis inteiro
 */
export async function invalidateCache(pattern: string) {
  void pattern
  return
}
/* eslint-enable @typescript-eslint/no-unused-vars */
