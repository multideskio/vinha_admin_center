
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateRequest } from '@/lib/auth'

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const { user } = await validateRequest();
  const { pathname } = request.nextUrl;

  const authenticatedRoutes = ['/admin', '/gerente', '/supervisor', '/pastor', '/igreja'];

  // Se o usuário não estiver logado e tentando acessar uma rota protegida
  if (!user && authenticatedRoutes.some(path => pathname.startsWith(path))) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário estiver logado e tentando acessar a página de login
  if (user && pathname.startsWith('/auth')) {
    let path = '/';
     const roleToPathMap: { [key: string]: string } = {
        admin: '/admin',
        gerente: '/gerente',
        supervisor: '/supervisor',
        pastor: '/pastor',
        church_account: '/igreja'
    };
    path = roleToPathMap[user.role] || '/';
    return NextResponse.redirect(new URL(path, request.url));
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - / (a rota raiz é pública e redireciona)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
