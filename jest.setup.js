// Setup file para Jest
// Este arquivo é executado antes de cada teste

// Configurar variáveis de ambiente para testes
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.COMPANY_INIT = '123e4567-e89b-12d3-a456-426614174000'
process.env.ADMIN_INIT = '123e4567-e89b-12d3-a456-426614174001'
process.env.JWT_SECRET = 'test-jwt-secret-key-with-more-than-32-characters-for-testing'
process.env.DEFAULT_PASSWORD = 'test123'
process.env.NODE_ENV = 'test'
