#!/usr/bin/env tsx
/**
 * Script para processar dados parciais extraídos
 *
 * Este script pega os dados parciais que foram salvos e os processa
 * para migração, mesmo que a extração não tenha sido completa.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

interface PartialData {
  regioes: Array<{ id: string; nome: string }>
  gerentes: Array<{ id: string; nome: string; sobrenome: string; cpf: string; email: string }>
  supervisores: Array<{
    id: string
    nome: string
    sobrenome: string
    gerente: string
    regiao: string
    cpf: string
    email: string
  }>
  usuarios: Array<{
    id: string
    nome: string
    regiao: string
    gerente: string
    supervisor: string
    tipo: string
  }>
  extractedAt: string
  totalRecords: {
    regioes: number
    gerentes: number
    supervisores: number
    usuarios: number
  }
}

async function processPartialData() {
  console.log('🔄 Processando dados parciais...')

  // Tentar carregar dados de diferentes arquivos
  const possibleFiles = [
    'legacy-data-partial-managers.json', // Priorizar o arquivo de gerentes
    'legacy-data-partial-error.json',
    'legacy-data-partial-regions.json',
    'legacy-data-export.json',
  ]

  let data: PartialData | null = null
  // const sourceFile = '' // Unused variable removed

  for (const file of possibleFiles) {
    const filePath = join(process.cwd(), 'scripts', file)
    if (existsSync(filePath)) {
      try {
        const rawData = readFileSync(filePath, 'utf-8')
        data = JSON.parse(rawData)
        // sourceFile = file
        console.log(`✅ Dados carregados de: ${file}`)
        break
      } catch (error) {
        console.log(`⚠️  Erro ao ler ${file}:`, error)
      }
    }
  }

  if (!data) {
    console.error('❌ Nenhum arquivo de dados parciais encontrado')
    return
  }

  // Limpar e validar dados
  const cleanData: PartialData = {
    regioes: data.regioes || [],
    gerentes: (data.gerentes || []).filter((g) => g.email && g.nome),
    supervisores: (data.supervisores || []).filter((s) => s.email && s.nome),
    usuarios: (data.usuarios || []).filter((u) => u.id && u.tipo),
    extractedAt: new Date().toISOString(),
    totalRecords: {
      regioes: 0,
      gerentes: 0,
      supervisores: 0,
      usuarios: 0,
    },
  }

  // Atualizar contadores
  cleanData.totalRecords.regioes = cleanData.regioes.length
  cleanData.totalRecords.gerentes = cleanData.gerentes.length
  cleanData.totalRecords.supervisores = cleanData.supervisores.length
  cleanData.totalRecords.usuarios = cleanData.usuarios.length

  // Remover duplicatas por email
  const uniqueGerentes = new Map()
  cleanData.gerentes.forEach((g) => {
    if (!uniqueGerentes.has(g.email)) {
      uniqueGerentes.set(g.email, g)
    }
  })
  cleanData.gerentes = Array.from(uniqueGerentes.values())
  cleanData.totalRecords.gerentes = cleanData.gerentes.length

  const uniqueSupervisores = new Map()
  cleanData.supervisores.forEach((s) => {
    if (!uniqueSupervisores.has(s.email)) {
      uniqueSupervisores.set(s.email, s)
    }
  })
  cleanData.supervisores = Array.from(uniqueSupervisores.values())
  cleanData.totalRecords.supervisores = cleanData.supervisores.length

  // Salvar dados limpos
  const outputPath = join(process.cwd(), 'scripts', 'legacy-data-clean.json')
  writeFileSync(outputPath, JSON.stringify(cleanData, null, 2))

  console.log('\n📊 Dados processados:')
  console.log(`✅ ${cleanData.totalRecords.regioes} regiões`)
  console.log(`✅ ${cleanData.totalRecords.gerentes} gerentes (únicos)`)
  console.log(`✅ ${cleanData.totalRecords.supervisores} supervisores (únicos)`)
  console.log(`✅ ${cleanData.totalRecords.usuarios} usuários`)
  console.log(`\n💾 Dados limpos salvos em: ${outputPath}`)

  // Mostrar amostra dos dados
  console.log('\n📋 Amostra dos gerentes:')
  cleanData.gerentes.slice(0, 5).forEach((g) => {
    console.log(`   - ${g.nome} ${g.sobrenome} (${g.email})`)
  })

  if (cleanData.supervisores.length > 0) {
    console.log('\n📋 Amostra dos supervisores:')
    cleanData.supervisores.slice(0, 5).forEach((s) => {
      console.log(`   - ${s.nome} ${s.sobrenome} (${s.email})`)
    })
  }

  console.log('\n🎉 Processamento concluído!')
  console.log('💡 Agora você pode usar: npm run migrate:import')
}

async function main() {
  try {
    await processPartialData()
  } catch (error) {
    console.error('❌ Erro no processamento:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { processPartialData }
