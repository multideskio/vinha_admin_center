
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, managerProfiles } from '@/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';

const managerUpdateSchema = z.object({
    firstName: z.string().min(1, 'O nome é obrigatório.'),
    lastName: z.string().min(1, 'O sobrenome é obrigatório.'),
    email: z.string().email('E-mail inválido.'),
    phone: z.string().min(1, 'O celular é obrigatório.'),
    landline: z.string().optional(),
    cep: z.string(),
    state: z.string(),
    city: z.string(),
    neighborhood: z.string(),
    address: z.string(),
    titheDay: z.coerce.number(),
    facebook: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
    // Não incluir CPF e senha na atualização por enquanto
  });
  

export async function GET(request: Request, { params }: { params: { id: string } }) {
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
            titheDay: user.titheDay,
            facebook: profile?.facebook,
            instagram: profile?.instagram,
            website: profile?.website,
            status: user.status
        });

    } catch (error) {
        console.error("Erro ao buscar gerente:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}


export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;
  
    try {
      const body = await request.json();
      const validatedData = managerUpdateSchema.parse(body);
  
      // Transação para garantir consistência
      const result = await db.transaction(async (tx) => {
        const [updatedUser] = await tx
          .update(users)
          .set({
            email: validatedData.email,
            phone: validatedData.phone,
            titheDay: validatedData.titheDay,
            updatedAt: new Date(),
          })
          .where(eq(users.id, id))
          .returning();
  
        if (!updatedUser) {
          tx.rollback();
          return null;
        }
  
        const [updatedProfile] = await tx
          .update(managerProfiles)
          .set({
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            landline: validatedData.landline,
            cep: validatedData.cep,
            state: validatedData.state,
            city: validatedData.city,
            neighborhood: validatedData.neighborhood,
            address: validatedData.address,
            facebook: validatedData.facebook,
            instagram: validatedData.instagram,
            website: validatedData.website,
          })
          .where(eq(managerProfiles.userId, id))
          .returning();
        
        return { updatedUser, updatedProfile };
      });
  
      if (!result) {
        return NextResponse.json({ error: "Gerente não encontrado." }, { status: 404 });
      }
  
      return NextResponse.json({ success: true, manager: result });
  
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao atualizar gerente:", error);
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
  }

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    } catch (error) {
        console.error("Erro ao excluir gerente:", error);
        return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
}
