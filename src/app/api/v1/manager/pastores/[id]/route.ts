

import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, pastorProfiles, supervisorProfiles } from '@/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { authenticateApiKey } from '@/lib/api-auth';
import { validateRequest } from '@/lib/auth';

const pastorUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  landline: z.string().nullable().optional(),
  cep: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  birthDate: z.date().nullable().optional(),
  titheDay: z.number().nullable().optional(),
  supervisorId: z.string().uuid().nullable().optional(),
  newPassword: z.string().optional().or(z.literal('')),
}).partial();

async function verifyPastor(pastorId: string, managerId: string) {
    const supervisorIdsManagedByGerente = await db.select({ id: supervisorProfiles.userId }).from(supervisorProfiles).where(eq(supervisorProfiles.managerId, managerId));
    if (supervisorIdsManagedByGerente.length === 0) return false;

    const [pastor] = await db.select().from(pastorProfiles).where(eq(pastorProfiles.userId, pastorId));
    if (!pastor || !pastor.supervisorId) return false;
    
    return supervisorIdsManagedByGerente.some(s => s.id === pastor.supervisorId);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = params;

    try {
        const isAuthorized = await verifyPastor(id, sessionUser.id);
        if (!isAuthorized) {
            return NextResponse.json({ error: "Pastor não encontrado ou não pertence a esta rede." }, { status: 404 });
        }

        const result = await db.select({
            user: users,
            profile: pastorProfiles,
        })
        .from(users)
        .leftJoin(pastorProfiles, eq(users.id, pastorProfiles.userId))
        .where(and(eq(users.id, id), eq(users.role, 'pastor'), isNull(users.deletedAt)))
        .limit(1);

        if (result.length === 0) {
            return NextResponse.json({ error: "Pastor não encontrado." }, { status: 404 });
        }

        const { user, profile } = result[0];

        return NextResponse.json({ 
            id: user.id,
            firstName: profile?.firstName,
            lastName: profile?.lastName,
            cpf: profile?.cpf,
            email: user.email,
            phone: user.phone,
            landline: profile?.landline,
            cep: profile?.cep,
            state: profile?.state,
            city: profile?.city,
            neighborhood: profile?.neighborhood,
            address: profile?.address,
            number: profile?.number,
            complement: profile?.complement,
            birthDate: profile?.birthDate,
            titheDay: user.titheDay,
            supervisorId: profile?.supervisorId,
            status: user.status
        });

    } catch (error) {
        console.error("Erro ao buscar pastor:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}


export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = params;
  
    try {
      const isAuthorized = await verifyPastor(id, sessionUser.id);
      if (!isAuthorized) {
          return NextResponse.json({ error: "Não autorizado a modificar este pastor." }, { status: 403 });
      }

      const body = await request.json();
      const validatedData = pastorUpdateSchema.parse({
        ...body,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      });
  
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
  
        const profileUpdateData: Partial<typeof pastorProfiles.$inferInsert> = {};
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
        if (validatedData.birthDate) profileUpdateData.birthDate = validatedData.birthDate;
        if (validatedData.supervisorId) profileUpdateData.supervisorId = validatedData.supervisorId;
        
        if (Object.keys(profileUpdateData).length > 0) {
            await tx.update(pastorProfiles).set(profileUpdateData).where(eq(pastorProfiles.userId, id));
        }
      });
  
      return NextResponse.json({ success: true });
  
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao atualizar pastor:", error);
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
  }

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { user: sessionUser } = await validateRequest();
    if (!sessionUser || sessionUser.role !== 'manager') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { id } = params;

    try {
        const isAuthorized = await verifyPastor(id, sessionUser.id);
        if (!isAuthorized) {
            return NextResponse.json({ error: "Não autorizado a excluir este pastor." }, { status: 403 });
        }

        await db
        .update(users)
        .set({
            deletedAt: new Date(),
            status: 'inactive'
        })
        .where(eq(users.id, id));

        return NextResponse.json({ success: true, message: "Pastor excluído com sucesso." });

    } catch (error) {
        console.error("Erro ao excluir pastor:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
