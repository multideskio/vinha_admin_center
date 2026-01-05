#!/usr/bin/env tsx
/**
 * Script de migração de dados do sistema legado para o Vinha Admin Center
 * 
 * Este script extrai dados do sistema antigo (boleto.vinhaministerios.com.br)
 * e os importa para o novo sistema seguindo o schema do Drizzle ORM.
 * 
 * Dados extraídos:
 * - Regiões: 3 registros
 * - Gerentes: 36 registros (10 mostrados)
 * - Supervisores: 77 registros (10 mostrados)  
 * - Usuários: 1.101 registros (igrejas e pastores)
 */

import { db } from '@/db/drizzle'
import { companies, users, regions } from '@/db/schema'
import * as bcrypt from 'bcrypt'

// Dados extraídos do sistema legado
const LEGACY_DATA = {
  regioes: [
    { id: "8", nome: "CENTRO OESTE" },
    { id: "9", nome: "NORTE" },
    { id: "10", nome: "CENTRO SUL" }
  ],
  
  gerentes: [
    { id: "10", nome: "Naor Pedroza", sobrenome: "Mendonça", cpf: "1", email: "naorpedroza@gmail.com" },
    { id: "11", nome: "Mauro Estival", sobrenome: "Estival", cpf: "1", email: "mauroestival@gmail.com" },
    { id: "12", nome: "Almir Dias", sobrenome: "Dias", cpf: "1", email: "pralmirdias@gmail.com" },
    { id: "13", nome: "Carlos Eduardo Garcez", sobrenome: "Garcez", cpf: "1", email: "pastorcarlos@vinhasc.com.br" },
    { id: "14", nome: "Gilberto Camilo", sobrenome: "Junior", cpf: "1", email: "gilberto.camilo@gmail.com" },
    { id: "15", nome: "Ricardo Guimarães", sobrenome: "Guimarães", cpf: "1", email: "pr.ricardo@videirario.com.br" },
    { id: "16", nome: "Alex Martins", sobrenome: "Silva", cpf: "1", email: "pr.alex@hotmail.com" },
    { id: "17", nome: "Francisco Vasco", sobrenome: "Junior", cpf: "1", email: "prfranciscovasco@gmail.com" },
    { id: "18", nome: "Cristian Gimenez", sobrenome: "Gimenez", cpf: "1", email: "prcristiangimenez@gmail.com" },
    { id: "19", nome: "Hermes Pereira", sobrenome: "Junior", cpf: "1", email: "hermes@videiradf.com.br" }
  ],
  
  supervisores: [
    { id: "10", nome: "Wendell Clayton", sobrenome: "Antunes da Silva", gerente: "Naor Pedroza", regiao: "CENTRO OESTE", cpf: "1", email: "prwendellclayton@gmail.com" },
    { id: "50", nome: "Abel Rodrigo", sobrenome: "M. Chaveiro", gerente: "Abel Rodrigo", regiao: "CENTRO OESTE", cpf: "1", email: "pastorabelrodrigo@gmail.com" },
    { id: "69", nome: "Aluízio", sobrenome: "Antônio da Silva", gerente: "Aluízio", regiao: "CENTRO OESTE", cpf: "34764569191", email: "dizimosvinha@gmail.com" },
    { id: "85", nome: "Guilherme Libório", sobrenome: "Miranda", gerente: "Cristian Gimenez", regiao: "CENTRO OESTE", cpf: "01360245138", email: "prguilhermeliborio@gmail.com" },
    { id: "86", nome: "Alisson Rafael", sobrenome: "de Oliveira", gerente: "Cristian Gimenez", regiao: "CENTRO OESTE", cpf: "01975115112", email: "Alissonrafael3003@gmail.com" },
    { id: "18", nome: "Mauro Estival", sobrenome: "Estival", gerente: "Mauro Estival", regiao: "NORTE", cpf: "1", email: "mauroestival@gmail.com" },
    { id: "19", nome: "Almir Dias", sobrenome: "Dias", gerente: "Almir Dias", regiao: "NORTE", cpf: "1", email: "pralmirdias@gmail.com" },
    { id: "23", nome: "Alex Martins", sobrenome: "Silva", gerente: "Alex Martins", regiao: "NORTE", cpf: "1", email: "pr.alexmartins@hotmail.com" },
    { id: "28", nome: "Paulo Alves", sobrenome: "Alves", gerente: "Paulo Alves", regiao: "NORTE", cpf: "1", email: "apostolo12paulo@gmail.com" },
    { id: "29", nome: "Ricardo Augusto", sobrenome: "Martins Barbosa", gerente: "Alain Davidson", regiao: "NORTE", cpf: "1", email: "pastor.ricardoaugusto@gmail.com" }
  ]
}

