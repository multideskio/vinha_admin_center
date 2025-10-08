/**
 * @fileoverview Dialog para envio de mensagens personalizadas
 */

import { useState } from 'react'
import { Mail, MessageSquare, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Button } from './button'
import { Textarea } from './textarea'
import { Input } from './input'
import { Label } from './label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { useToast } from '@/hooks/use-toast'

interface SendMessageDialogProps {
  recipientName: string
  recipientEmail: string
  recipientPhone: string
  children: React.ReactNode
  defaultTab?: 'email' | 'whatsapp'
}

export function SendMessageDialog({ 
  recipientName, 
  recipientEmail, 
  recipientPhone, 
  children,
  defaultTab = 'email'
}: SendMessageDialogProps) {
  const [open, setOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: 'Erro',
        description: 'Preencha o assunto e a mensagem do email.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/v1/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          to: recipientEmail,
          subject: emailSubject,
          message: emailMessage,
        }),
      })

      if (!response.ok) throw new Error('Falha ao enviar email')

      toast({
        title: 'Sucesso',
        description: 'Email enviado com sucesso!',
        variant: 'success',
      })
      setOpen(false)
      setEmailSubject('')
      setEmailMessage('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar email.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!whatsappMessage.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite uma mensagem para enviar.',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/v1/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'whatsapp',
          to: recipientPhone,
          message: whatsappMessage,
        }),
      })

      if (!response.ok) throw new Error('Falha ao enviar WhatsApp')

      toast({
        title: 'Sucesso',
        description: 'Mensagem WhatsApp enviada com sucesso!',
        variant: 'success',
      })
      setOpen(false)
      setWhatsappMessage('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar WhatsApp.',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Mensagem para {recipientName}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-to">Para:</Label>
              <Input id="email-to" value={recipientEmail} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-subject">Assunto:</Label>
              <Input
                id="email-subject"
                placeholder="Digite o assunto do email"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message">Mensagem:</Label>
              <Textarea
                id="email-message"
                placeholder="Digite sua mensagem aqui..."
                rows={4}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </TabsContent>
          
          <TabsContent value="whatsapp" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp-to">Para:</Label>
              <Input id="whatsapp-to" value={recipientPhone} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp-message">Mensagem:</Label>
              <Textarea
                id="whatsapp-message"
                placeholder="Digite sua mensagem aqui..."
                rows={4}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSendWhatsApp} 
              disabled={isSending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar WhatsApp'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}