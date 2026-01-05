#!/usr/bin/env node

/**
 * Script local para verificação de qualidade
 * Substitui o CI/CD quando GitHub Actions não está disponível
 */

const { execSync } = require('child_process');

// Função para colorir texto sem dependência externa
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

console.log(colors.blue('🔍 Iniciando verificação de qualidade local...\n'));

const checks = [
  {
    name: 'TypeScript Type Check',
    command: 'npm run typecheck',
    icon: '🔧'
  },
  {
    name: 'ESLint',
    command: 'npm run lint',
    icon: '🔍'
  },
  {
    name: 'Prettier Format Check',
    command: 'npm run format -- --check',
    icon: '🎨'
  }
];

let allPassed = true;

for (const check of checks) {
  try {
    console.log(colors.yellow(`${check.icon} Executando ${check.name}...`));
    execSync(check.command, { stdio: 'inherit' });
    console.log(colors.green(`✅ ${check.name} passou!\n`));
  } catch (error) {
    console.log(colors.red(`❌ ${check.name} falhou!\n`));
    allPassed = false;
  }
}

if (allPassed) {
  console.log(colors.bold(colors.green('🎉 Todas as verificações passaram! Código pronto para commit.')));
  process.exit(0);
} else {
  console.log(colors.bold(colors.red('❌ Algumas verificações falharam. Corrija os problemas antes do commit.')));
  process.exit(1);
}