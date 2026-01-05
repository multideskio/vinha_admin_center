#!/usr/bin/env node

/**
 * Script para verificar atualizações de dependências
 * Ajuda a decidir quais PRs do Dependabot mergear
 */

const { execSync } = require('child_process')

console.log('🔍 Verificando dependências desatualizadas...\n')

try {
  // Verificar dependências desatualizadas
  console.log('📦 Dependências desatualizadas:')
  execSync('npm outdated', { stdio: 'inherit' })
} catch (error) {
  // npm outdated retorna exit code 1 quando há dependências desatualizadas
  // Isso é normal
}

console.log('\n🔒 Verificando vulnerabilidades de segurança:')
try {
  execSync('npm audit --audit-level=moderate', { stdio: 'inherit' })
  console.log('✅ Nenhuma vulnerabilidade encontrada!')
} catch (error) {
  console.log('⚠️ Vulnerabilidades encontradas - verifique as PRs do Dependabot')
}

console.log('\n💡 Dicas:')
console.log('- PRs de segurança: Mergear SEMPRE')
console.log('- Patch updates (x.x.X): Geralmente seguros')
console.log('- Minor updates (x.X.x): Revisar changelog')
console.log('- Major updates (X.x.x): Testar cuidadosamente')
