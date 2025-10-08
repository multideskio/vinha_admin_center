import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { UserRole } from './types';

// Chave secreta para assinar os JWTs
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
);

const JWT_COOKIE_NAME = 'auth_token';
const JWT_EXPIRES_IN = '30d'; // 30 dias

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Cria um token JWT para o usuário
 */
export async function createJWT(user: { id: string; email: string; role: UserRole }): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verifica e decodifica um token JWT
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Validate that the payload has the required properties
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.role === 'string' &&
      typeof payload.iat === 'number' &&
      typeof payload.exp === 'number'
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
        iat: payload.iat,
        exp: payload.exp
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao verificar JWT:', error);
    return null;
  }
}

/**
 * Define o cookie JWT no navegador
 */
export async function setJWTCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 dias em segundos
  });
}

/**
 * Remove o cookie JWT
 */
export async function clearJWTCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(JWT_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Obtém o token JWT do cookie
 */
export async function getJWTFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(JWT_COOKIE_NAME);
  return token?.value || null;
}

/**
 * Valida a requisição usando JWT
 */
export async function validateJWTRequest(): Promise<{
  user: { id: string; email: string; role: UserRole } | null;
  token: string | null;
}> {
  const token = await getJWTFromCookie();
  
  if (!token) {
    return { user: null, token: null };
  }

  const payload = await verifyJWT(token);
  
  if (!payload) {
    // Token inválido, limpar cookie
    await clearJWTCookie();
    return { user: null, token: null };
  }

  // Verificar se o usuário ainda existe no banco de dados
  try {
    const [dbUser] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!dbUser) {
      // Usuário não existe mais, limpar cookie
      await clearJWTCookie();
      return { user: null, token: null };
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role as UserRole,
      },
      token,
    };
  } catch (error) {
    console.error('Erro ao validar usuário no banco:', error);
    await clearJWTCookie();
    return { user: null, token: null };
  }
}

/**
 * Função de compatibilidade com o sistema atual
 * Substitui a validateRequest do Lucia
 */
export async function validateRequest(): Promise<{
  user: { id: string; email: string; role: UserRole; companyId: string } | null;
  session: { id: string } | null;
}> {
  const token = await getJWTFromCookie();
  
  if (!token) {
    return { user: null, session: null };
  }

  const payload = await verifyJWT(token);
  
  if (!payload) {
    await clearJWTCookie();
    return { user: null, session: null };
  }

  try {
    const dbUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        companyId: users.companyId,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    const dbUser = dbUsers[0];

    if (!dbUser) {
      await clearJWTCookie();
      return { user: null, session: null };
    }

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role as UserRole,
        companyId: dbUser.companyId,
      },
      session: { id: token },
    };
  } catch (error) {
    console.error('Erro ao validar usuário no banco:', error);
    return { user: null, session: null };
  }
}