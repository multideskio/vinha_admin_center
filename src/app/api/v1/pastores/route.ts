/**
* @fileoverview Rota da API para gerenciar pastores.
* @version 1.2
* @date 2024-08-07
* @author PH
*/

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, pastorProfiles, supervisorProfiles } from '@/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { validateRequest } from '@/lib/auth';
import { pastorProfileSchema } from '@/lib/types';


const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123456";


export async function GET(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

  try {
    const url = new URL(request.url);
    const minimal = url.searchParams.get('minimal') === 'true';

    if (minimal) {
        const result = await db.select({
            id: pastorProfiles.userId,
            firstName: pastorProfiles.firstName,
            lastName: pastorProfiles.lastName,
        })
        .from(pastorProfiles)
        .leftJoin(users, eq(users.id, pastorProfiles.userId))
        .where(isNull(users.deletedAt))
        .orderBy(desc(users.createdAt));
        return NextResponse.json({ pastors: result });
    }

    const result = await db.select({
        id: users.id,
        firstName: pastorProfiles.firstName,
        lastName: pastorProfiles.lastName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        cpf: pastorProfiles.cpf,
        supervisorName: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
      })
      .from(users)
      .innerJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
      .leftJoin(supervisorProfiles, eq(pastorProfiles.supervisorId, supervisorProfiles.userId))
      .where(and(eq(users.role, 'pastor'), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt));
      
    return NextResponse.json({ pastors: result });

  } catch (error) {
    console.error("Erro ao buscar pastores:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
      const body = await request.json();
      const validatedData = pastorProfileSchema.parse({
        ...body,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
      });
      
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

      const newPastor = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
            companyId: COMPANY_ID,
            email: validatedData.email,
            password: hashedPassword,
            role: 'pastor',
            status: 'active',
            phone: validatedData.phone,
            titheDay: validatedData.titheDay,
        }).returning();

        if (!newUser) {
            tx.rollback();
            throw new Error("Falha ao criar o usuário para o pastor.");
        }

        const [newProfile] = await tx.insert(pastorProfiles).values({
            userId: newUser.id,
            supervisorId: validatedData.supervisorId,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            cpf: validatedData.cpf,
            birthDate: validatedData.birthDate ? validatedData.birthDate.toISOString() : null,
            cep: validatedData.cep,
            state: validatedData.state,
            city: validatedData.city,
            neighborhood: validatedData.neighborhood,
            address: validatedData.address
        }).returning();

        return { ...newUser, ...newProfile };
      });
  
      return NextResponse.json({ success: true, pastor: newPastor }, { status: 201 });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar pastor:", error);
      if (error instanceof Error && 'constraint' in error && ((error as any).constraint === 'users_email_unique' || (error as any).constraint === 'pastor_profiles_cpf_unique')) {
        return NextResponse.json({ error: "Email ou CPF já cadastrado." }, { status: 409 });
      }

      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
