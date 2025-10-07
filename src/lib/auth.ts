/**
 * @fileoverview Configuração do Lucia Auth para gerenciamento de sessão.
 * @version 1.3
 * @date 2024-08-08
 * @author PH
 */
import { DrizzlePostgreSQLAdapter } from '@lucia-auth/adapter-drizzle'
import { Lucia, TimeSpan } from 'lucia'
import { db } from '@/db/drizzle'
import { sessions, users } from '@/db/schema'
import { cookies } from 'next/headers'
import type { Session, User } from 'lucia'
import { cache } from 'react'
import type { UserRole } from './types'

const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    },
  },
  sessionExpiresIn: new TimeSpan(30, 'd'), // 30 days
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      role: attributes.role,
    }
  },
})

export const validateRequest = cache(
  async (): Promise<{ user: (User & { role: UserRole }) | null; session: Session | null }> => {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null
    if (!sessionId) {
      return {
        user: null,
        session: null,
      }
    }

    const result = await lucia.validateSession(sessionId)
    // next.js throws when you attempt to set cookie when rendering page
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id)
        ;(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie()
        ;(await cookies()).set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      }
    } catch {
      // Ignore session validation errors
    }
    return result as { user: (User & { role: UserRole }) | null; session: Session | null }
  },
)

// IMPORTANT!
declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      email: string
      role: UserRole
    }
  }
}
