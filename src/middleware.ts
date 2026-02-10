import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Adiciona headers de segurança a uma resposta do middleware.
 * Centralizado para evitar duplicação e garantir consistência.
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.cloudfront.net https://*.s3.amazonaws.com https://placehold.co",
      "font-src 'self'",
      "connect-src 'self' https://viacep.com.br https://brasilapi.com.br https://api.cieloecommerce.cielo.com.br https://apiquery.cieloecommerce.cielo.com.br https://transactionsandbox.cieloecommerce.cielo.com.br https://apisandbox.cieloecommerce.cielo.com.br",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  )
  return response
}

export async function middleware(request: NextRequest) {
  // HTTPS enforcement em produção
  if (process.env.NODE_ENV === 'production' && !request.nextUrl.hostname.includes('localhost')) {
    const proto = request.headers.get('x-forwarded-proto')
    if (proto && proto !== 'https') {
      const url = new URL(request.url)
      url.protocol = 'https:'
      return NextResponse.redirect(url, 301)
    }
  }

  // Skip maintenance check for admin, manager, pastor, supervisor routes, API, and static files
  if (
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/manager') ||
    request.nextUrl.pathname.startsWith('/pastor') ||
    request.nextUrl.pathname.startsWith('/supervisor') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname === '/maintenance'
  ) {
    return addSecurityHeaders(NextResponse.next())
  }

  // Check maintenance mode via API call
  // ✅ CORRIGIDO: Usar AbortController em vez de AbortSignal.timeout (compatível com Edge Runtime)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1000)

  try {
    const maintenanceCheck = await fetch(new URL('/api/v1/maintenance-check', request.url), {
      headers: { 'x-middleware-check': 'true' },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (maintenanceCheck.ok) {
      const { maintenanceMode } = await maintenanceCheck.json()
      if (maintenanceMode) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(
      '[MIDDLEWARE_MAINTENANCE_CHECK_FAILED]',
      error instanceof Error ? error.message : 'Erro desconhecido',
    )
  }

  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|maintenance).*)'],
}
