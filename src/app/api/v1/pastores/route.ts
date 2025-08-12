

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, pastorProfiles, supervisorProfiles } from '@/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { authenticateApiKey } from '@/lib/api-auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123456";

const pastorSchema = z.object({
  supervisorId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  cpf: z.string().min(1),
  email: z.string().email(),
  cep: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  neighborhood: z.string().nullable(),
  address: z.string().nullable(),
  birthDate: z.date().nullable(),
  titheDay: z.number().nullable(),
  phone: z.string().nullable(),
});


export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

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

export async function POST(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
      const body = await request.json();
      const validatedData = pastorSchema.parse({
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

        const [newProfile] = await tx.insert(pastorProfiles).values({
            userId: newUser.id,
            supervisorId: validatedData.supervisorId,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            cpf: validatedData.cpf,
            birthDate: validatedData.birthDate,
            cep: validatedData.cep,
            state: validatedData.state,
            city: validatedData.city,
            neighborhood: validatedData.neighborhood,
            address: validatedData.address
        }).returning();

        return { ...newUser, ...newProfile };
      });
  
      return NextResponse.json({ success: true, pastor: newPastor }, { status: 201 });

    } catch (error) {
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
