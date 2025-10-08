/**
 * @fileoverview Types para Evolution API v2
 */

export interface EvolutionSendTextRequest {
  number: string
  text: string
  delay?: number
  linkPreview?: boolean
  mentionsEveryOne?: boolean
  mentioned?: string[]
  quoted?: {
    key: {
      id: string
    }
    message: {
      conversation: string
    }
  }
}

export interface EvolutionResponse {
  key?: {
    id: string
    remoteJid: string
    fromMe: boolean
  }
  message?: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
  }
  messageTimestamp?: number
  status?: string
  error?: string
}

export interface EvolutionInstanceInfo {
  instance: {
    instanceName: string
    status: 'open' | 'close' | 'connecting'
  }
  qrcode?: {
    code: string
    base64: string
  }
}

export interface EvolutionWebhookData {
  event: string
  instance: string
  data: {
    key: {
      id: string
      remoteJid: string
      fromMe: boolean
    }
    message: {
      conversation?: string
      extendedTextMessage?: {
        text: string
      }
      imageMessage?: {
        caption?: string
        url?: string
      }
      documentMessage?: {
        caption?: string
        fileName?: string
        url?: string
      }
      audioMessage?: {
        url?: string
      }
      videoMessage?: {
        caption?: string
        url?: string
      }
      [key: string]: unknown
    }
    messageTimestamp: number
    status?: 'ERROR' | 'PENDING' | 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ'
  }
}