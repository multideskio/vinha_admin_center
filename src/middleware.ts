import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

const REFRESH_THRESHOLD_SECONDS = 12 * 60 * 60 // Renovar quando faltar menos de 12h

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
  const isVercel = !!process.env.VERCEL
  const vercelScriptSrc = isVercel ? ' https://vercel.live' : ''
  const vercelConnectSrc = isVercel ? ' https://vercel.live https://*.vercel.live' : ''
  const vercelFrameSrc = isVercel ? ' https://vercel.live' : ''
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'unsafe-eval'${vercelScriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.cloudfront.net https://*.s3.amazonaws.com https://placehold.co",
      "font-src 'self'",
      `connect-src 'self' https://viacep.com.br https://brasilapi.com.br https://api.cieloecommerce.cielo.com.br https://apiquery.cieloecommerce.cielo.com.br https://transactionsandbox.cieloecommerce.cielo.com.br https://apisandbox.cieloecommerce.cielo.com.br${vercelConnectSrc}`,
      `frame-src 'self'${vercelFrameSrc}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  )
  return response
}

export async function middleware(request: NextRequest) {
  // Guard: JWT_SECRET deve estar configurado
  if (!process.env.JWT_SECRET) {
    console.error('[MIDDLEWARE] JWT_SECRET não configurado')
    // Permitir apenas rotas públicas
    if (
      request.nextUrl.pathname.startsWith('/api/v1/') &&
      !request.nextUrl.pathname.startsWith('/api/v1/webhooks/')
    ) {
      return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 })
    }
  }

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
    request.nextUrl.pathname.startsWith('/contribuir') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname === '/maintenance'
  ) {
    // ✅ Verificação de JWT no middleware para rotas /api/v1/* (defesa em profundidade)
    // Rotas excluídas: webhooks, auth, maintenance-check, payment-link, payment-methods
    const pathname = request.nextUrl.pathname
    if (
      pathname.startsWith('/api/v1/') &&
      !pathname.startsWith('/api/v1/webhooks/') &&
      !pathname.startsWith('/api/v1/auth/') &&
      !pathname.startsWith('/api/v1/maintenance-check') &&
      !pathname.startsWith('/api/v1/payment-link/') &&
      pathname !== '/api/v1/payment-methods' &&
      !pathname.startsWith('/api/v1/payment-methods/') &&
      !pathname.startsWith('/api/auth/')
    ) {
      const token = request.cookies.get('auth_token')?.value

      if (!token) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }

      // Verificação leve do JWT (sem consultar banco — handlers fazem isso)
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || '')
        await jwtVerify(token, secret)
      } catch {
        return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
      }
    }

    // ✅ Sliding window token refresh para rotas de página autenticadas
    // Renova o JWT automaticamente quando próximo de expirar (sem consultar banco — leve)
    const pageToken = request.cookies.get('auth_token')?.value
    if (pageToken && !pathname.startsWith('/api/')) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || '')
        const { payload } = await jwtVerify(pageToken, secret)
        const now = Math.floor(Date.now() / 1000)
        const exp = payload.exp as number
        const timeUntilExpiry = exp - now

        if (timeUntilExpiry > 0 && timeUntilExpiry < REFRESH_THRESHOLD_SECONDS) {
          // Token próximo de expirar — emitir novo token com mesmos dados
          const newToken = await new SignJWT({
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
          })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1d')
            .sign(secret)

          const response = addSecurityHeaders(NextResponse.next())
          response.cookies.set('auth_token', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60, // 7 dias
          })
          return response
        }
      } catch {
        // Token inválido — não renovar, deixar o handler lidar
      }
    }

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
