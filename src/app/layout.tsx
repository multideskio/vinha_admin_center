import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { DynamicSEO } from '@/components/dynamic-seo'
import { EnvErrorBoundary } from '@/components/env-error-boundary'

// Validar variáveis de ambiente no startup
// Isso garante que o app não inicie com configurações inválidas
import '@/lib/env'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Vinha Admin Center',
  description: 'Sistema de Administração para Gestão de Igrejas',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <EnvErrorBoundary>
      <html lang="pt-BR" className={`${inter.variable} font-sans`}>
        <body>
          <DynamicSEO />
          {children}
          <Toaster />
        </body>
      </html>
    </EnvErrorBoundary>
  )
}
