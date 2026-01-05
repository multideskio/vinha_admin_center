#!/usr/bin/env node

/**
 * Script para corrigir problemas comuns de lint automaticamente
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Função para encontrar arquivos recursivamente
function findFiles(dir, extension) {
  const files = []

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath)
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath)
      }
    }
  }

  traverse(dir)
  return files
}

// Função para corrigir problemas comuns
function fixCommonIssues(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false

  // Corrigir parâmetros não utilizados adicionando underscore
  const unusedParamRegex = /\b(function|async function|\w+\s*:\s*\([^)]*)\s+(\w+)(?=\s*[,)])/g

  // Corrigir variáveis let que nunca são reatribuídas
  content = content.replace(/\blet\s+(\w+)\s*=/g, (match, varName) => {
    // Verificar se a variável é reatribuída depois
    const reassignRegex = new RegExp(`\\b${varName}\\s*=(?!=)`, 'g')
    const matches = content.match(reassignRegex)
    if (!matches || matches.length <= 1) {
      changed = true
      return match.replace('let', 'const')
    }
    return match
  })

  // Corrigir imports não utilizados (remover completamente)
  const lines = content.split('\n')
  const newLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Pular linhas de import que contêm apenas imports não utilizados
    if (line.trim().startsWith('import') && line.includes('{')) {
      // Manter a linha por enquanto - o ESLint --fix cuidará disso
      newLines.push(line)
    } else {
      newLines.push(line)
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, newLines.join('\n'))
    console.log(`✅ Corrigido: ${filePath}`)
  }
}

// Função principal
function main() {
  console.log('🔧 Iniciando correção automática de problemas de lint...\n')

  // Encontrar todos os arquivos TypeScript/React
  const srcFiles = findFiles('src', '.tsx').concat(findFiles('src', '.ts'))
  const scriptFiles = findFiles('scripts', '.ts')

  const allFiles = [...srcFiles, ...scriptFiles]

  console.log(`📁 Encontrados ${allFiles.length} arquivos para processar\n`)

  // Corrigir problemas comuns
  for (const file of allFiles) {
    try {
      fixCommonIssues(file)
    } catch (error) {
      console.error(`❌ Erro ao processar ${file}:`, error.message)
    }
  }

  console.log('\n🔧 Executando ESLint --fix para correções automáticas...')

  try {
    execSync('npx eslint "src/**/*.{ts,tsx}" "scripts/**/*.ts" --fix', {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log('✅ ESLint --fix executado com sucesso')
  } catch (error) {
    console.log('⚠️  ESLint --fix executado (alguns problemas podem persistir)')
  }

  console.log('\n🎉 Correção automática concluída!')
  console.log('\n📝 Próximos passos:')
  console.log('1. Revisar as mudanças com git diff')
  console.log('2. Executar npm run lint para verificar problemas restantes')
  console.log('3. Corrigir manualmente problemas específicos se necessário')
}

if (require.main === module) {
  main()
}
