/**
 * @fileoverview Cliente S3 configurável baseado nas configurações da empresa
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { db } from '@/db/drizzle'
import { otherSettings } from '@/db/schema'
import { eq } from 'drizzle-orm'

interface S3Config {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  forcePathStyle: boolean
  cloudfrontUrl?: string
}

export class S3Service {
  private client: S3Client | null = null
  private config: S3Config | null = null

  async initialize(companyId: string): Promise<void> {
    const [settings] = await db
      .select()
      .from(otherSettings)
      .where(eq(otherSettings.companyId, companyId))
      .limit(1)

    if (!settings?.s3Endpoint || !settings?.s3AccessKeyId || !settings?.s3SecretAccessKey) {
      throw new Error('S3 configuration not found or incomplete')
    }

    this.config = {
      endpoint: settings.s3Endpoint,
      bucket: settings.s3Bucket || 'default-bucket',
      region: settings.s3Region || 'us-east-1',
      accessKeyId: settings.s3AccessKeyId,
      secretAccessKey: settings.s3SecretAccessKey,
      forcePathStyle: settings.s3ForcePathStyle || false,
      cloudfrontUrl: settings.s3CloudfrontUrl || undefined,
    }

    let endpointUrl = this.config.endpoint
    if (endpointUrl && !endpointUrl.startsWith('http://') && !endpointUrl.startsWith('https://')) {
      endpointUrl = `https://${endpointUrl}`
    }

    // Para AWS S3 padrão, não usar endpoint customizado
    const isAwsS3 = endpointUrl && (endpointUrl.includes('amazonaws.com') || 
                    endpointUrl === 's3.amazonaws.com')

    this.client = new S3Client({
      ...(isAwsS3 ? {} : { endpoint: endpointUrl }),
      region: this.config.region || 'us-east-1',
      credentials: {
        accessKeyId: this.config.accessKeyId || '',
        secretAccessKey: this.config.secretAccessKey || '',
      },
      forcePathStyle: this.config.forcePathStyle,
    })
  }

  async uploadFile(
    file: Buffer | Uint8Array,
    key: string,
    contentType: string = 'application/octet-stream'
  ): Promise<string> {
    if (!this.client || !this.config) {
      throw new Error('S3 client not initialized')
    }

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })

    await this.client.send(command)
    
    // Retornar URL do CloudFront se configurado
    if (this.config.cloudfrontUrl) {
      return `${this.config.cloudfrontUrl}/${key}`
    }
    
    // ✅ CORRIGIDO: Formato correto de URL S3
    const isAwsS3 = this.config.endpoint.includes('amazonaws.com') || 
                    this.config.endpoint === 's3.amazonaws.com'
    
    if (isAwsS3) {
      // Virtual-hosted style (padrão AWS)
      return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`
    }
    
    // Para S3-compatible (MinIO, DigitalOcean Spaces, etc)
    const endpoint = this.config.endpoint.replace(/\/$/, '') // Remove trailing slash
    return this.config.forcePathStyle 
      ? `${endpoint}/${this.config.bucket}/${key}`
      : `${endpoint}/${key}`
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('S3 client not initialized')
    }

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    })

    await this.client.send(command)
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.client || !this.config) {
      throw new Error('S3 client not initialized')
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    })

    return await getSignedUrl(this.client, command, { expiresIn })
  }

  generateKey(folder: string, filename: string): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = filename.split('.').pop()
    return `${folder}/${timestamp}-${randomString}.${extension}`
  }
}

// Função utilitária para criar instância do serviço
export async function createS3Service(companyId: string): Promise<S3Service> {
  const service = new S3Service()
  await service.initialize(companyId)
  return service
}