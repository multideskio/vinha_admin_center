import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { db } from '@/db/drizzle'
import { users, pastorProfiles } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { rateLimit, rateLimitPresets, getClientIP } from '@/lib/rate-limiter'

const registerPastorSchema = z.object({
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  cpf: z.string().min(14, 'CPF é obrigatório'),
  birthDate: z.string().refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }, 'Data inválida'),
  email: z.string().email('Email inválido'),
  supervisorId: z.string().uuid('Supervisor inválido'),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(
      `register:pastor:${clientIP}`,
      rateLimitPresets.register
    )
    
    if (!rateLimitResult.allowed) {
      const resetInMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        { 
          error: `Muitas tentativas de registro. Tente novamente em ${resetInMinutes} minutos.`,
          resetAt: rateLimitResult.resetAt
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitPresets.register.maxAttempts),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          }
        }
      )
    }

    // 2. Validar dados de entrada
    const body = await request.json()
    const validatedData = registerPastorSchema.parse(body)

    // 3. Verificar COMPANY_INIT
    const COMPANY_ID = process.env.COMPANY_INIT
    if (!COMPANY_ID) {
      return NextResponse.json(
        { error: 'Configuração do sistema inválida' },
        { status: 500 }
      )
    }

    // 4. Verificar se email já existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${validatedData.email.toLowerCase()}`)
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // 5. Verificar se CPF já existe
    const [existingCPF] = await db
      .select()
      .from(pastorProfiles)
      .where(sql`${pastorProfiles.cpf} = ${validatedData.cpf}`)
      .limit(1)

    if (existingCPF) {
      return NextResponse.json(
        { error: 'Este CPF já está cadastrado' },
        { status: 400 }
      )
    }

    // 6. Gerar senha temporária (8 caracteres aleatórios)
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // 7. Criar usuário
    const [newUser] = await db
      .insert(users)
      .values({
        companyId: COMPANY_ID,
        email: validatedData.email.toLowerCase(),
        password: hashedPassword,
        role: 'pastor',
        status: 'active',
        welcomeSent: false,
      })
      .returning()

    if (!newUser) {
      throw new Error('Falha ao criar usuário')
    }

    // 8. Criar perfil de pastor
    const [pastorProfile] = await db
      .insert(pastorProfiles)
      .values({
        userId: newUser.id,
        supervisorId: validatedData.supervisorId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        cpf: validatedData.cpf,
        birthDate: validatedData.birthDate,
      })
      .returning()

    if (!pastorProfile) {
      // Rollback: deletar usuário se falhar ao criar perfil
      await db.delete(users).where(sql`${users.id} = ${newUser.id}`)
      throw new Error('Falha ao criar perfil de pastor')
    }

    // 9. TODO: Enviar email com senha temporária
    // await sendWelcomeEmail(newUser.email, tempPassword)

    return NextResponse.json(
      {
        success: true,
        message: 'Cadastro realizado com sucesso! Verifique seu email para a senha temporária.',
        userId: newUser.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering pastor:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro ao criar cadastro. Tente novamente.' },
      { status: 500 }
    )
  }
}

