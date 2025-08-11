
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, managerProfiles } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { validateRequest } from '@/lib/auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123456";

const managerSchema = z.object({
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  cep: z.string().min(9, { message: 'O CEP deve ter 8 dígitos.' }),
  state: z.string().length(2, { message: 'UF deve ter 2 letras.' }),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  neighborhood: z.string().min(1, { message: 'O bairro é obrigatório.' }),
  address: z.string().min(1, { message: 'O endereço é obrigatório.' }),
  titheDay: z.coerce.number().min(1).max(31),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
});


export async function GET(request: Request) {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

  try {
    const result = await db.select({
        id: users.id,
        firstName: managerProfiles.firstName,
        lastName: managerProfiles.lastName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        cpf: managerProfiles.cpf,
        cep: managerProfiles.cep,
        state: managerProfiles.state,
        city: managerProfiles.city,
        neighborhood: managerProfiles.neighborhood,
        address: managerProfiles.address,
        titheDay: users.titheDay,
      })
      .from(users)
      .leftJoin(managerProfiles, eq(users.id, managerProfiles.userId))
      .where(and(eq(users.role, 'manager'), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt));
      
    return NextResponse.json({ managers: result });

  } catch (error: any) {
    console.error("Erro ao buscar gerentes:", error);
    return NextResponse.json({ error: "Erro ao buscar gerentes", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const { user } = await validateRequest();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }
    
    try {
      const body = await request.json();
      const validatedData = managerSchema.parse(body);
      
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
