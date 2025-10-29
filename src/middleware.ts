import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
    return NextResponse.next()
  }

  // Check maintenance mode via API call
  try {
    const maintenanceCheck = await fetch(
      new URL('/api/v1/maintenance-check', request.url),
      { 
        headers: { 'x-middleware-check': 'true' },
        signal: AbortSignal.timeout(1000) // 1s timeout
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
    // This prevents blocking the entire app if DB is down
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|maintenance).*)'],
}
