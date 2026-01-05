#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Função para corrigir variáveis não utilizadas de forma segura
function fixUnusedVars(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Correções específicas por arquivo
  const fixes = {
    'src/app/api/v1/relatorios/route.ts': [
      { from: /export async function GET\(request: Request\)/g, to: 'export async function GET(_request: Request)' },
      { from: /\(filters: any\) =>/g, to: '(_filters: any) =>' }
    ],
    'src/app/api/v1/supervisor/igrejas/[id]/transactions/route.ts': [
      { from: /const supervisorId = /g, to: 'const _supervisorId = ' }
    ],
    'src/app/api/v1/supervisor/pastores/[id]/transactions/route.ts': [
      { from: /const supervisorId = /g, to: 'const _supervisorId = ' }
    ],
    'src/app/igreja/_components/header.tsx': [
      { from: /const Logo = /g, to: 'const _Logo = ' }
    ],
    'src/app/igreja/contribuir/page.tsx': [
      { from: /const { toast } = /g, to: 'const { toast: _toast } = ' }
    ],
    'src/app/igreja/dashboard/page.tsx': [
      { from: /const \[isRefreshing, /g, to: 'const [_isRefreshing, ' }
    ],
    'src/app/igreja/layout.tsx': [
      { from: /const \[company, /g, to: 'const [_company, ' }
    ],
    'src/app/manager/igrejas/page.tsx': [
      { from: /\(item, index\) =>/g, to: '(item, _index) =>' }
    ],
    'src/app/manager/pastores/page.tsx': [
      { from: /\(item, index\) =>/g, to: '(item, _index) =>' }
    ],
    'src/app/manager/supervisores/page.tsx': [
      { from: /\(item, index\) =>/g, to: '(item, _index) =>' }
    ],
    'src/app/pastor/_components/header.tsx': [
      { from: /const Logo = /g, to: 'const _Logo = ' }
    ],
    'src/app/pastor/contribuir/page.tsx': [
      { from: /const { toast } = /g, to: 'const { toast: _toast } = ' }
    ],
    'src/app/pastor/layout.tsx': [
      { from: /const \[company, /g, to: 'const [_company, ' }
    ],
    'src/app/supervisor/contribuicoes/page.tsx': [
      { from: /const { toast } = /g, to: 'const { toast: _toast } = ' }
    ],
    'src/app/supervisor/layout.tsx': [
      { from: /const \[company, /g, to: 'const [_company, ' }
    ],
    'src/app/supervisor/pastores/[id]/page.tsx': [
      { from: /const DeleteProfileDialog = /g, to: 'const _DeleteProfileDialog = ' },
      { from: /const \[supervisors, setSupervisors\] = /g, to: 'const [_supervisors, _setSupervisors] = ' }
    ],
    'src/app/supervisor/perfil/page.tsx': [
      { from: /const fetchSettings = /g, to: 'const _fetchSettings = ' },
      { from: /const formatCPF = /g, to: 'const _formatCPF = ' }
    ],
    'src/components/contributions/ContributionForm.tsx': [
      { from: /const { userRole } = /g, to: 'const { userRole: _userRole } = ' },
      { from: /const \[cardState, /g, to: 'const [_cardState, ' },
      { from: /const \[, updateCardState\] = /g, to: 'const [, _updateCardState] = ' }
    ],
    'src/components/contributions/forms/ContributionDataForm.tsx': [
      { from: /const \[, , isLoading\] = /g, to: 'const [, , _isLoading] = ' }
    ],
    'src/components/contributions/payments/PixPayment.tsx': [
      { from: /const { transactionId, /g, to: 'const { transactionId: _transactionId, ' },
      { from: /onSuccess, onExpired } = /g, to: 'onSuccess: _onSuccess, onExpired: _onExpired } = ' }
    ],
    'src/components/ui/phone-input.tsx': [
      { from: /const \[, , , \] = /g, to: 'const [, , , _] = ' }
    ]
  };

  if (fixes[filePath]) {
    fixes[filePath].forEach(fix => {
      const newContent = content.replace(fix.from, fix.to);
      if (newContent !== content) {
        content = newContent;
        changed = true;
      }
    });
  }

  return { content, changed };
}

// Lista de arquivos para corrigir
const filesToFix = [
  'src/app/api/v1/relatorios/route.ts',
  'src/app/api/v1/supervisor/igrejas/[id]/transactions/route.ts',
  'src/app/api/v1/supervisor/pastores/[id]/transactions/route.ts',
  'src/app/igreja/_components/header.tsx',
  'src/app/igreja/contribuir/page.tsx',
  'src/app/igreja/dashboard/page.tsx',
  'src/app/igreja/layout.tsx',
  'src/app/manager/igrejas/page.tsx',
  'src/app/manager/pastores/page.tsx',
  'src/app/manager/supervisores/page.tsx',
  'src/app/pastor/_components/header.tsx',
  'src/app/pastor/contribuir/page.tsx',
  'src/app/pastor/layout.tsx',
  'src/app/supervisor/contribuicoes/page.tsx',
  'src/app/supervisor/layout.tsx',
  'src/app/supervisor/pastores/[id]/page.tsx',
  'src/app/supervisor/perfil/page.tsx',
  'src/components/contributions/ContributionForm.tsx',
  'src/components/contributions/forms/ContributionDataForm.tsx',
  'src/components/contributions/payments/PixPayment.tsx',
  'src/components/ui/phone-input.tsx'
];

console.log('🔧 Corrigindo variáveis não utilizadas...\n');

let fixedFiles = 0;

filesToFix.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    try {
      const { content, changed } = fixUnusedVars(filePath);
      
      if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Corrigido: ${filePath}`);
        fixedFiles++;
      }
    } catch (error) {
      console.log(`❌ Erro ao corrigir ${filePath}:`, error.message);
    }
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
  }
});

console.log(`\n🎉 Correção concluída! ${fixedFiles} arquivos corrigidos.`);