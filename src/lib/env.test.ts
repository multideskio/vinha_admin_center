/**
 * Testes unitários para validação de variáveis de ambiente
 *
 * Para executar: npm test src/lib/env.test.ts
 */

import { z } from 'zod'

// Tipo de teste simples sem framework
type TestResult = {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function test(name: string, fn: () => void | Promise<void>) {
  try {
    fn()
    results.push({ name, passed: true })
    console.log(`✅ ${name}`)
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    })
    console.log(`❌ ${name}`)
    console.log(`   Erro: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertThrows(fn: () => void, expectedMessage?: string) {
  try {
    fn()
    throw new Error('Esperava que a função lançasse um erro, mas não lançou')
  } catch (error) {
    if (error instanceof Error && error.message.includes('Esperava que a função')) {
      throw error
    }
    if (expectedMessage && error instanceof Error) {
      assert(
        error.message.includes(expectedMessage),
        `Esperava mensagem contendo "${expectedMessage}", mas recebeu "${error.message}"`,
      )
    }
  }
}

// ===== TESTES =====

console.log('\n🧪 Executando testes de validação de variáveis de ambiente\n')

// Teste 1: Validação de DATABASE_URL
test('deve validar DATABASE_URL obrigatória', () => {
  const schema = z.object({
    DATABASE_URL: z.string().min(1),
  })

  assertThrows(() => {
    schema.parse({ DATABASE_URL: '' })
  })

  const result = schema.parse({ DATABASE_URL: 'postgresql://localhost:5432/db' })
  assert(result.DATABASE_URL === 'postgresql://localhost:5432/db', 'DATABASE_URL deve ser válida')
})

// Teste 2: Validação de UUID
test('deve validar COMPANY_INIT como UUID', () => {
  const schema = z.object({
    COMPANY_INIT: z.string().uuid(),
  })

  assertThrows(() => {
    schema.parse({ COMPANY_INIT: 'invalid-uuid' })
  })

  const result = schema.parse({ COMPANY_INIT: '123e4567-e89b-12d3-a456-426614174000' })
  assert(
    result.COMPANY_INIT === '123e4567-e89b-12d3-a456-426614174000',
    'COMPANY_INIT deve ser UUID válido',
  )
})

// Teste 3: Validação de JWT_SECRET com tamanho mínimo
test('deve validar JWT_SECRET com mínimo de 32 caracteres', () => {
  const schema = z.object({
    JWT_SECRET: z.string().min(32),
  })

  assertThrows(() => {
    schema.parse({ JWT_SECRET: 'short' })
  })

  const result = schema.parse({
    JWT_SECRET: 'this-is-a-very-long-secret-key-with-more-than-32-characters',
  })
  assert(result.JWT_SECRET.length >= 32, 'JWT_SECRET deve ter pelo menos 32 caracteres')
})

// Teste 4: Validação de DEFAULT_PASSWORD com tamanho mínimo
test('deve validar DEFAULT_PASSWORD com mínimo de 6 caracteres', () => {
  const schema = z.object({
    DEFAULT_PASSWORD: z.string().min(6),
  })

  assertThrows(() => {
    schema.parse({ DEFAULT_PASSWORD: '12345' })
  })

  const result = schema.parse({ DEFAULT_PASSWORD: 'password123' })
  assert(result.DEFAULT_PASSWORD.length >= 6, 'DEFAULT_PASSWORD deve ter pelo menos 6 caracteres')
})

// Teste 5: Validação de NODE_ENV com enum
test('deve validar NODE_ENV com valores permitidos', () => {
  const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']),
  })

  assertThrows(() => {
    schema.parse({ NODE_ENV: 'staging' })
  })

  const result1 = schema.parse({ NODE_ENV: 'development' })
  assert(result1.NODE_ENV === 'development', 'NODE_ENV=development deve ser válido')

  const result2 = schema.parse({ NODE_ENV: 'production' })
  assert(result2.NODE_ENV === 'production', 'NODE_ENV=production deve ser válido')

  const result3 = schema.parse({ NODE_ENV: 'test' })
  assert(result3.NODE_ENV === 'test', 'NODE_ENV=test deve ser válido')
})

// Teste 6: Validação de defaults
test('deve aplicar defaults para variáveis opcionais', () => {
  const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    REDIS_URL: z.string().default('redis://localhost:6379'),
  })

  const result = schema.parse({})
  assert(result.NODE_ENV === 'development', 'NODE_ENV deve ter default "development"')
  assert(result.REDIS_URL === 'redis://localhost:6379', 'REDIS_URL deve ter default correto')
})

// Teste 7: Validação de email
test('deve validar formato de email para AWS_SES_FROM_EMAIL', () => {
  const schema = z.object({
    AWS_SES_FROM_EMAIL: z.string().email().optional(),
  })

  assertThrows(() => {
    schema.parse({ AWS_SES_FROM_EMAIL: 'invalid-email' })
  })

  const result = schema.parse({ AWS_SES_FROM_EMAIL: 'noreply@example.com' })
  assert(result.AWS_SES_FROM_EMAIL === 'noreply@example.com', 'Email deve ser válido')
})

// Teste 8: Validação de URL para REDIS_URL
test('deve validar formato de URL para REDIS_URL', () => {
  const schema = z.object({
    REDIS_URL: z.string().url(),
  })

  assertThrows(() => {
    schema.parse({ REDIS_URL: 'not-a-url' })
  })

  const result = schema.parse({ REDIS_URL: 'redis://localhost:6379' })
  assert(result.REDIS_URL === 'redis://localhost:6379', 'REDIS_URL deve ser URL válida')
})

// Teste 9: Schema completo
test('deve validar schema completo com todas as variáveis', () => {
  const schema = z.object({
    DATABASE_URL: z.string().min(1),
    COMPANY_INIT: z.string().uuid(),
    ADMIN_INIT: z.string().uuid(),
    JWT_SECRET: z.string().min(32),
    DEFAULT_PASSWORD: z.string().min(6),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    REDIS_URL: z.string().url().optional().default('redis://localhost:6379'),
  })

  const result = schema.parse({
    DATABASE_URL: 'postgresql://localhost:5432/db',
    COMPANY_INIT: '123e4567-e89b-12d3-a456-426614174000',
    ADMIN_INIT: '123e4567-e89b-12d3-a456-426614174001',
    JWT_SECRET: 'this-is-a-very-long-secret-key-with-more-than-32-characters',
    DEFAULT_PASSWORD: 'password123',
  })

  assert(result.DATABASE_URL !== undefined, 'DATABASE_URL deve estar presente')
  assert(result.COMPANY_INIT !== undefined, 'COMPANY_INIT deve estar presente')
  assert(result.ADMIN_INIT !== undefined, 'ADMIN_INIT deve estar presente')
  assert(result.JWT_SECRET !== undefined, 'JWT_SECRET deve estar presente')
  assert(result.DEFAULT_PASSWORD !== undefined, 'DEFAULT_PASSWORD deve estar presente')
  assert(result.NODE_ENV === 'development', 'NODE_ENV deve ter default')
  assert(result.REDIS_URL === 'redis://localhost:6379', 'REDIS_URL deve ter default')
})

// ===== RESUMO =====

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
const passed = results.filter((r) => r.passed).length
const failed = results.filter((r) => !r.passed).length
const total = results.length

console.log(`\n📊 Resumo: ${passed}/${total} testes passaram`)

if (failed > 0) {
  console.log(`\n❌ ${failed} teste(s) falharam:\n`)
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.log(`  • ${r.name}`)
      if (r.error) {
        console.log(`    ${r.error}`)
      }
    })
  process.exit(1)
} else {
  console.log('\n✅ Todos os testes passaram!\n')
  process.exit(0)
}
