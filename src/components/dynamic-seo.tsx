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

  // Função para atualizar SEO de forma mais segura
  const updateSEO = useCallback(
    (companyName?: string | null, logoUrl?: string | null) => {
      // Verificar se estamos no browser
      if (typeof document === 'undefined' || typeof window === 'undefined') return

      try {
        // Atualizar title dinamicamente
        if (companyName) {
          document.title = companyName
        } else {
          document.title = fallbackTitle
        }

        // Atualizar meta description de forma segura
        updateMetaTagSafe('name', 'description', companyName 
          ? `Sistema de administração para ${companyName}` 
          : fallbackDescription)

        // Atualizar Open Graph tags
        updateMetaTagSafe('property', 'og:title', companyName || fallbackTitle)
        updateMetaTagSafe('property', 'og:description', companyName 
          ? `Sistema de administração para ${companyName}` 
          : fallbackDescription)
        updateMetaTagSafe('property', 'og:site_name', companyName || fallbackTitle)

        // Atualizar Twitter Card tags
        updateMetaTagSafe('name', 'twitter:title', companyName || fallbackTitle)
        updateMetaTagSafe('name', 'twitter:description', companyName 
          ? `Sistema de administração para ${companyName}` 
          : fallbackDescription)

        // Atualizar favicon de forma mais segura
        if (logoUrl) {
          updateFaviconSafe(logoUrl)
          updateMetaTagSafe('property', 'og:image', logoUrl)
          updateMetaTagSafe('name', 'twitter:image', logoUrl)
        }
      } catch (error) {
        console.warn('Erro ao atualizar SEO:', error)
      }
    },
    [fallbackTitle, fallbackDescription],
  )

  useEffect(() => {
    // Aguardar o componente estar montado
    const timer = setTimeout(() => {
      updateSEO(settings?.name, settings?.logoUrl)
    }, 100)

    return () => clearTimeout(timer)
  }, [settings?.name, settings?.logoUrl, updateSEO])

  useEffect(() => {
    // Escutar evento personalizado de atualização das configurações
    const handleSettingsUpdate = async (event: Event) => {
      try {
        const customEvent = event as CustomEvent<{ name: string; logoUrl: string }>
        const { name, logoUrl } = customEvent.detail
        
        // Aguardar um pouco antes de atualizar
        setTimeout(() => {
          updateSEO(name, logoUrl)
        }, 200)
        
        // Também recarregar as configurações do hook
        await refetch()
      } catch (error) {
        console.warn('Erro ao processar atualização de configurações:', error)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('company-settings-updated', handleSettingsUpdate)

      return () => {
        window.removeEventListener('company-settings-updated', handleSettingsUpdate)
      }
    }

    // Retorno vazio para satisfazer TypeScript quando window não está disponível
    return () => {}
  }, [refetch, updateSEO])

  return null // Este componente não renderiza nada visualmente
}

/**
 * Atualiza ou cria uma meta tag de forma mais segura
 */
function updateMetaTagSafe(attribute: 'name' | 'property', value: string, content: string) {
  // Verificar se estamos no browser
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  try {
    // Aguardar o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => updateMetaTagSafe(attribute, value, content))
      return
    }

    let metaTag = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement
    if (!metaTag) {
      metaTag = document.createElement('meta')
      metaTag.setAttribute(attribute, value)
      if (document.head) {
        document.head.appendChild(metaTag)
      }
    }
    if (metaTag) {
      metaTag.content = content
    }
  } catch (error) {
    console.debug(`Aviso: não foi possível atualizar meta tag ${attribute}="${value}"`)
  }
}

/**
 * Atualiza o favicon de forma mais segura, sem removeChild
 */
function updateFaviconSafe(logoUrl: string) {
  // Verificar se estamos no browser
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  try {
    // Aguardar o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => updateFaviconSafe(logoUrl))
      return
    }

    // Em vez de remover, apenas atualizar os existentes ou criar novos
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
    if (!favicon) {
      favicon = document.createElement('link')
      favicon.rel = 'icon'
      favicon.type = 'image/x-icon'
      if (document.head) {
        document.head.appendChild(favicon)
      }
    }
    if (favicon) {
      favicon.href = logoUrl
    }

    // Atualizar shortcut icon
    let shortcutIcon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement
    if (!shortcutIcon) {
      shortcutIcon = document.createElement('link')
      shortcutIcon.rel = 'shortcut icon'
      if (document.head) {
        document.head.appendChild(shortcutIcon)
      }
    }
    if (shortcutIcon) {
      shortcutIcon.href = logoUrl
    }

    // Atualizar apple-touch-icon
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement
    if (!appleIcon) {
      appleIcon = document.createElement('link')
      appleIcon.rel = 'apple-touch-icon'
      if (document.head) {
        document.head.appendChild(appleIcon)
      }
    }
    if (appleIcon) {
      appleIcon.href = logoUrl
    }
  } catch (error) {
    console.debug('Aviso: não foi possível atualizar favicon')
  }
}
