import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'
import * as schema from './schema'
import { users, adminProfiles, companies } from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables')
}

if (!process.env.DEFAULT_PASSWORD) {
  throw new Error('DEFAULT_PASSWORD is not set in the environment variables')
}

if (!process.env.COMPANY_INIT) {
  throw new Error('COMPANY_INIT is not set in the environment variables')
}

if (!process.env.ADMIN_INIT) {
  throw new Error('ADMIN_INIT is not set in the environment variables')
}

const ADMIN_INIT = process.env.ADMIN_INIT

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const db = drizzle(pool, { schema })

async function main(): Promise<void> {
  console.log('Seeding database...')

  // Limpa as tabelas na ordem correta para evitar erros de chave estrangeira
  console.log('Cleaning existing data...')

  // Primeiro deletar todas as tabelas dependentes
  await db.delete(schema.apiKeys)
  await db.delete(schema.notificationLogs)
  await db.delete(schema.messageTemplates)
  await db.delete(schema.userNotificationSettings)
  await db.delete(schema.webhooks)
  await db.delete(schema.notificationRules)
  await db.delete(schema.otherSettings)
  await db.delete(schema.gatewayConfigurations)
  await db.delete(schema.transactions)
  await db.delete(schema.sessions)
  await db.delete(schema.passwordResetTokens)

  // Depois deletar perfis
  await db.delete(schema.adminProfiles)
  await db.delete(schema.pastorProfiles)
  await db.delete(schema.churchProfiles)
  await db.delete(schema.supervisorProfiles)
  await db.delete(schema.managerProfiles)

  // Por último, usuários, regiões e empresas
  await db.delete(users)
  await db.delete(schema.regions)
  await db.delete(companies)

  // Criar Empresa
  console.log('Seeding company...')
  const companyId = process.env.COMPANY_INIT
  if (!companyId) {
    throw new Error('COMPANY_INIT environment variable is required')
  }

  const [company] = await db
    .insert(companies)
    .values({
      id: companyId,
      name: 'Vinha Ministérios',
      supportEmail: 'suporte@vinha.com',
    })
    .returning()
  if (!company) {
    throw new Error('Failed to create company')
  }

  const password = process.env.DEFAULT_PASSWORD
  if (!password) {
    throw new Error('DEFAULT_PASSWORD environment variable is required')
  }

  // Criar Admin
  console.log('Seeding admin...')
  const [adminUser] = await db
    .insert(users)
    .values({
      id: ADMIN_INIT,
      companyId: company.id,
      email: 'admin@vinha.com',
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      status: 'active',
    })
    .returning()
  if (!adminUser) {
    throw new Error('Failed to create admin user')
  }
  await db.insert(adminProfiles).values({
    userId: adminUser.id,
    firstName: 'Admin',
    lastName: 'Vinha',
    cpf: '111.111.111-11',
    permission: 'superadmin',
  })

  console.log('Database seeding complete.')
  console.log('✅ Company created')
  console.log('✅ Admin user created (admin@vinha.com)')
  await pool.end()
}

main().catch((err: unknown) => {
  console.error('Error during seeding:', err)
  process.exit(1)
})
