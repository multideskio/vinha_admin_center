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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:9002'),
  title: 'Vinha Admin Center',
  description: 'Sistema de Administração para Gestão de Igrejas',
  openGraph: {
    title: 'Vinha Admin Center',
    description: 'Sistema de Administração para Gestão de Igrejas',
    siteName: 'Vinha Admin Center',
    images: [
      {
        url: '/img/background.png',
        width: 1200,
        height: 630,
        alt: 'Vinha Admin Center',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vinha Admin Center',
    description: 'Sistema de Administração para Gestão de Igrejas',
    images: ['/img/background.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <EnvErrorBoundary>
      <html lang="pt-BR" className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('vinha-theme');if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`,
            }}
          />
        </head>
        <body>
          <DynamicSEO />
          {children}
          <Toaster />
        </body>
      </html>
    </EnvErrorBoundary>
  )
}
