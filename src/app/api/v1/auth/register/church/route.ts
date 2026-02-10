import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'
import { randomBytes } from 'crypto'
import { db } from '@/db/drizzle'
import { users, churchProfiles } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { rateLimit, rateLimitPresets, getClientIP } from '@/lib/rate-limiter'
import { env } from '@/lib/env'
import { invalidateCache } from '@/lib/cache'

const registerChurchSchema = z.object({
  nomeFantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z.string().min(18, 'CNPJ é obrigatório'),
  email: z.string().email('Email inválido'),
  supervisorId: z.string().uuid('Supervisor inválido'),
})

const COMPANY_ID = env.COMPANY_INIT

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIP = getClientIP(request)
    const rateLimitResult = rateLimit(`register:church:${clientIP}`, rateLimitPresets.register)

    if (!rateLimitResult.allowed) {
      const resetInMinutes = Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000)
      return NextResponse.json(
        {
          error: `Muitas tentativas de registro. Tente novamente em ${resetInMinutes} minutos.`,
          resetAt: rateLimitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitPresets.register.maxAttempts),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          },
        },
      )
    }

    // 2. Validar dados de entrada
    const body = await request.json()
    const validatedData = registerChurchSchema.parse(body)

    // 3. Verificar se email já existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = ${validatedData.email.toLowerCase()}`)
      .limit(1)

    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 })
    }

    // 4. Verificar se CNPJ já existe
    const [existingCNPJ] = await db
      .select()
      .from(churchProfiles)
      .where(sql`${churchProfiles.cnpj} = ${validatedData.cnpj}`)
      .limit(1)

    if (existingCNPJ) {
      return NextResponse.json({ error: 'Este CNPJ já está cadastrado' }, { status: 400 })
    }

    // 5. Gerar senha temporária criptograficamente segura
    const tempPassword = randomBytes(12).toString('base64url')
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // 6. Criar usuário e perfil em transação atômica
    const { newUser } = await db.transaction(async (tx) => {
      const [createdUser] = await tx
        .insert(users)
        .values({
          companyId: COMPANY_ID,
          email: validatedData.email.toLowerCase(),
          password: hashedPassword,
          role: 'church_account',
          status: 'active',
          welcomeSent: false,
        })
        .returning()

      if (!createdUser) {
        throw new Error('Falha ao criar usuário')
      }

      const [createdProfile] = await tx
        .insert(churchProfiles)
        .values({
          userId: createdUser.id,
          supervisorId: validatedData.supervisorId,
          cnpj: validatedData.cnpj,
          razaoSocial: validatedData.razaoSocial,
          nomeFantasia: validatedData.nomeFantasia,
        })
        .returning()

      if (!createdProfile) {
        throw new Error('Falha ao criar perfil de igreja')
      }

      return { newUser: createdUser, churchProfile: createdProfile }
    })

    // 8. TODO: Enviar email com senha temporária
    // await sendWelcomeEmail(newUser.email, tempPassword)

    // ✅ Invalidar cache de relatórios de membresia após criação de usuário
    await invalidateCache('relatorio:membresia:*')

    return NextResponse.json(
      {
        success: true,
        message: 'Cadastro realizado com sucesso! Verifique seu email para a senha temporária.',
        userId: newUser.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error registering church:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao criar cadastro. Tente novamente.' }, { status: 500 })
  }
}
