
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, adminProfiles } from '@/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { authenticateApiKey } from '@/lib/api-auth';

const COMPANY_ID = process.env.COMPANY_INIT;
if (!COMPANY_ID) {
    throw new Error("A variável de ambiente COMPANY_INIT não está definida.");
}

const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD || "123456";

const adminSchema = z.object({
  firstName: z.string().min(1, { message: 'O nome é obrigatório.' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório.' }),
  cpf: z.string().min(14, { message: 'O CPF deve ter 11 dígitos.' }),
  email: z.string().email({ message: 'E-mail inválido.' }),
  phone: z.string().min(1, { message: 'O celular é obrigatório.' }),
  role: z.enum(['admin', 'superadmin'], {
    required_error: 'Selecione uma permissão.',
  }),
});

export async function GET(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

  try {
    const result = await db.select({
        id: users.id,
        firstName: adminProfiles.firstName,
        lastName: adminProfiles.lastName,
        email: users.email,
        phone: users.phone,
        status: users.status,
        cpf: adminProfiles.cpf,
        role: adminProfiles.permission,
        city: adminProfiles.city,
        state: adminProfiles.state,
      })
      .from(users)
      .leftJoin(adminProfiles, eq(users.id, adminProfiles.userId))
      .where(and(eq(users.role, 'admin'), isNull(users.deletedAt)))
      .orderBy(desc(users.createdAt));
      
    return NextResponse.json({ admins: result });

  } catch (error: any) {
    console.error("Erro ao buscar administradores:", error);
    return NextResponse.json({ error: "Erro ao buscar administradores", details: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const authResponse = await authenticateApiKey(request);
    if (authResponse) return authResponse;

    try {
      const body = await request.json();
      const validatedData = adminSchema.parse(body);
      
      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

      const newAdmin = await db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users).values({
            companyId: COMPANY_ID,
            email: validatedData.email,
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            phone: validatedData.phone,
        }).returning();

        const [newProfile] = await tx.insert(adminProfiles).values({
            userId: newUser.id,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            cpf: validatedData.cpf,
            permission: validatedData.role,
        }).returning();

        return { ...newUser, ...newProfile };
      });
  
      return NextResponse.json({ success: true, admin: newAdmin }, { status: 201 });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: "Dados inválidos.", details: error.errors }, { status: 400 });
      }
      console.error("Erro ao criar administrador:", error);
      if (error instanceof Error && 'constraint' in error && ((error as any).constraint === 'users_email_unique' || (error as any).constraint === 'admin_profiles_cpf_unique')) {
        return NextResponse.json({ error: "Email ou CPF já cadastrado." }, { status: 409 });
      }

      return NextResponse.json({ error: "Erro ao criar administrador", details: error.message }, { status: 500 });
    }
}
