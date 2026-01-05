/**
 * @fileoverview Componente para gerenciar dinamicamente title, favicon e SEO
 * @date 2026-01-05
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useCompanySettings } from '@/hooks/use-company-settings'

interface DynamicSEOProps {
  fallbackTitle?: string
  fallbackDescription?: string
}

export function DynamicSEO({
  fallbackTitle = 'Vinha Admin Center',
  fallbackDescription = 'Sistema de Administração para Gestão de Igrejas',
}: DynamicSEOProps) {
  const { settings, refetch } = useCompanySettings()

  // Função para atualizar SEO
  const updateSEO = useCallback(
    (companyName?: string | null, logoUrl?: string | null) => {
      // Verificar se estamos no browser
      if (typeof document === 'undefined') return

      try {
        // Atualizar title dinamicamente
        if (companyName) {
          document.title = companyName
        } else {
          document.title = fallbackTitle
        }

        // Atualizar meta description
        let metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement
        if (!metaDescription) {
          metaDescription = document.createElement('meta')
          metaDescription.name = 'description'
          document.head.appendChild(metaDescription)
        }

        const description = companyName
          ? `Sistema de administração para ${companyName}`
          : fallbackDescription
        metaDescription.content = description

        // Atualizar Open Graph tags
        updateMetaTag('property', 'og:title', companyName || fallbackTitle)
        updateMetaTag('property', 'og:description', description)
        updateMetaTag('property', 'og:site_name', companyName || fallbackTitle)

        // Atualizar Twitter Card tags
        updateMetaTag('name', 'twitter:title', companyName || fallbackTitle)
        updateMetaTag('name', 'twitter:description', description)

        // Atualizar favicon e ícones
        if (logoUrl) {
          updateFavicon(logoUrl)
          updateMetaTag('property', 'og:image', logoUrl)
          updateMetaTag('name', 'twitter:image', logoUrl)
        }
      } catch (error) {
        console.warn('Erro ao atualizar SEO:', error)
      }
    },
    [fallbackTitle, fallbackDescription],
  )

  useEffect(() => {
    updateSEO(settings?.name, settings?.logoUrl)
  }, [settings?.name, settings?.logoUrl, updateSEO])

  useEffect(() => {
    // Escutar evento personalizado de atualização das configurações
    const handleSettingsUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent<{ name: string; logoUrl: string }>
      const { name, logoUrl } = customEvent.detail
      updateSEO(name, logoUrl)
      // Também recarregar as configurações do hook
      await refetch()
    }

    window.addEventListener('company-settings-updated', handleSettingsUpdate)

    return () => {
      window.removeEventListener('company-settings-updated', handleSettingsUpdate)
    }
  }, [refetch, updateSEO])

  return null // Este componente não renderiza nada visualmente
}

/**
 * Atualiza ou cria uma meta tag
 */
function updateMetaTag(attribute: 'name' | 'property', value: string, content: string) {
  // Verificar se estamos no browser
  if (typeof document === 'undefined') return

  try {
    let metaTag = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute(attribute, value)
      document.head.appendChild(metaTag)
    }
    metaTag.content = content
  } catch (error) {
    console.warn(`Erro ao atualizar meta tag ${attribute}="${value}":`, error)
  }
}

/**
 * Atualiza o favicon e ícones relacionados
 */
function updateFavicon(logoUrl: string) {
  // Verificar se estamos no browser
  if (typeof document === 'undefined') return

  // Remover favicons existentes com verificação de segurança
  const existingIcons = document.querySelectorAll('link[rel*="icon"]')
  existingIcons.forEach((icon) => {
    try {
      if (icon.parentNode) {
        icon.parentNode.removeChild(icon)
      }
    } catch (error) {
      // Fallback para browsers que suportam remove()
      try {
        icon.remove()
      } catch (removeError) {
        console.warn('Erro ao remover ícone existente:', removeError)
      }
    }
  })

  // Adicionar novo favicon
  const favicon = document.createElement('link')
  favicon.rel = 'icon'
  favicon.type = 'image/x-icon'
  favicon.href = logoUrl
  document.head.appendChild(favicon)

  // Adicionar shortcut icon
  const shortcutIcon = document.createElement('link')
  shortcutIcon.rel = 'shortcut icon'
  shortcutIcon.href = logoUrl
  document.head.appendChild(shortcutIcon)

  // Adicionar apple-touch-icon para dispositivos móveis
  const appleIcon = document.createElement('link')
  appleIcon.rel = 'apple-touch-icon'
  appleIcon.href = logoUrl
  document.head.appendChild(appleIcon)

  // Adicionar ícones para diferentes tamanhos
  const sizes = [
    '57x57',
    '60x60',
    '72x72',
    '76x76',
    '114x114',
    '120x120',
    '144x144',
    '152x152',
    '180x180',
  ]
  sizes.forEach((size) => {
    const sizedIcon = document.createElement('link')
    sizedIcon.rel = 'apple-touch-icon'
    sizedIcon.sizes = size
    sizedIcon.href = logoUrl
    document.head.appendChild(sizedIcon)
  })
}
