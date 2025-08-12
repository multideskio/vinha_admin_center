
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db/drizzle';
import { apiKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function authenticateApiKey(request: Request): Promise<NextResponse | null> {
    const headersList = headers();
    const authorizationHeader = headersList.get('Authorization');

    if (!authorizationHeader) {
        return NextResponse.json({ error: 'Authorization header is missing' }, { status: 401 });
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
        return NextResponse.json({ error: 'Bearer token is missing' }, { status: 401 });
    }

    try {
        const [apiKey] = await db.select()
            .from(apiKeys)
            .where(and(eq(apiKeys.key, token), eq(apiKeys.status, 'active')))
            .limit(1);

        if (!apiKey) {
            return NextResponse.json({ error: 'Invalid or inactive API Key' }, { status: 403 });
        }

        await db.update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, apiKey.id));

        return null;

    } catch (error) {
        console.error('API Key authentication error:', error);
        return NextResponse.json({ error: 'Internal Server Error during authentication' }, { status: 500 });
    }
}
