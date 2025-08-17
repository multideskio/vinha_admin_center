

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, supervisorProfiles, managerProfiles, regions } from '@/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { validateRequest } from '@/lib/auth';
import { supervisorProfileSchema } from '@/lib/types';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123456";

export async function GET(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

  try {
    const url = new URL(request.url);
    const minimal = url.searchParams.get('minimal') === 'true';

    if (minimal) {
        const result = await db.select({
            id: users.id,
            firstName: supervisorProfiles.firstName,
            lastName: supervisorProfiles.lastName,
        })
        .from(supervisorProfiles)
        .innerJoin(users, eq(users.id, supervisorProfiles.userId))
        .where(and(
            eq(users.role, 'supervisor'), 
            eq(supervisorProfiles.managerId, user.id),
            isNull(users.deletedAt)
          ))
        .orderBy(desc(users.createdAt));
        return NextResponse.json({ supervisors: result });
    }

    const result = await db.select({
        id: users.id,
        firstName: supervisorProfiles.firstName,
        lastName: supervisorProfiles.lastName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        cpf: supervisorProfiles.cpf,
        regionName: regions.name,
      })
      .from(users)
      .innerJoin(supervisorProfiles, eq(users.id, supervisorProfiles.userId))
      .leftJoin(regions, eq(supervisorProfiles.regionId, regions.id))
      .where(and(
        eq(users.role, 'supervisor'), 
        eq(supervisorProfiles.managerId, user.id),
        isNull(users.deletedAt)
      ))
      .orderBy(desc(users.createdAt));
      
    return NextResponse.json({ supervisors: result });

  } catch (error: any) {
    console.error("Erro ao buscar supervisores:", error);
    return NextResponse.json({ error: "Erro interno do servidor.", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
    const { user } = await validateRequest();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    
    try {
      const body = await request.json();
      const validatedData = supervisorProfileSchema.omit({id: true, userId: true, managerId: true}).parse(body);
      
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

      const newSupervisor = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
            companyId: COMPANY_ID,
            email: validatedData.email,
            password: hashedPassword,
            role: 'supervisor',
            status: 'active',
            phone: validatedData.phone,
            titheDay: validatedData.titheDay,
        }).returning();

        const [newProfile] = await tx.insert(supervisorProfiles).values({
            userId: newUser.id,
            managerId: user.id,
            regionId: validatedData.regionId,
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
  
      return NextResponse.json({ success: true, supervisor: newSupervisor }, { status: 201 });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar supervisor:", error);
      if (error instanceof Error && 'constraint' in error && ((error as any).constraint === 'users_email_unique' || (error as any).constraint === 'supervisor_profiles_cpf_unique')) {
        return NextResponse.json({ error: "Email ou CPF já cadastrado." }, { status: 409 });
      }

      return NextResponse.json({ error: "Erro ao criar supervisor", details: error.message }, { status: 500 });
    }
}
