
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, managerProfiles } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { validateRequest } from '@/lib/auth';

const managerUpdateSchema = z.object({
    firstName: z.string().min(1, 'O nome é obrigatório.').optional(),
    lastName: z.string().min(1, 'O sobrenome é obrigatório.').optional(),
    email: z.string().email('E-mail inválido.').optional(),
    phone: z.string().nullable().optional(),
    landline: z.string().nullable().optional(),
    cep: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    neighborhood: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    titheDay: z.coerce.number().nullable().optional(),
    facebook: z.string().url().or(z.literal('')).nullable().optional(),
    instagram: z.string().url().or(z.literal('')).nullable().optional(),
    website: z.string().url().or(z.literal('')).nullable().optional(),
    newPassword: z.string().optional().or(z.literal('')),
}).partial();
  

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

        if (result.length === 0) {
            return NextResponse.json({ error: "Gerente não encontrado." }, { status: 404 });
        }

        const { user: managerUser, profile } = result[0];

        return NextResponse.json({ 
            id: managerUser.id,
            firstName: profile?.firstName,
            lastName: profile?.lastName,
            cpf: profile?.cpf,
            email: managerUser.email,
            phone: managerUser.phone,
            landline: profile?.landline,
            cep: profile?.cep,
            state: profile?.state,
            city: profile?.city,
            neighborhood: profile?.neighborhood,
            address: profile?.address,
            titheDay: managerUser.titheDay,
            facebook: profile?.facebook,
            instagram: profile?.instagram,
            website: profile?.website,
            status: managerUser.status
        });

    } catch (error: any) {
        console.error("Erro ao buscar gerente:", error);
        return NextResponse.json({ error: "Erro ao buscar gerente", details: error.message }, { status: 500 });
    }
}


export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    
    const { id } = params;
  
    try {
      const body = await request.json();
      const validatedData = managerUpdateSchema.parse(body);
  
      const result = await db.transaction(async (tx) => {
        
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
        if (validatedData.facebook !== undefined) profileUpdateData.facebook = validatedData.facebook;
        if (validatedData.instagram !== undefined) profileUpdateData.instagram = validatedData.instagram;
        if (validatedData.website !== undefined) profileUpdateData.website = validatedData.website;
        
        if (Object.keys(profileUpdateData).length > 0) {
            await tx.update(managerProfiles).set(profileUpdateData).where(eq(managerProfiles.userId, id));
        }
        
        return { success: true };
      });
  
      return NextResponse.json({ success: true, manager: result });
  
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao atualizar gerente:", error);
      return NextResponse.json({ error: "Erro ao atualizar gerente", details: error.message }, { status: 500 });
    }
  }

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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
