/**
 * @fileoverview API para gerenciar templates de mensagens
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/drizzle'
import { messageTemplates } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'
import { TemplateEngine } from '@/lib/template-engine'

const templateSchema = z.object({
  companyId: z.string().uuid(),
  templateType: z.enum(['welcome', 'payment_reminder']),
  name: z.string().min(1).max(100),
  whatsappTemplate: z.string().optional(),
  emailSubjectTemplate: z.string().max(255).optional(),
  emailHtmlTemplate: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET - Listar templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const templateType = searchParams.get('type')

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      )
    }

    const templates = templateType
      ? await db
          .select()
          .from(messageTemplates)
          .where(
            and(
              eq(messageTemplates.companyId, companyId),
              eq(messageTemplates.templateType, templateType)
            )
          )
      : await db
          .select()
          .from(messageTemplates)
          .where(eq(messageTemplates.companyId, companyId))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Criar template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = templateSchema.parse(body)

    // Validar templates
    if (data.whatsappTemplate) {
      const validation = TemplateEngine.validateTemplate(data.whatsappTemplate)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Invalid WhatsApp template', details: validation.errors },
          { status: 400 }
        )
      }
    }

    if (data.emailHtmlTemplate) {
      const validation = TemplateEngine.validateTemplate(data.emailHtmlTemplate)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Invalid email template', details: validation.errors },
          { status: 400 }
        )
      }
    }

    const [template] = await db
      .insert(messageTemplates)
      .values(data)
      .returning()

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar template
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const data = templateSchema.partial().parse(body)

    // Validar templates se fornecidos
    if (data.whatsappTemplate) {
      const validation = TemplateEngine.validateTemplate(data.whatsappTemplate)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Invalid WhatsApp template', details: validation.errors },
          { status: 400 }
        )
      }
    }

    if (data.emailHtmlTemplate) {
      const validation = TemplateEngine.validateTemplate(data.emailHtmlTemplate)
      if (!validation.isValid) {
        return NextResponse.json(
          { error: 'Invalid email template', details: validation.errors },
          { status: 400 }
        )
      }
    }

    const [template] = await db
      .update(messageTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(messageTemplates.id, templateId))
      .returning()

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating template:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}