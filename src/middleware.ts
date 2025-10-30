import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
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
    const res = NextResponse.next()
    // Security headers
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'SAMEORIGIN')
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.headers.set('X-XSS-Protection', '1; mode=block')
    return res
  }

  // Check maintenance mode via API call
  try {
    const maintenanceCheck = await fetch(
      new URL('/api/v1/maintenance-check', request.url),
      { 
        headers: { 'x-middleware-check': 'true' },
        signal: AbortSignal.timeout(1000)
      }
    )

    if (maintenanceCheck.ok) {
      const { maintenanceMode } = await maintenanceCheck.json()
      if (maintenanceMode) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
  } catch (error) {
    // Silently fail - allow request to continue if maintenance check fails
  }

  const res = NextResponse.next()
  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|maintenance).*)'],
}
