/**
 * Testes unitários para o sistema de logging estruturado
 */

/// <reference types="jest" />

import { Logger, logger } from './logger'

describe('Logger', () => {
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleLogSpy: jest.SpyInstance

  beforeEach(() => {
    // Spy nos métodos do console
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    // Restaurar mocks
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleLogSpy.mockRestore()
    // Limpar contexto do logger singleton
    logger.clearContext()
  })

  describe('Métodos básicos de logging', () => {
    it('deve logar erro com formato JSON estruturado', () => {
      const testLogger = new Logger()
      testLogger.error('Erro de teste')

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(logOutput).toMatchObject({
        level: 'error',
        message: 'Erro de teste',
      })
      expect(logOutput.timestamp).toBeDefined()
    })

    it('deve logar warning com formato JSON estruturado', () => {
      const testLogger = new Logger()
      testLogger.warn('Aviso de teste')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)
      const logOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0])

      expect(logOutput).toMatchObject({
        level: 'warn',
        message: 'Aviso de teste',
      })
      expect(logOutput.timestamp).toBeDefined()
    })

    it('deve logar info com formato JSON estruturado', () => {
      const testLogger = new Logger()
      testLogger.info('Info de teste')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput).toMatchObject({
        level: 'info',
        message: 'Info de teste',
      })
      expect(logOutput.timestamp).toBeDefined()
    })
  })

  describe('Gerenciamento de contexto', () => {
    it('deve adicionar contexto aos logs', () => {
      const testLogger = new Logger()
      testLogger.setContext({ userId: 'user123', operation: 'test-op' })
      testLogger.info('Teste com contexto')

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.context).toEqual({
        userId: 'user123',
        operation: 'test-op',
      })
    })

    it('deve atualizar contexto existente', () => {
      const testLogger = new Logger()
      testLogger.setContext({ userId: 'user123' })
      testLogger.setContext({ operation: 'test-op' })
      testLogger.info('Teste')

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.context).toEqual({
        userId: 'user123',
        operation: 'test-op',
      })
    })

    it('deve limpar contexto', () => {
      const testLogger = new Logger()
      testLogger.setContext({ userId: 'user123' })
      testLogger.clearContext()
      testLogger.info('Teste sem contexto')

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.context).toBeUndefined()
    })

    it('deve retornar contexto atual', () => {
      const testLogger = new Logger()
      testLogger.setContext({ userId: 'user123', operation: 'test' })

      const context = testLogger.getContext()

      expect(context).toEqual({
        userId: 'user123',
        operation: 'test',
      })
    })
  })

  describe('Sanitização de dados sensíveis', () => {
    it('deve mascarar CPF em strings', () => {
      const testLogger = new Logger()
      testLogger.info('CPF do usuário: 123.456.789-01')

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.data).toBeUndefined()
      // CPF está na mensagem, não em data
    })

    it('deve mascarar senha em objetos', () => {
      const testLogger = new Logger()
      testLogger.info('Dados do usuário', {
        email: 'user@example.com',
        password: 'senha123',
      })

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.data).toEqual({
        email: 'user@example.com',
        password: '[REDACTED]',
      })
    })

    it('deve mascarar token em objetos', () => {
      const testLogger = new Logger()
      testLogger.info('Autenticação', {
        userId: 'user123',
        token: 'abc123xyz',
      })

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.data).toEqual({
        userId: 'user123',
        token: '[REDACTED]',
      })
    })

    it('deve mascarar múltiplos campos sensíveis', () => {
      const testLogger = new Logger()
      testLogger.info('Dados de pagamento', {
        amount: 100,
        cardNumber: '1234567890123456',
        cvv: '123',
        securityCode: '456',
      })

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.data).toEqual({
        amount: 100,
        cardNumber: '[REDACTED]',
        cvv: '[REDACTED]',
        securityCode: '[REDACTED]',
      })
    })

    it('deve mascarar dados sensíveis em arrays', () => {
      const testLogger = new Logger()
      testLogger.info('Lista de usuários', [
        { name: 'User 1', password: 'pass1' },
        { name: 'User 2', password: 'pass2' },
      ])

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.data).toEqual([
        { name: 'User 1', password: '[REDACTED]' },
        { name: 'User 2', password: '[REDACTED]' },
      ])
    })

    it('deve mascarar CPF em strings dentro de data', () => {
      const testLogger = new Logger()
      testLogger.info('Dados', { cpf: '123.456.789-01' })

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.data.cpf).toBe('***.***.***-**')
    })
  })

  describe('Tratamento de erros', () => {
    it('deve logar Error object com stack trace', () => {
      const testLogger = new Logger()
      const error = new Error('Erro de teste')
      testLogger.error('Falha na operação', error)

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(logOutput.error).toBe('Erro de teste')
      expect(logOutput.stack).toBeDefined()
      expect(logOutput.stack).toContain('Error: Erro de teste')
    })

    it('deve logar erro com dados adicionais', () => {
      const testLogger = new Logger()
      const error = new Error('Erro de teste')
      testLogger.error('Falha', error, { userId: 'user123', amount: 100 })

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(logOutput.error).toBe('Erro de teste')
      expect(logOutput.data).toEqual({ userId: 'user123', amount: 100 })
    })

    it('deve converter erro não-Error para string', () => {
      const testLogger = new Logger()
      testLogger.error('Falha', 'Erro simples')

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0])

      expect(logOutput.error).toBe('Erro simples')
    })
  })

  describe('Logger child', () => {
    it('deve criar logger filho com contexto herdado', () => {
      const parentLogger = new Logger()
      parentLogger.setContext({ userId: 'user123' })

      const childLogger = parentLogger.child({ operation: 'child-op' })
      childLogger.info('Log do filho')

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      expect(logOutput.context).toEqual({
        userId: 'user123',
        operation: 'child-op',
      })
    })

    it('deve isolar contexto do filho do pai', () => {
      const parentLogger = new Logger()
      parentLogger.setContext({ userId: 'user123' })

      const childLogger = parentLogger.child({ operation: 'child-op' })
      childLogger.setContext({ transactionId: 'tx123' })

      // Log do pai não deve ter transactionId
      parentLogger.info('Log do pai')
      const parentLog = JSON.parse(consoleLogSpy.mock.calls[0][0])
      expect(parentLog.context).toEqual({ userId: 'user123' })

      // Log do filho deve ter todos os contextos
      childLogger.info('Log do filho')
      const childLog = JSON.parse(consoleLogSpy.mock.calls[1][0])
      expect(childLog.context).toEqual({
        userId: 'user123',
        operation: 'child-op',
        transactionId: 'tx123',
      })
    })
  })

  describe('Logger singleton', () => {
    it('deve exportar instância singleton', () => {
      expect(logger).toBeInstanceOf(Logger)
    })

    it('deve manter estado entre chamadas', () => {
      logger.setContext({ userId: 'user123' })
      logger.info('Primeira chamada')

      logger.info('Segunda chamada')

      const firstLog = JSON.parse(consoleLogSpy.mock.calls[0][0])
      const secondLog = JSON.parse(consoleLogSpy.mock.calls[1][0])

      expect(firstLog.context).toEqual({ userId: 'user123' })
      expect(secondLog.context).toEqual({ userId: 'user123' })
    })
  })

  describe('Formato de timestamp', () => {
    it('deve usar formato ISO 8601', () => {
      const testLogger = new Logger()
      testLogger.info('Teste de timestamp')

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0])

      // Verificar se é um timestamp ISO válido
      expect(logOutput.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(new Date(logOutput.timestamp).toISOString()).toBe(logOutput.timestamp)
    })
  })
})
