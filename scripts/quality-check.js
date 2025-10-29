#!/usr/bin/env node

/**
 * Script local para verificação de qualidade
 * Substitui o CI/CD quando GitHub Actions não está disponível
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

console.log(chalk.blue('🔍 Iniciando verificação de qualidade local...\n'));

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
  },
  {
    name: 'Build Test',
    command: 'npm run build',
    icon: '🏗️'
  }
];

let allPassed = true;

for (const check of checks) {
  try {
    console.log(chalk.yellow(`${check.icon} Executando ${check.name}...`));
    execSync(check.command, { stdio: 'inherit' });
    console.log(chalk.green(`✅ ${check.name} passou!\n`));
  } catch (error) {
    console.log(chalk.red(`❌ ${check.name} falhou!\n`));
    allPassed = false;
  }
}

if (allPassed) {
  console.log(chalk.green.bold('🎉 Todas as verificações passaram! Código pronto para commit.'));
  process.exit(0);
} else {
  console.log(chalk.red.bold('❌ Algumas verificações falharam. Corrija os problemas antes do commit.'));
  process.exit(1);
}