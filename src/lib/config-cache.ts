/**
 * @fileoverview Sistema de cache em memória para configurações do sistema
 * @version 1.0
 * @date 2025-01-06
 * @description Cache com TTL de 5 minutos para reduzir queries ao banco de dados
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

/**
 * Classe de cache em memória com TTL (Time To Live)
 * Usado para cachear configurações que mudam raramente
 */
class ConfigCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private ttlMs = 5 * 60 * 1000 // 5 minutos

  /**
   * Busca um valor no cache
   * @param key - Chave do cache
   * @returns Valor cacheado ou null se não existir ou expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Armazena um valor no cache
   * @param key - Chave do cache
   * @param data - Dados a serem cacheados
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    })
  }

  /**
   * Invalida (remove) uma entrada do cache
   * @param key - Chave do cache a ser invalidada
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalida todas as entradas que começam com um prefixo
   * Útil para invalidar todas as configurações de uma empresa
   * @param prefix - Prefixo das chaves a serem invalidadas
   */
  invalidateByPrefix(prefix: string): void {
    const keysToDelete: string[] = []
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    }
    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Exportar instância singleton
export const configCache = new ConfigCache()

// Chaves de cache padronizadas
export const CACHE_KEYS = {
  CIELO_CONFIG: (companyId: string) => `cielo:config:${companyId}`,
  SMTP_CONFIG: (companyId: string) => `smtp:config:${companyId}`,
  WHATSAPP_CONFIG: (companyId: string) => `whatsapp:config:${companyId}`,
  COMPANY_CONFIG: (companyId: string) => `company:config:${companyId}`,
} as const
