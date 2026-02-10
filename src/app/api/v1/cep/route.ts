import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  // Rate limiting: 30 req/min por IP
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const rateLimitResult = await rateLimit('cep', ip, 30, 60)
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      { status: 429 },
    )
  }

  const searchParams = request.nextUrl.searchParams
  const cep = searchParams.get('cep')?.replace(/\D/g, '')

  if (!cep || cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5_000)
    let response: Response
    try {
      response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[VIACEP_TIMEOUT] Timeout ao buscar CEP')
        return NextResponse.json({ error: 'Timeout ao buscar CEP' }, { status: 504 })
      }
      throw fetchError
    }
    const data = await response.json()

    if (data.erro) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      cep: data.cep,
      address: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    })
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    return NextResponse.json({ error: 'Erro ao buscar CEP' }, { status: 500 })
  }
}
