/**
 * Script para atualizar todas as páginas com upload de avatar
 */

const fs = require('fs')
const path = require('path')

// Mapeamento de páginas e suas configurações
const PAGES_CONFIG = [
  // Pastores
  {
    file: 'src/app/admin/pastores/[id]/page.tsx',
    entityType: 'pastor',
    stateVar: 'pastor',
    setStateVar: 'setPastor',
    apiPath: 'pastores'
  },
  {
    file: 'src/app/manager/pastores/[id]/page.tsx',
    entityType: 'pastor',
    stateVar: 'pastor',
    setStateVar: 'setPastor',
    apiPath: 'pastores'
  },
  {
    file: 'src/app/supervisor/pastores/[id]/page.tsx',
    entityType: 'pastor',
    stateVar: 'pastor',
    setStateVar: 'setPastor',
    apiPath: 'pastores'
  },
  
  // Igrejas
  {
    file: 'src/app/admin/igrejas/[id]/page.tsx',
    entityType: 'igreja',
    stateVar: 'church',
    setStateVar: 'setChurch',
    apiPath: 'igrejas'
  },
  {
    file: 'src/app/manager/igrejas/[id]/page.tsx',
    entityType: 'igreja',
    stateVar: 'church',
    setStateVar: 'setChurch',
    apiPath: 'igrejas'
  },
  {
    file: 'src/app/supervisor/igrejas/[id]/page.tsx',
    entityType: 'igreja',
    stateVar: 'church',
    setStateVar: 'setChurch',
    apiPath: 'igrejas'
  }
]

// Função para gerar o novo handlePhotoChange
function generatePhotoHandler(config) {
  return `  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'avatars')
        formData.append('filename', \`${config.entityType}-\${id}-\${file.name}\`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Falha no upload da imagem')
        }

        const result = await response.json()
        
        // Atualizar avatar no banco
        const updateResponse = await fetch(\`/api/v1/${config.apiPath}/\${id}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) {
          throw new Error('Falha ao atualizar avatar')
        }

        setPreviewImage(result.url)
        ${config.setStateVar}(prev => prev ? { ...prev, avatarUrl: result.url } : null)
        
        toast({
          title: 'Sucesso',
          description: 'Avatar atualizado com sucesso!',
          variant: 'success',
        })
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao fazer upload da imagem.',
          variant: 'destructive',
        })
      }
    }
  }`
}

// Padrão para encontrar handlePhotoChange antigo
const OLD_HANDLER_PATTERN = /const handlePhotoChange = \(event: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?\n  \}/

// Processar cada arquivo
PAGES_CONFIG.forEach(config => {
  const filePath = path.join(__dirname, '..', config.file)
  
  if (fs.existsSync(filePath)) {
    console.log(`Atualizando ${config.file}...`)
    
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Substituir handlePhotoChange se existir
    if (OLD_HANDLER_PATTERN.test(content)) {
      content = content.replace(OLD_HANDLER_PATTERN, generatePhotoHandler(config))
      
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ ${config.file} atualizado`)
    } else {
      console.log(`⚠️  ${config.file} não possui handlePhotoChange para atualizar`)
    }
  } else {
    console.log(`❌ ${config.file} não encontrado`)
  }
})

console.log('\n🎉 Script concluído!')
console.log('\n📝 Próximos passos:')
console.log('1. Execute: npm run db:migrate')
console.log('2. Teste os uploads nas páginas atualizadas')
console.log('3. Configure as credenciais S3 em /admin/configuracoes/s3')