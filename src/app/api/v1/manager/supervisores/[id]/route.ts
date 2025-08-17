/**
* @fileoverview API para gerenciamento de supervisores específicos (visão do gerente).
* @version 1.1
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, supervisorProfiles } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { validateRequest } from '@/lib/auth';
import { supervisorProfileSchema } from '@/lib/types';
import { ApiError } from '@/lib/errors';
import type { UserRole } from '@/lib/types';

const supervisorUpdateSchema = supervisorProfileSchema.extend({
    newPassword: z.string().optional().or(z.literal('')),
}).partial();

async function verifySupervisor(supervisorId: string, managerId: string): Promise<boolean> {
    const [supervisor] = await db.select().from(supervisorProfiles).where(eq(supervisorProfiles.userId, supervisorId));
    if (!supervisor || supervisor.managerId !== managerId) return false;
    return true;
}

export async function GET(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = params;

    try {
        const isAuthorized = await verifySupervisor(id, sessionUser.id);
        if (!isAuthorized) {
            throw new ApiError(404, "Supervisor não encontrado ou não pertence a este gerente.");
        }

        const result = await db.select({
            user: users,
            profile: supervisorProfiles,
        })
        .from(users)
        .leftJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
        .where(and(eq(users.id, id), eq(users.role, 'supervisor'), isNull(users.deletedAt)))
        .limit(1);

        if (result.length === 0 || !result[0]) {
            throw new ApiError(404, "Supervisor não encontrado.");
        }

        const { user, profile } = result[0];
        const { password, ...userWithoutPassword } = user;

        return NextResponse.json({ 
            ...userWithoutPassword,
            ...profile,
        });

    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Erro ao buscar supervisor:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}


export async function PUT(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    
    const { id } = params;
  
    try {
      const isAuthorized = await verifySupervisor(id, sessionUser.id);
      if (!isAuthorized) {
          throw new ApiError(403, "Não autorizado a modificar este supervisor.");
      }

      const body = await request.json();
      const validatedData = supervisorUpdateSchema.parse(body);
  
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
  
        const profileUpdateData: Partial<typeof supervisorProfiles.$inferInsert> = {};
        if (validatedData.firstName) profileUpdateData.firstName = validatedData.firstName;
        if (validatedData.lastName) profileUpdateData.lastName = validatedData.lastName;
        if (validatedData.landline !== undefined) profileUpdateData.landline = validatedData.landline;
        if (validatedData.cep !== undefined) profileUpdateData.cep = validatedData.cep;
        if (validatedData.state !== undefined) profileUpdateData.state = validatedData.state;
        if (validatedData.city !== undefined) profileUpdateData.city = validatedData.city;
        if (validatedData.neighborhood !== undefined) profileUpdateData.neighborhood = validatedData.neighborhood;
        if (validatedData.address !== undefined) profileUpdateData.address = validatedData.address;
        if (validatedData.number !== undefined) profileUpdateData.number = validatedData.number;
        if (validatedData.complement !== undefined) profileUpdateData.complement = validatedData.complement;
        if (validatedData.regionId) profileUpdateData.regionId = validatedData.regionId;
        
        if (Object.keys(profileUpdateData).length > 0) {
            await tx.update(supervisorProfiles).set(profileUpdateData).where(eq(supervisorProfiles.userId, id));
        }
      });
  
      return NextResponse.json({ success: true });
  
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
        }
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Erro ao atualizar supervisor:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || (sessionUser.role as UserRole) !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = params;

    try {
        const isAuthorized = await verifySupervisor(id, sessionUser.id);
        if (!isAuthorized) {
            throw new ApiError(403, "Não autorizado a excluir este supervisor.");
        }
        await db
        .update(users)
        .set({
            deletedAt: new Date(),
            status: 'inactive'
        })
        .where(eq(users.id, id));

        return NextResponse.json({ success: true, message: "Supervisor excluído com sucesso." });

    } catch (error: unknown) {
        if (error instanceof ApiError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("Erro ao excluir supervisor:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
