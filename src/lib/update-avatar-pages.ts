/**
 * @fileoverview Script para atualizar páginas com upload de avatar
 */

// Lista de páginas que precisam ser atualizadas
export const AVATAR_PAGES = [
  // Supervisores
  'src/app/admin/supervisores/[id]/page.tsx',
  'src/app/manager/supervisores/[id]/page.tsx',

  // Pastores
  'src/app/admin/pastores/[id]/page.tsx',
  'src/app/manager/pastores/[id]/page.tsx',
  'src/app/supervisor/pastores/[id]/page.tsx',

  // Igrejas
  'src/app/admin/igrejas/[id]/page.tsx',
  'src/app/manager/igrejas/[id]/page.tsx',
  'src/app/supervisor/igrejas/[id]/page.tsx',

  // Perfis próprios
  'src/app/supervisor/perfil/page.tsx',
  'src/app/pastor/perfil/page.tsx',
  'src/app/igreja/perfil/page.tsx',
]

// Função para substituir handlePhotoChange
export const getUpdatedPhotoHandler = (entityType: string, idParam: string = 'id') => `
  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'avatars')
        formData.append('filename', \`${entityType}-\${${idParam}}-\${file.name}\`)

        const response = await fetch('/api/v1/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('Falha no upload da imagem')
        }

        const result = await response.json()
        
        // Atualizar avatar no banco
        const updateResponse = await fetch(\`/api/v1/admin/${entityType}s/\${${idParam}}\`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: result.url }),
        })

        if (!updateResponse.ok) {
          throw new Error('Falha ao atualizar avatar')
        }

        setPreviewImage(result.url)
        set${entityType.charAt(0).toUpperCase() + entityType.slice(1)}(prev => prev ? { ...prev, avatarUrl: result.url } : null)
        
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

// Padrão para encontrar handlePhotoChange antigo
export const OLD_PHOTO_HANDLER_PATTERN =
  /const handlePhotoChange = \(event: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?\n {2}\}/

// Função para usar AvatarUpload component
export const getAvatarUploadUsage = (entityVar: string, idVar: string, entityType: string) => `
import { AvatarUpload } from '@/components/ui/avatar-upload'

// Substituir o Avatar existente por:
<AvatarUpload
  currentUrl={${entityVar}?.avatarUrl}
  fallback={\`\${${entityVar}?.firstName?.[0] || ''}\${${entityVar}?.lastName?.[0] || ''}\`}
  userId={${idVar} as string}
  folder="avatars"
  size="md"
  onUploadSuccess={async (url) => {
    // Atualizar no banco
    const response = await fetch(\`/api/v1/admin/${entityType}s/\${${idVar}}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: url }),
    })
    
    if (response.ok) {
      set${entityType.charAt(0).toUpperCase() + entityType.slice(1)}(prev => 
        prev ? { ...prev, avatarUrl: url } : null
      )
    }
  }}
/>`
