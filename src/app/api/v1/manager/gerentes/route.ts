/**
* @fileoverview Rota da API para gerenciar gerentes (visão do gerente).
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, managerProfiles } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { authenticateApiKey } from '@/lib/api-auth';
import { managerProfileSchema } from '@/lib/types';
import { validateRequest } from '@/lib/auth';
import type { UserRole } from '@/lib/types';


const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123456";

export async function GET(request: Request): Promise<NextResponse> {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

  try {
    const result = await db.select({
        user: users,
        profile: managerProfiles,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(and(eq(users.role, 'manager'), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt));
      
    const managers = result.map(r => ({...r.user, ...r.profile}))
    return NextResponse.json({ managers });

  } catch (error: any) {
    console.error("Erro ao buscar gerentes:", error);
    return NextResponse.json({ error: "Erro ao buscar gerentes", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;
    
    try {
      const body = await request.json();
      const validatedData = managerProfileSchema.omit({id: true, userId: true}).parse(body);
      
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

      const newManager = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
            companyId: COMPANY_ID,
            email: validatedData.email,
            password: hashedPassword,
            role: 'manager',
            status: 'active',
            phone: validatedData.phone,
            titheDay: validatedData.titheDay,
        }).returning();

        if (!newUser) {
          tx.rollback();
          throw new Error('Falha ao criar usuário para gerente.')
        }

        const [newProfile] = await tx.insert(managerProfiles).values({
            userId: newUser.id,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            cpf: validatedData.cpf,
            cep: validatedData.cep,
            state: validatedData.state,
            city: validatedData.city,
            neighborhood: validatedData.neighborhood,
            address: validatedData.address,
        }).returning();

        return { ...newUser, ...newProfile };
      });
  
      return NextResponse.json({ success: true, manager: newManager }, { status: 201 });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar gerente:", error);
      if (error instanceof Error && 'constraint' in error && (error as any).constraint === 'users_email_unique') {
        return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 409 });
      }

      return NextResponse.json({ error: "Erro ao criar gerente", details: error.message }, { status: 500 });
    }
}
