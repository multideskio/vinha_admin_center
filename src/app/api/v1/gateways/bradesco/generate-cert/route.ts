/**
 * @fileoverview API para gerar certificado auto-assinado para o gateway Bradesco.
 * @description Gera um certificado .pfx auto-assinado compatível com mTLS do Bradesco
 *              para uso em ambientes de desenvolvimento e homologação.
 *              Em produção, deve-se usar certificado ICP-Brasil tipo A1.
 * @version 1.0
 */

import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/jwt'
import { rateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import forge from 'node-forge'

const generateCertSchema = z.object({
  commonName: z.string().min(1, 'Razão social é obrigatória').max(128),
  cnpj: z.string().min(14, 'CNPJ é obrigatório').max(18),
  organization: z.string().min(1, 'Organização é obrigatória').max(64),
  password: z.string().min(4, 'Senha deve ter no mínimo 4 caracteres').max(128),
  validityDays: z.number().int().min(30).max(1095).default(365),
})

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Rate limiting: 5 requests per minute
    const ip =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = await rateLimit('bradesco-generate-cert', ip, 5, 60)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
        { status: 429 },
      )
    }

    // Autenticação
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem gerar certificados.' },
        { status: 403 },
      )
    }

    // Validação do body
    const body: unknown = await request.json()
    const data = generateCertSchema.parse(body)

    // Gerar par de chaves RSA 2048 bits
    const keys = forge.pki.rsa.generateKeyPair(2048)

    // CN no formato exigido pelo Bradesco: "RAZÃOSOCIAL:CNPJ"
    const cnpjClean = data.cnpj.replace(/\D/g, '')
    const commonNameValue = `${data.commonName}:${cnpjClean}`

    // Criar certificado X.509
    const cert = forge.pki.createCertificate()
    cert.publicKey = keys.publicKey
    cert.serialNumber = generateSerialNumber()
    cert.validity.notBefore = new Date()
    cert.validity.notAfter = new Date()
    cert.validity.notAfter.setDate(cert.validity.notAfter.getDate() + data.validityDays)

    const attrs: forge.pki.CertificateField[] = [
      { name: 'commonName', value: commonNameValue },
      { name: 'organizationName', value: data.organization },
      { name: 'countryName', value: 'BR' },
      { name: 'stateOrProvinceName', value: 'SP' },
    ]

    cert.setSubject(attrs)
    cert.setIssuer(attrs) // Auto-assinado: issuer = subject

    // Extensões para uso com mTLS
    cert.setExtensions([
      { name: 'basicConstraints', cA: false },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true,
      },
      {
        name: 'extKeyUsage',
        clientAuth: true,
        serverAuth: true,
      },
      {
        name: 'subjectKeyIdentifier',
      },
    ])

    // Assinar com SHA-256
    cert.sign(keys.privateKey, forge.md.sha256.create())

    // Exportar como PKCS#12 (.pfx) — para uso na aplicação (mTLS)
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], data.password, {
      algorithm: '3des',
      friendlyName: commonNameValue,
    })
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes()
    const pfxBase64 = forge.util.encode64(p12Der)

    // Exportar certificado público como PEM — para upload no portal Bradesco
    const certPem = forge.pki.certificateToPem(cert)

    // Exportar chave privada como PEM — guardar em local seguro
    const keyPem = forge.pki.privateKeyToPem(keys.privateKey)

    // Informações do certificado para exibição
    const certInfo = {
      subject: commonNameValue,
      organization: data.organization,
      cnpj: cnpjClean,
      serialNumber: cert.serialNumber,
      validFrom: cert.validity.notBefore.toISOString(),
      validTo: cert.validity.notAfter.toISOString(),
      algorithm: 'RSA 2048 / SHA-256',
      type: 'Auto-assinado (sandbox/homologação)',
    }

    return NextResponse.json({
      success: true,
      pfxBase64,
      certPem,
      keyPem,
      certInfo,
      message: 'Certificado auto-assinado gerado com sucesso.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 })
    }

    console.error('[BRADESCO_GENERATE_CERT_ERROR]', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      { error: 'Erro ao gerar certificado. Tente novamente.' },
      { status: 500 },
    )
  }
}

/**
 * Gera um serial number aleatório de 16 bytes em hexadecimal.
 */
function generateSerialNumber(): string {
  const bytes = forge.random.getBytesSync(16)
  return forge.util.bytesToHex(bytes)
}
