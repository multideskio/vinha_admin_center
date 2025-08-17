/**
* @fileoverview Rota da API para gerenciar um gerente específico (visão do admin).
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, managerProfiles } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { validateRequest } from '@/lib/auth';
import { managerProfileSchema } from '@/lib/types';

const managerUpdateSchema = managerProfileSchema.extend({
    newPassword: z.string().optional().or(z.literal('')),
}).partial();
  

export async function GET(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = params;

    try {
        const result = await db.select({
            user: users,
            profile: managerProfiles,
        })
        .from(users)
        .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
        .where(and(eq(users.id, id), eq(users.role, 'manager'), isNull(users.deletedAt)))
        .limit(1);

        if (result.length === 0 || !result[0]) {
            return NextResponse.json({ error: "Gerente não encontrado." }, { status: 404 });
        }
        
        const { password, ...userWithoutPassword } = result[0].user;

        return NextResponse.json({ ...userWithoutPassword, ...result[0].profile});

    } catch (error: any) {
        console.error("Erro ao buscar gerente:", error);
        return NextResponse.json({ error: "Erro ao buscar gerente", details: error.message }, { status: 500 });
    }
}


export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    
    const { id } = params;
  
    try {
      const body = await request.json();
      const validatedData = managerUpdateSchema.parse(body);
  
      await db.transaction(async (tx) => {
        
        const userUpdateData: Partial<typeof users.$inferInsert> = {};
        if (validatedData.email) userUpdateData.email = validatedData.email;
        if (validatedData.phone) userUpdateData.phone = validatedData.phone;
        if (validatedData.titheDay !== undefined) userUpdateData.titheDay = validatedData.titheDay;
        
        if (validatedData.newPassword) {
            userUpdateData.password = await bcrypt.hash(validatedData.newPassword, 10);
        }

        if (Object.keys(userUpdateData).length > 0) {
            userUpdateData.updatedAt = new Date();
            await tx.update(users).set(userUpdateData).where(eq(users.id, id));
        }
  
        const profileUpdateData: Partial<typeof managerProfiles.$inferInsert> = {};
        if (validatedData.firstName) profileUpdateData.firstName = validatedData.firstName;
        if (validatedData.lastName) profileUpdateData.lastName = validatedData.lastName;
        if (validatedData.landline !== undefined) profileUpdateData.landline = validatedData.landline;
        if (validatedData.cep !== undefined) profileUpdateData.cep = validatedData.cep;
        if (validatedData.state !== undefined) profileUpdateData.state = validatedData.state;
        if (validatedData.city !== undefined) profileUpdateData.city = validatedData.city;
        if (validatedData.neighborhood !== undefined) profileUpdateData.neighborhood = validatedData.neighborhood;
        if (validatedData.address !== undefined) profileUpdateData.address = validatedData.address;
        
        if (Object.keys(profileUpdateData).length > 0) {
            await tx.update(managerProfiles).set(profileUpdateData).where(eq(managerProfiles.userId, id));
        }
      });
  
      return NextResponse.json({ success: true });
  
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao atualizar gerente:", error);
      return NextResponse.json({ error: "Erro ao atualizar gerente", details: error.message }, { status: 500 });
    }
  }

export async function DELETE(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = params;

    try {
        const [deletedUser] = await db
        .update(users)
        .set({
            deletedAt: new Date(),
            status: 'inactive'
        })
        .where(eq(users.id, id))
        .returning();
        
        if (!deletedUser) {
            return NextResponse.json({ error: "Gerente não encontrado." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Gerente excluído com sucesso." });

    } catch (error: any) {
        console.error("Erro ao excluir gerente:", error);
        return NextResponse.json({ error: "Erro ao excluir gerente", details: error.message }, { status: 500 });
    }
}