
import { NextResponse, type NextRequest } from 'next/server';
import { authenticateApiKey } from '@/lib/api-auth';

export async function middleware(request: NextRequest) {
  // Rota de API externa - requer chave de API
  if (request.nextUrl.pathname.startsWith('/api/v1/external')) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) {
      return authResponse; // Retorna 401 ou 403 se a autenticação falhar
    }
  }

  // Para todas as outras rotas, continue normalmente
  return NextResponse.next();
}

// Defina quais rotas o middleware deve interceptar
export const config = {
  matcher: '/api/:path*',
};
