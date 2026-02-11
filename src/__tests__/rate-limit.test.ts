/**
 * @fileoverview Testes para o sistema de rate limiting com fallback em memória
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { rateLimit, clearInMemoryStore, getInMemoryStats } from '@/lib/rate-limit'

// Mock do Redis
jest.mock('@/lib/redis', () => ({
  redis: null, // Simular Redis indisponível para testar fallback
}))

describe('Rate Limiting com Fallback em Memória', () => {
  beforeEach(() => {
    clearInMemoryStore()
  })

  afterEach(() => {
    clearInMemoryStore()
  })

  describe('Funcionalidade Básica', () => {
    it('deve permitir requisições dentro do limite', async () => {
      const result1 = await rateLimit('test-route', '192.168.1.1', 5, 60)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)

      const result2 = await rateLimit('test-route', '192.168.1.1', 5, 60)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(3)
    })

    it('deve bloquear requisições acima do limite', async () => {
      // Fazer 5 requisições (limite)
      for (let i = 0; i < 5; i++) {
        await rateLimit('test-route', '192.168.1.1', 5, 60)
      }

      // 6ª requisição deve ser bloqueada
      const result = await rateLimit('test-route', '192.168.1.1', 5, 60)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('deve isolar contadores por IP', async () => {
      const result1 = await rateLimit('test-route', '192.168.1.1', 5, 60)
      const result2 = await rateLimit('test-route', '192.168.1.2', 5, 60)

      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(4)
    })

    it('deve isolar contadores por rota', async () => {
      const result1 = await rateLimit('route-a', '192.168.1.1', 5, 60)
      const result2 = await rateLimit('route-b', '192.168.1.1', 5, 60)

      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(4)
    })
  })

  describe('Expiração de Janela', () => {
    it('deve resetar contador após expiração da janela', async () => {
      // Primeira requisição
      const result1 = await rateLimit('test-route', '192.168.1.1', 5, 1) // 1 segundo
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(4)

      // Aguardar expiração (1.1 segundos)
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Nova requisição após expiração deve resetar contador
      const result2 = await rateLimit('test-route', '192.168.1.1', 5, 1)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBe(4)
    })
  })

  describe('Proteção contra Memory Leak', () => {
    it('deve limitar tamanho do store em memória', async () => {
      // Criar 10.001 entradas (acima do limite de 10.000)
      for (let i = 0; i < 10001; i++) {
        await rateLimit('test-route', `192.168.1.${i % 256}`, 5, 60)
      }

      const stats = getInMemoryStats()
      expect(stats.size).toBeLessThanOrEqual(stats.maxSize)
    })

    it('deve limpar entradas expiradas automaticamente', async () => {
      // Criar entradas com janela curta
      for (let i = 0; i < 100; i++) {
        await rateLimit('test-route', `192.168.1.${i}`, 5, 1) // 1 segundo
      }

      const statsBefore = getInMemoryStats()
      expect(statsBefore.size).toBe(100)

      // Aguardar expiração
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Criar nova entrada para disparar limpeza
      await rateLimit('test-route', '192.168.2.1', 5, 60)

      // Store deve ter sido limpo (apenas 1 entrada nova)
      const statsAfter = getInMemoryStats()
      expect(statsAfter.size).toBeLessThan(statsBefore.size)
    })
  })

  describe('Estatísticas do Store', () => {
    it('deve retornar estatísticas corretas', async () => {
      await rateLimit('test-route', '192.168.1.1', 5, 60)
      await rateLimit('test-route', '192.168.1.2', 5, 60)

      const stats = getInMemoryStats()
      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(10000)
      expect(stats.oldestEntry).not.toBeNull()
    })

    it('deve retornar null para oldestEntry quando store vazio', () => {
      const stats = getInMemoryStats()
      expect(stats.size).toBe(0)
      expect(stats.oldestEntry).toBeNull()
    })
  })

  describe('Casos Extremos', () => {
    it('deve lidar com limite 0', async () => {
      const result = await rateLimit('test-route', '192.168.1.1', 0, 60)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('deve lidar com limite 1', async () => {
      const result1 = await rateLimit('test-route', '192.168.1.1', 1, 60)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(0)

      const result2 = await rateLimit('test-route', '192.168.1.1', 1, 60)
      expect(result2.allowed).toBe(false)
      expect(result2.remaining).toBe(0)
    })

    it('deve lidar com janela muito curta', async () => {
      const result = await rateLimit('test-route', '192.168.1.1', 5, 0.1) // 100ms
      expect(result.allowed).toBe(true)

      await new Promise((resolve) => setTimeout(resolve, 150))

      const result2 = await rateLimit('test-route', '192.168.1.1', 5, 0.1)
      expect(result2.allowed).toBe(true)
    })
  })

  describe('Concorrência', () => {
    it('deve lidar com requisições concorrentes', async () => {
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(rateLimit('test-route', '192.168.1.1', 5, 60))
      }

      const results = await Promise.all(promises)

      // Primeiras 5 devem ser permitidas
      const allowed = results.filter((r) => r.allowed).length
      expect(allowed).toBe(5)

      // Últimas 5 devem ser bloqueadas
      const blocked = results.filter((r) => !r.allowed).length
      expect(blocked).toBe(5)
    })
  })
})
