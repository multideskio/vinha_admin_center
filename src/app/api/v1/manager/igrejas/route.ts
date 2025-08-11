

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, churchProfiles, supervisorProfiles } from '@/db/schema';
import { eq, and, isNull, desc, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { validateRequest } from '@/lib/auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123456";

const churchSchema = z.object({
  supervisorId: z.string().uuid(),
  cnpj: z.string().min(1),
  razaoSocial: z.string().min(1),
  nomeFantasia: z.string().min(1),
  email: z.string().email(),
  cep: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  neighborhood: z.string().nullable(),
  address: z.string().nullable(),
  foundationDate: z.date().nullable(),
  titheDay: z.number().nullable(),
  phone: z.string().nullable(),
  treasurerFirstName: z.string().nullable(),
  treasurerLastName: z.string().nullable(),
  treasurerCpf: z.string().nullable(),
});

export async function GET(request: Request) {
    const { user } = await validateRequest();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    try {
        const supervisorIdsResult = await db.select({ id: supervisorProfiles.userId })
            .from(supervisorProfiles)
            .where(eq(supervisorProfiles.managerId, user.id));
        
        if (supervisorIdsResult.length === 0) {
            return NextResponse.json({ churches: [] });
        }
        
        const supervisorIds = supervisorIdsResult.map(s => s.id);

        const result = await db.select({
            id: users.id,
            nomeFantasia: churchProfiles.nomeFantasia,
            email: users.email,
            phone: users.phone,
            status: users.status,
            cnpj: churchProfiles.cnpj,
            city: churchProfiles.city,
            state: churchProfiles.state,
            supervisorName: sql<string>`${supervisorProfiles.firstName} || ' ' || ${supervisorProfiles.lastName}`,
          })
          .from(users)
          .innerJoin(churchProfiles, eq(users.id, churchProfiles.userId))
          .leftJoin(supervisorProfiles, eq(churchProfiles.supervisorId, supervisorProfiles.userId))
          .where(and(eq(users.role, 'church_account'), isNull(users.deletedAt), inArray(churchProfiles.supervisorId, supervisorIds)))
          .orderBy(desc(users.createdAt));
          
        return NextResponse.json({ churches: result });

    } catch (error) {
        console.error("Erro ao buscar igrejas:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const { user } = await validateRequest();
    if (!user || user.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    
    try {
      const body = await request.json();
      const validatedData = churchSchema.parse({
        ...body,
        foundationDate: body.foundationDate ? new Date(body.foundationDate) : null,
      });

      const [supervisor] = await db.select({id: supervisorProfiles.userId})
        .from(supervisorProfiles)
        .where(and(
            eq(supervisorProfiles.userId, validatedData.supervisorId),
            eq(supervisorProfiles.managerId, user.id)
        ));

      if (!supervisor) {
        return NextResponse.json({ error: "Supervisor inválido ou não pertence a este gerente." }, { status: 403 });
      }
      
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

      const newChurch = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
            companyId: COMPANY_ID,
            email: validatedData.email,
            password: hashedPassword,
            role: 'church_account',
            status: 'active',
            phone: validatedData.phone,
            titheDay: validatedData.titheDay,
        }).returning();

        const [newProfile] = await tx.insert(churchProfiles).values({
            userId: newUser.id,
            supervisorId: validatedData.supervisorId,
            cnpj: validatedData.cnpj,
            razaoSocial: validatedData.razaoSocial,
            nomeFantasia: validatedData.nomeFantasia,
            foundationDate: validatedData.foundationDate,
            cep: validatedData.cep,
            state: validatedData.state,
            city: validatedData.city,
            neighborhood: validatedData.neighborhood,
            address: validatedData.address,
            treasurerFirstName: validatedData.treasurerFirstName,
            treasurerLastName: validatedData.treasurerLastName,
            treasurerCpf: validatedData.treasurerCpf,
        }).returning();

        return { ...newUser, ...newProfile };
      });
  
      return NextResponse.json({ success: true, church: newChurch }, { status: 201 });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar igreja:", error);
      if (error instanceof Error && 'constraint' in error && ((error as any).constraint === 'users_email_unique' || (error as any).constraint === 'church_profiles_cnpj_unique')) {
        return NextResponse.json({ error: "Email ou CNPJ já cadastrado." }, { status: 409 });
      }

      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
