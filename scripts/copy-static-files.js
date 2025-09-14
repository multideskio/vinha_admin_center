#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script para copiar arquivos estáticos para o diretório standalone
 * Necessário para que CSS e outros assets funcionem corretamente no modo standalone
 */

const sourceDir = '.next/static';
const targetDir = '.next/standalone/.next/static';

console.log('🔄 Copiando arquivos estáticos para standalone...');

try {
  // Verifica se o diretório de origem existe
  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Diretório de origem não encontrado:', sourceDir);
    process.exit(1);
  }

  // Cria o diretório de destino se não existir
  if (!fs.existsSync(path.dirname(targetDir))) {
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  }

  // Copia os arquivos usando xcopy no Windows ou cp no Unix
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    execSync(`xcopy "${sourceDir}" "${targetDir}" /E /I /Y`, { stdio: 'inherit' });
  } else {
    execSync(`cp -r "${sourceDir}" "${targetDir}"`, { stdio: 'inherit' });
  }

  console.log('✅ Arquivos estáticos copiados com sucesso!');
  console.log('📁 Origem:', sourceDir);
  console.log('📁 Destino:', targetDir);
  
} catch (error) {
  console.error('❌ Erro ao copiar arquivos estáticos:', error.message);
  process.exit(1);
}