#!/usr/bin/env tsx
/**
 * Script completo de migração de dados do sistema legado
 * 
 * Este script processa os dados extraídos e os migra para o novo sistema,
 * criando todos os relacionamentos necessários.
 */

import { db } from '@/db/drizzle'
import { companies, users, regions, managerProfiles, supervisorProfiles, pastorProfiles, churchProfiles } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import * as bcrypt from 'bcrypt'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface LegacyData {
  regioes: Array<{ id: string; nome: string }>
  gerentes: Array<{ id: string; nome: string; sobrenome: string; cpf: string; email: string }>
  supervisores: Array<{ id: string; nome: string; sobrenome: string; gerente: string; regiao: string; cpf: string; email: string }>
  usuarios: Array<{ id: string; nome: string; regiao: string; gerente: string; supervisor: string; tipo: string }>
  totalRecords: {
    regioes: number
    gerentes: number
    supervisores: number
    usuarios: number
  }
}

class CompleteMigration {
  private legacyData: LegacyData
  private companyId: string = ''
  private regionMap = new Map<string, string>()
  private managerMap = new Map<string, string>()
  private supervisorMap = new Map<string, string>()

  constructor() {
    this.loadLegacyData()
  }

  private loadLegacyData() {
    // Tentar carregar dados limpos primeiro, depois os originais
    const possiblePaths = [
      join(process.cwd(), 'scripts', 'legacy-data-clean.json'),
      join(process.cwd(), 'scripts', 'legacy-data-export.json'),
      join(process.cwd(), 'scripts', 'legacy-data-partial-error.json')
    ]
    
    let dataPath = ''
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        dataPath = path
        break
      }
    }
    
    if (!dataPath) {
      throw new Error(`Nenhum arquivo de dados encontrado. Execute primeiro: npm run migrate:extract ou npm run migrate:process`)
    }
    
    const rawData = readFileSync(dataPath, 'utf-8')
    this.legacyData = JSON.parse(rawData)
    
    console.log(`📊 Dados legados carregados de: ${dataPath}`)
    console.log(`   - ${this.legacyData.totalRecords.regioes} regiões`)
    console.log(`   - ${this.legacyData.totalRecords.gerentes} gerentes`)
    console.log(`   - ${this.legacyData.totalRecords.supervisores} supervisores`)
    console.log(`   - ${this.legacyData.totalRecords.usuarios} usuários`)
  }

  private async getCompanyId(): Promise<string> {
    const [company] = await db.select().from(companies).limit(1)
    if (!company) {
      throw new Error('Nenhuma empresa encontrada. Execute o seed primeiro.')
    }
    this.companyId = company.id
    return company.id
  }

  private async migrateRegions() {
    console.log('\n🌍 Migrando regiões...')
    
    for (const regiao of this.legacyData.regioes) {
      try {
        // Verificar se a região já existe
        const existingRegion = await db.select({ id: regions.id })
          .from(regions)
          .where(eq(regions.name, regiao.nome))
          .limit(1)
        
        if (existingRegion.length > 0) {
          this.regionMap.set(regiao.nome, existingRegion[0].id)
          console.log(`⚠️  Região já existe: ${regiao.nome}`)
          continue
        }
        
        const [newRegion] = await db.insert(regions).values({
          companyId: this.companyId,
          name: regiao.nome,
          color: '#3B82F6', // Default blue color for regions
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning({ id: regions.id })
        
        this.regionMap.set(regiao.nome, newRegion.id)
        console.log(`✅ Região: ${regiao.nome}`)
        
      } catch (error) {
        console.error(`❌ Erro ao migrar região ${regiao.nome}:`, error)
      }
    }
  }

  private async migrateManagers() {
    console.log('\n👔 Migrando gerentes...')
    
    for (const gerente of this.legacyData.gerentes) {
      try {
        const fullName = `${gerente.nome} ${gerente.sobrenome}`.trim()
        
        // Verificar se o usuário já existe
        const existingUser = await db.select({ id: users.id })
          .from(users)
          .where(eq(users.email, gerente.email))
          .limit(1)
        
        if (existingUser.length > 0) {
          // Atualizar usuário existente para evitar envio de email
          await db.update(users)
            .set({ welcomeSent: true })
            .where(eq(users.id, existingUser[0].id))
          
          this.managerMap.set(fullName, existingUser[0].id)
          console.log(`⚠️  Gerente já existe: ${fullName} (${gerente.email})`)
          continue
        }
        
        const hashedPassword = await bcrypt.hash('vinha123', 10)
        
        const [newManager] = await db.insert(users).values({
          companyId: this.companyId,
          email: gerente.email,
          password: hashedPassword,
          role: 'manager',
          status: 'active',
          welcomeSent: true, // ✅ Evitar envio de email de boas-vindas
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning({ id: users.id })
        
        // Criar perfil de gerente
        await db.insert(managerProfiles).values({
          userId: newManager.id,
          firstName: gerente.nome,
          lastName: gerente.sobrenome,
          cpf: gerente.cpf !== '1' ? gerente.cpf : null,
        })
        
        this.managerMap.set(fullName, newManager.id)
        console.log(`✅ Gerente: ${fullName} (${gerente.email})`)
        
      } catch (error) {
        console.error(`❌ Erro ao migrar gerente ${gerente.nome}:`, error)
      }
    }
  }

  private async migrateSupervisors() {
    console.log('\n👨‍💼 Migrando supervisores...')
    
    for (const supervisor of this.legacyData.supervisores) {
      try {
        const fullName = `${supervisor.nome} ${supervisor.sobrenome}`.trim()
        const hashedPassword = await bcrypt.hash('vinha123', 10)
        
        const [newSupervisor] = await db.insert(users).values({
          companyId: this.companyId,
          email: supervisor.email,
          password: hashedPassword,
          role: 'supervisor',
          status: 'active',
          welcomeSent: true, // ✅ Evitar envio de email de boas-vindas
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning({ id: users.id })
        
        // Criar perfil de supervisor
        await db.insert(supervisorProfiles).values({
          userId: newSupervisor.id,
          firstName: supervisor.nome,
          lastName: supervisor.sobrenome,
          cpf: supervisor.cpf !== '1' ? supervisor.cpf : null,
          managerId: this.managerMap.get(supervisor.gerente) || null,
          regionId: this.regionMap.get(supervisor.regiao) || null,
        })
        
        this.supervisorMap.set(fullName, newSupervisor.id)
        console.log(`✅ Supervisor: ${fullName} (${supervisor.email})`)
        
      } catch (error) {
        console.error(`❌ Erro ao migrar supervisor ${supervisor.nome}:`, error)
      }
    }
  }

  private async migrateUsers() {
    console.log('\n👥 Migrando usuários (pastores e igrejas)...')
    
    let pastorCount = 0
    let churchCount = 0
    let errorCount = 0
    
    for (const usuario of this.legacyData.usuarios) {
      try {
        // Determinar role baseado no tipo
        const role = usuario.tipo.toLowerCase() === 'igreja' ? 'church_account' : 'pastor'
        
        // Gerar email temporário se não tiver nome
        const email = usuario.nome 
          ? `${usuario.nome.toLowerCase().replace(/\s+/g, '.')}@temp.vinha.com`
          : `user${usuario.id}@temp.vinha.com`
        
        const hashedPassword = await bcrypt.hash('vinha123', 10)
        
        const [newUser] = await db.insert(users).values({
          companyId: this.companyId,
          email: email,
          password: hashedPassword,
          role: role as any,
          status: 'active',
          welcomeSent: true, // ✅ Evitar envio de email de boas-vindas
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning({ id: users.id })
        
        // Criar perfil se tiver nome
        if (usuario.nome) {
          const nameParts = usuario.nome.split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''
          
          if (role === 'pastor') {
            await db.insert(pastorProfiles).values({
              userId: newUser.id,
              firstName: firstName,
              lastName: lastName,
              supervisorId: this.supervisorMap.get(usuario.supervisor) || null,
              cpf: `temp-${usuario.id}`, // CPF temporário para evitar conflitos
            })
          } else {
            await db.insert(churchProfiles).values({
              userId: newUser.id,
              supervisorId: this.supervisorMap.get(usuario.supervisor) || null,
              cnpj: `temp-${usuario.id}`, // CNPJ temporário para evitar conflitos
              razaoSocial: usuario.nome,
              nomeFantasia: usuario.nome,
            })
          }
        }
        
        if (role === 'pastor') {
          pastorCount++
        } else {
          churchCount++
        }
        
        if ((pastorCount + churchCount) % 100 === 0) {
          console.log(`📊 Progresso: ${pastorCount} pastores, ${churchCount} igrejas migrados`)
        }
        
      } catch (error) {
        errorCount++
        console.error(`❌ Erro ao migrar usuário ${usuario.id}:`, error)
      }
    }
    
    console.log(`✅ Usuários migrados: ${pastorCount} pastores, ${churchCount} igrejas`)
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} erros durante a migração de usuários`)
    }
  }

  private async validateMigration() {
    console.log('\n🔍 Validando migração...')
    
    const regionCount = await db.select().from(regions)
    const userCount = await db.select().from(users)
    
    console.log(`📊 Dados no novo sistema:`)
    console.log(`   - Regiões: ${regionCount.length}`)
    console.log(`   - Usuários: ${userCount.length}`)
    
    // Verificar integridade dos dados - contar usuários sem perfil
    const managersWithoutProfile = await db
      .select({ id: users.id })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(and(eq(users.role, 'manager'), eq(managerProfiles.userId, null)))
    
    const supervisorsWithoutProfile = await db
      .select({ id: users.id })
      .from(users)
      .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .where(and(eq(users.role, 'supervisor'), eq(supervisorProfiles.userId, null)))
    
    const pastorsWithoutProfile = await db
      .select({ id: users.id })
      .from(users)
      .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .where(and(eq(users.role, 'pastor'), eq(pastorProfiles.userId, null)))
    
    const churchesWithoutProfile = await db
      .select({ id: users.id })
      .from(users)
      .leftJoin(churchProfiles, eq(users.id, churchProfiles.userId))
      .where(and(eq(users.role, 'church_account'), eq(churchProfiles.userId, null)))
    
    const totalWithoutProfile = managersWithoutProfile.length + supervisorsWithoutProfile.length + 
                               pastorsWithoutProfile.length + churchesWithoutProfile.length
    
    if (totalWithoutProfile > 0) {
      console.log(`⚠️  ${totalWithoutProfile} usuários sem perfil:`)
      console.log(`   - ${managersWithoutProfile.length} gerentes`)
      console.log(`   - ${supervisorsWithoutProfile.length} supervisores`)
      console.log(`   - ${pastorsWithoutProfile.length} pastores`)
      console.log(`   - ${churchesWithoutProfile.length} igrejas`)
    }
    
    console.log('✅ Validação concluída')
  }

  async migrate() {
    try {
      console.log('🚀 Iniciando migração completa...')
      
      await this.getCompanyId()
      console.log(`📊 Empresa: ${this.companyId}`)
      
      await this.migrateRegions()
      await this.migrateManagers()
      await this.migrateSupervisors()
      await this.migrateUsers()
      
      await this.validateMigration()
      
      console.log('\n🎉 Migração completa finalizada!')
      console.log('\n📝 Próximos passos:')
      console.log('1. Configurar relacionamentos entre usuários')
      console.log('2. Migrar dados financeiros/transações')
      console.log('3. Configurar permissões específicas')
      console.log('4. Testar autenticação dos usuários migrados')
      console.log('5. Enviar credenciais temporárias por email')
      
    } catch (error) {
      console.error('❌ Erro na migração:', error)
      throw error
    }
  }
}

async function main() {
  const migration = new CompleteMigration()
  await migration.migrate()
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error)
}

export { CompleteMigration }