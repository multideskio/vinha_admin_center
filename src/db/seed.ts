import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'
import * as schema from './schema'
import {
  users,
  adminProfiles,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
  churchProfiles,
  regions,
  companies,
} from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in the environment variables')
}

if (!process.env.DEFAULT_PASSWORD) {
  throw new Error('DEFAULT_PASSWORD is not set in the environment variables')
}

if (!process.env.COMPANY_INIT) {
  throw new Error('COMPANY_INIT is not set in the environment variables')
}

// IDs de teste do ambiente
const ADMIN_INIT = process.env.ADMIN_INIT
const GERENTE_INIT = process.env.GERENTE_INIT
const SUPERVISOR_INIT = process.env.SUPERVISOR_INIT
const PASTOR_INIT = process.env.PASTOR_INIT
const IGREJA_INIT = process.env.IGREJA_INIT

if (!ADMIN_INIT || !GERENTE_INIT || !SUPERVISOR_INIT || !PASTOR_INIT || !IGREJA_INIT) {
  throw new Error('Uma ou mais variáveis de ID de usuário inicial não estão definidas no ambiente.')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const db = drizzle(pool, { schema })

async function main(): Promise<void> {
  console.log('Seeding database...')

  // Limpa as tabelas na ordem correta para evitar erros de chave estrangeira
  await db.delete(adminProfiles)
  await db.delete(pastorProfiles)
  await db.delete(churchProfiles)
  await db.delete(supervisorProfiles)
  await db.delete(managerProfiles)
  await db.delete(regions)
  await db.delete(users)
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

  // Criar Regiões
  console.log('Seeding regions...')
  const seededRegions = await db
    .insert(regions)
    .values([
      { name: 'Sul', color: '#3b82f6', companyId: company.id },
      { name: 'Sudeste', color: '#16a34a', companyId: company.id },
      { name: 'Centro-Oeste', color: '#f97316', companyId: company.id },
      { name: 'Norte', color: '#ef4444', companyId: company.id },
      { name: 'Nordeste', color: '#8b5cf6', companyId: company.id },
    ])
    .returning()
  const centroOeste = seededRegions.find((r) => r.name === 'Centro-Oeste')
  if (!centroOeste) {
    throw new Error('Centro-Oeste region not found')
  }

  const password = process.env.DEFAULT_PASSWORD
  if (!password) {
    throw new Error('DEFAULT_PASSWORD environment variable is required')
  }

  // 1. Admin
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

  // 2. Gerente
  console.log('Seeding manager...')
  const [managerUser] = await db
    .insert(users)
    .values({
      id: GERENTE_INIT,
      companyId: company.id,
      email: 'gerente@vinha.com',
      password: await bcrypt.hash(password, 10),
      role: 'manager',
      status: 'active',
      titheDay: 10,
    })
    .returning()
  if (!managerUser) {
    throw new Error('Failed to create manager user')
  }
  await db.insert(managerProfiles).values({
    userId: managerUser.id,
    firstName: 'Paulo',
    lastName: 'Ferreira',
    cpf: '222.222.222-22',
    address: 'Av. Exemplo, 123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    cep: '01000-000',
  })

  // 3. Supervisor
  console.log('Seeding supervisor...')
  const [supervisorUser] = await db
    .insert(users)
    .values({
      id: SUPERVISOR_INIT,
      companyId: company.id,
      email: 'supervisor@vinha.com',
      password: await bcrypt.hash(password, 10),
      role: 'supervisor',
      status: 'active',
      titheDay: 8,
    })
    .returning()
  if (!supervisorUser) {
    throw new Error('Failed to create supervisor user')
  }
  await db.insert(supervisorProfiles).values({
    userId: supervisorUser.id,
    managerId: managerUser.id,
    regionId: centroOeste.id,
    firstName: 'Jabez',
    lastName: 'Henrique',
    cpf: '333.333.333-33',
  })

  // 4. Pastor
  console.log('Seeding pastor...')
  const [pastorUser] = await db
    .insert(users)
    .values({
      id: PASTOR_INIT,
      companyId: company.id,
      email: 'pastor@vinha.com',
      password: await bcrypt.hash(password, 10),
      role: 'pastor',
      status: 'active',
      titheDay: 15,
    })
    .returning()
  if (!pastorUser) {
    throw new Error('Failed to create pastor user')
  }
  await db.insert(pastorProfiles).values({
    userId: pastorUser.id,
    supervisorId: supervisorUser.id,
    firstName: 'João',
    lastName: 'Silva',
    cpf: '444.444.444-44',
  })

  // 5. Igreja
  console.log('Seeding church...')
  const [churchUser] = await db
    .insert(users)
    .values({
      id: IGREJA_INIT,
      companyId: company.id,
      email: 'igreja@vinha.com',
      password: await bcrypt.hash(password, 10),
      role: 'church_account',
      status: 'active',
      titheDay: 5,
    })
    .returning()
  if (!churchUser) {
    throw new Error('Failed to create church user')
  }
  await db.insert(churchProfiles).values({
    userId: churchUser.id,
    supervisorId: supervisorUser.id,
    cnpj: '12.345.678/0001-99',
    razaoSocial: 'Igreja Exemplo da Vinha',
    nomeFantasia: 'Vinha Exemplo',
    treasurerFirstName: 'Maria',
    treasurerLastName: 'Finanças',
  })

  console.log('Database seeding complete.')
  await pool.end()
}

main().catch((err: unknown) => {
  console.error('Error during seeding:', err)
  process.exit(1)
})
