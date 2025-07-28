
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { Lucia } from "lucia";
import { db } from "@/db/drizzle";
import { sessions, users, userRoleEnum } from "@/db/schema";
import { cookies } from "next/headers";
import type { Session, User } from "lucia";
import { sql } from "drizzle-orm";


const adapter = new DrizzlePostgreSQLAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		// this sets cookies with super long expiration
		// since Next.js doesn't allow Lucia to extend cookie expiration when rendering pages
		expires: false,
		attributes: {
			// set to `true` when using HTTPS
			secure: process.env.NODE_ENV === "production"
		}
	},
    getUserAttributes: (attributes) => {
        return {
            email: attributes.email,
            role: attributes.role,
        }
    }
});

export const validateRequest = async (): Promise<{ user: User; session: Session } | { user: null; session: null }> => {
    // DEVELOPMENT ONLY: Bypassing auth and mocking the admin user
    const [mockUser] = await db
        .select()
        .from(users)
        .where(sql`${users.email} = 'admin@vinha.com'`);

    if (mockUser) {
        const mockSession: Session = {
            id: "mock_session_id",
            userId: mockUser.id,
            expiresAt: new Date(Date.now() + 3600 * 1000), // Expires in 1 hour
            fresh: false
        };
        const user: User = {
            id: mockUser.id,
            email: mockUser.email,
            role: mockUser.role,
        };

        return {
            user,
            session: mockSession
        };
    }
    
    // Original code is kept below for when we want to re-enable it.
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) {
        return {
            user: null,
            session: null
        };
    }

    const result = await lucia.validateSession(sessionId);
    // next.js throws when you attempt to set cookie when rendering page
    try {
        if (result.session && result.session.fresh) {
            const sessionCookie = lucia.createSessionCookie(result.session.id);
            cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        }
        if (!result.session) {
            const sessionCookie = lucia.createBlankSessionCookie();
            cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
        }
    } catch {}
    return result;
};


// IMPORTANT!
declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
        DatabaseUserAttributes: {
            email: string;
            role: typeof userRoleEnum.enumValues[number];
        }
	}
}
