/**
* @fileoverview Rota da API para gerenciar configurações de notificação de um usuário.
* @version 1.0
* @date 2024-08-08
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { userNotificationSettings, notificationTypeEnum } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { validateRequest } from '@/lib/auth';
import { NOTIFICATION_TYPES } from '@/lib/types';


const settingsSchema = z.record(
    z.enum(NOTIFICATION_TYPES),
    z.object({
        email: z.boolean(),
        whatsapp: z.boolean(),
    })
);


export async function GET(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id: userId } = params;

    try {
        const settings = await db.select()
            .from(userNotificationSettings)
            .where(eq(userNotificationSettings.userId, userId));
        
        const formattedSettings = settings.reduce((acc, setting) => {
            acc[setting.notificationType] = {
                email: setting.email,
                whatsapp: setting.whatsapp
            };
            return acc;
        }, {} as z.infer<typeof settingsSchema>);

        return NextResponse.json(formattedSettings);

    } catch (error: any) {
        console.error("Erro ao buscar configurações de notificação:", error);
        return NextResponse.json({ error: "Erro interno do servidor", details: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    
    const { id: userId } = params;

    try {
        const body = await request.json();
        const validatedData = settingsSchema.parse(body);

        await db.transaction(async (tx) => {
            for (const [type, channels] of Object.entries(validatedData)) {
                const notificationType = type as (typeof NOTIFICATION_TYPES)[number];
                await tx.insert(userNotificationSettings)
                    .values({
                        userId: userId,
                        notificationType: notificationType,
                        email: channels.email,
                        whatsapp: channels.whatsapp
                    })
                    .onConflictDoUpdate({
                        target: [userNotificationSettings.userId, userNotificationSettings.notificationType],
                        set: {
                            email: channels.email,
                            whatsapp: channels.whatsapp
                        }
                    });
            }
        });

        return NextResponse.json({ success: true, message: 'Configurações salvas.' });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        console.error("Erro ao salvar configurações de notificação:", error);
        return NextResponse.json({ error: "Erro interno do servidor", details: error.message }, { status: 500 });
    }
}