// Mapeamento de regiões legadas para UUIDs
const REGION_MAP = new Map<string, string>()

// Mapeamento de gerentes legados para UUIDs  
const MANAGER_MAP = new Map<string, string>()

// Mapeamento de supervisores legados para UUIDs
const SUPERVISOR_MAP = new Map<string, string>()

async function getCompanyId(): Promise<string> {
  const [company] = await db.select().from(companies).limit(1)
  if (!company) {
    throw new Error('Nenhuma empresa encontrada. Execute o seed primeiro.')
  }
  return company.id
}

async function migrateRegions(companyId: string) {
  console.log('🌍 Migrando regiões...')
  
  // Cores padrão para as regiões
  const regionColors = ['#3B82F6', '#10B981', '#F59E0B'] // Azul, Verde, Amarelo
  
  for (let i = 0; i < LEGACY_DATA.regioes.length; i++) {
    const regiao = LEGACY_DATA.regioes[i]
    
    if (!regiao) {
      console.warn(`⚠️  Região no índice ${i} é indefinida`)
      continue
    }
    
    const result = await db.insert(regions).values({
      companyId,
      name: regiao.nome,
      color: regionColors[i] || '#6B7280', // Cor padrão cinza se não houver cor específica
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: regions.id })
    
    const newRegion = result[0]
    if (!newRegion) {
      console.error(`❌ Erro ao criar região: ${regiao.nome}`)
      continue
    }
    
    REGION_MAP.set(regiao.nome, newRegion.id)
    console.log(`✅ Região criada: ${regiao.nome} (${newRegion.id})`)
  }
}

async function migrateManagers(companyId: string) {
  console.log('👔 Migrando gerentes...')
  
  for (const gerente of LEGACY_DATA.gerentes) {
    const fullName = `${gerente.nome} ${gerente.sobrenome}`.trim()
    
    // Senha padrão para migração (deve ser alterada no primeiro login)
    const hashedPassword = await bcrypt.hash('vinha123', 10)
    
    const result = await db.insert(users).values({
      companyId,
      email: gerente.email,
      password: hashedPassword,
      role: 'manager',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: users.id })
    
    const newManager = result[0]
    if (!newManager) {
      console.error(`❌ Erro ao criar gerente: ${fullName}`)
      continue
    }
    
    MANAGER_MAP.set(fullName, newManager.id)
    console.log(`✅ Gerente criado: ${fullName} (${gerente.email})`)
  }
}

async function migrateSupervisors(companyId: string) {
  console.log('👨‍💼 Migrando supervisores...')
  
  for (const supervisor of LEGACY_DATA.supervisores) {
    const fullName = `${supervisor.nome} ${supervisor.sobrenome}`.trim()
    
    // Buscar região correspondente
    const regionId = REGION_MAP.get(supervisor.regiao)
    if (!regionId) {
      console.warn(`⚠️  Região não encontrada para supervisor ${fullName}: ${supervisor.regiao}`)
      continue
    }
    
    // Senha padrão para migração
    const hashedPassword = await bcrypt.hash('vinha123', 10)
    
    const result = await db.insert(users).values({
      companyId,
      email: supervisor.email,
      password: hashedPassword,
      role: 'supervisor',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: users.id })
    
    const newSupervisor = result[0]
    if (!newSupervisor) {
      console.error(`❌ Erro ao criar supervisor: ${fullName}`)
      continue
    }
    
    SUPERVISOR_MAP.set(fullName, newSupervisor.id)
    console.log(`✅ Supervisor criado: ${fullName} (${supervisor.email})`)
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando migração de dados legados...')
    
    const companyId = await getCompanyId()
    console.log(`📊 Empresa encontrada: ${companyId}`)
    
    // Migrar em ordem de dependência
    await migrateRegions(companyId)
    await migrateManagers(companyId)
    await migrateSupervisors(companyId)
    
    console.log('\n📈 Resumo da migração:')
    console.log(`✅ ${LEGACY_DATA.regioes.length} regiões migradas`)
    console.log(`✅ ${LEGACY_DATA.gerentes.length} gerentes migrados`)
    console.log(`✅ ${LEGACY_DATA.supervisores.length} supervisores migrados`)
    console.log('\n🎉 Migração concluída com sucesso!')
    
    console.log('\n📝 Próximos passos:')
    console.log('1. Extrair dados completos dos usuários (1.101 registros)')
    console.log('2. Migrar pastores e igrejas')
    console.log('3. Migrar dados financeiros/transações')
    console.log('4. Configurar relacionamentos entre entidades')
    console.log('5. Validar integridade dos dados migrados')
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    process.exit(1)
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main()
}

export { LEGACY_DATA, REGION_MAP, MANAGER_MAP, SUPERVISOR_MAP }