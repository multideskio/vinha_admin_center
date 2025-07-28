
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import * as schema from './schema';
import {
  users,
  adminProfiles,
  managerProfiles,
  supervisorProfiles,
  pastorProfiles,
  churchProfiles,
  regions,
  companies
} from './schema';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in the environment variables");
}

if (!process.env.DEFAULT_PASSWORD) {
    throw new Error("DEFAULT_PASSWORD is not set in the environment variables");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log('Seeding database...');

  // Limpa as tabelas na ordem correta para evitar erros de chave estrangeira
  await db.delete(adminProfiles);
  await db.delete(pastorProfiles);
  await db.delete(churchProfiles);
  await db.delete(supervisorProfiles);
  await db.delete(managerProfiles);
  await db.delete(regions);
  await db.delete(users);
  await db.delete(companies);

  // Criar Empresa
  console.log('Seeding company...');
  const [company] = await db.insert(companies).values({
    name: 'Vinha Ministérios',
    supportEmail: 'suporte@vinha.com'
  }).returning();


  // Criar Regiões
  console.log('Seeding regions...');
  const seededRegions = await db.insert(regions).values([
    { name: 'Sul', color: '#3b82f6', companyId: company.id },
    { name: 'Sudeste', color: '#16a34a', companyId: company.id },
    { name: 'Centro-Oeste', color: '#f97316', companyId: company.id },
    { name: 'Norte', color: '#ef4444', companyId: company.id },
    { name: 'Nordeste', color: '#8b5cf6', companyId: company.id },
  ]).returning();
  const centroOeste = seededRegions.find(r => r.name === 'Centro-Oeste')!;

  // Hash da senha padrão
  const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD!, 10);

  // 1. Admin
  console.log('Seeding admin...');
  const [adminUser] = await db.insert(users).values({
    companyId: company.id,
    email: 'admin@vinha.com',
    password: hashedPassword,
    role: 'admin',
    status: 'active',
  }).returning();
  await db.insert(adminProfiles).values({
    userId: adminUser.id,
    firstName: 'Admin',
    lastName: 'Vinha',
    cpf: '111.111.111-11',
    permission: 'superadmin',
  });

  // 2. Gerente
  console.log('Seeding manager...');
  const [managerUser] = await db.insert(users).values({
    companyId: company.id,
    email: 'gerente@vinha.com',
    password: hashedPassword,
    role: 'manager',
    status: 'active',
    titheDay: 10,
  }).returning();
  await db.insert(managerProfiles).values({
    userId: managerUser.id,
    firstName: 'Paulo',
    lastName: 'Ferreira',
    cpf: '222.222.222-22',
  });

  // 3. Supervisor
  console.log('Seeding supervisor...');
  const [supervisorUser] = await db.insert(users).values({
    companyId: company.id,
    email: 'supervisor@vinha.com',
    password: hashedPassword,
    role: 'supervisor',
    status: 'active',
    titheDay: 8,
  }).returning();
  await db.insert(supervisorProfiles).values({
    userId: supervisorUser.id,
    managerId: managerUser.id,
    regionId: centroOeste.id,
    firstName: 'Jabez',
    lastName: 'Henrique',
    cpf: '333.333.333-33',
  });
  
  // 4. Pastor
  console.log('Seeding pastor...');
  const [pastorUser] = await db.insert(users).values({
    companyId: company.id,
    email: 'pastor@vinha.com',
    password: hashedPassword,
    role: 'pastor',
    status: 'active',
    titheDay: 15,
  }).returning();
  await db.insert(pastorProfiles).values({
    userId: pastorUser.id,
    supervisorId: supervisorUser.id,
    firstName: 'João',
    lastName: 'Silva',
    cpf: '444.444.444-44',
  });

  // 5. Igreja
  console.log('Seeding church...');
  const [churchUser] = await db.insert(users).values({
    companyId: company.id,
    email: 'igreja@vinha.com',
    password: hashedPassword,
    role: 'church_account',
    status: 'active',
    titheDay: 5,
  }).returning();
  await db.insert(churchProfiles).values({
      userId: churchUser.id,
      supervisorId: supervisorUser.id,
      cnpj: '12.345.678/0001-99',
      razaoSocial: 'Igreja Exemplo da Vinha',
      nomeFantasia: 'Vinha Exemplo',
      treasurerFirstName: 'Maria',
      treasurerLastName: 'Finanças'
  });

  console.log('Database seeding complete.');
  await pool.end();
}

main().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
