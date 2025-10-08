import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip maintenance check for admin routes, API, and static files
  if (
    request.nextUrl.pathname.startsWith('/admin') ||
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
      { headers: { 'x-middleware-check': 'true' } }
    )

    if (maintenanceCheck.ok) {
      const { maintenanceMode } = await maintenanceCheck.json()
      if (maintenanceMode) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
  } catch (error) {
    console.error('Middleware error:', error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|maintenance).*)'],
}
