#!/usr/bin/env node

const fs = require('fs')

console.log('🔧 Aplicando correções finais de lint...\n')

// Correções específicas e seguras
const fixes = [
  // Scripts
  {
    file: 'scripts/process-partial-data.ts',
    from: /const _sourceFile = ''/g,
    to: "// const sourceFile = '' // Unused variable removed",
  },

  // APIs - parâmetros não utilizados
  {
    file: 'src/app/api/v1/notification-rules/bootstrap/route.ts',
    from: /export async function POST\(_request: Request\)/g,
    to: 'export async function POST()',
  },

  {
    file: 'src/app/api/v1/manager/gerentes/route.ts',
    from: /export async function GET\(_request: Request\)/g,
    to: 'export async function GET()',
  },

  {
    file: 'src/app/api/v1/manager/gerentes/route.ts',
    from: /export async function POST\(_request: Request\)/g,
    to: 'export async function POST()',
  },

  {
    file: 'src/app/api/v1/relatorios/route.ts',
    from: /export async function GET\(_request: Request\)/g,
    to: 'export async function GET()',
  },

  // Variáveis não utilizadas - remover completamente
  {
    file: 'src/app/api/v1/supervisor/igrejas/[id]/transactions/route.ts',
    from: /const _supervisorId = user\.id/g,
    to: '// const supervisorId = user.id // Unused variable removed',
  },

  {
    file: 'src/app/api/v1/supervisor/pastores/[id]/transactions/route.ts',
    from: /const _supervisorId = user\.id/g,
    to: '// const supervisorId = user.id // Unused variable removed',
  },

  // Componentes - variáveis não utilizadas
  {
    file: 'src/app/igreja/_components/header.tsx',
    from: /const _Logo = /g,
    to: '// const Logo = // Unused component removed\n  // ',
  },

  {
    file: 'src/app/pastor/_components/header.tsx',
    from: /const Logo = /g,
    to: '// const Logo = // Unused component removed\n  // ',
  },

  // Aspas não escapadas - correção simples
  {
    file: 'src/components/contributions/forms/ContributionSummary.tsx',
    from: /"{data\.description}"/g,
    to: '&ldquo;{data.description}&rdquo;',
  },

  {
    file: 'src/components/contributions/payments/BoletoPayment.tsx',
    from: /"Pagar boleto"/g,
    to: '&ldquo;Pagar boleto&rdquo;',
  },

  {
    file: 'src/components/contributions/payments/PaymentSuccess.tsx',
    from: /"Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois\s+Deus ama quem dá com alegria\."/g,
    to: '&ldquo;Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria.&rdquo;',
  },

  {
    file: 'src/components/contributions/payments/PixPayment.tsx',
    from: /"Pagar com PIX"/g,
    to: '&ldquo;Pagar com PIX&rdquo;',
  },
]

let fixedFiles = 0

fixes.forEach((fix) => {
  if (fs.existsSync(fix.file)) {
    try {
      let content = fs.readFileSync(fix.file, 'utf8')
      const originalContent = content

      content = content.replace(fix.from, fix.to)

      if (content !== originalContent) {
        fs.writeFileSync(fix.file, content)
        console.log(`✅ Corrigido: ${fix.file}`)
        fixedFiles++
      }
    } catch (error) {
      console.log(`❌ Erro ao corrigir ${fix.file}:`, error.message)
    }
  } else {
    console.log(`⚠️  Arquivo não encontrado: ${fix.file}`)
  }
})

console.log(`\n🎉 Correções aplicadas! ${fixedFiles} arquivos corrigidos.`)
console.log('\n📊 Executando lint final...')
