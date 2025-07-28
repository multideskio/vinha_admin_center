
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateRequest } from '@/lib/auth'

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const { user } = await validateRequest();
  const { pathname } = request.nextUrl;

  const roleToPathMap: { [key: string]: string } = {
    admin: '/admin',
    gerente: '/gerente',
    supervisor: '/supervisor',
    pastor: '/pastor',
    church_account: '/igreja'
  };

  // Se o usuário não estiver logado e tentar acessar uma rota protegida
  if (!user && !pathname.startsWith('/auth')) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário estiver logado
  if (user) {
    const userBasePath = roleToPathMap[user.role];
    
    // Se o usuário logado tentar acessar as páginas de autenticação, redirecione para o dashboard dele
    if (pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL(userBasePath, request.url));
    }

    // Se o usuário tentar acessar uma rota de outro perfil, redirecione para o dashboard dele
    if (!pathname.startsWith(userBasePath) && !pathname.startsWith('/api')) {
       return NextResponse.redirect(new URL(userBasePath, request.url));
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
