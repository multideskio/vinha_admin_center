# ⏰ Configuração do Sistema de Notificações Automáticas

## Como Funciona

O sistema de notificações automáticas usa um endpoint de cron que processa as regras criadas em `/admin/configuracoes/mensagens` e envia mensagens automaticamente.

## Configuração

### 1. Adicionar Secret no .env

```env
CRON_SECRET=seu-token-secreto-aqui
```

**Gere um token seguro:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configurar Serviço de Cron Externo

Escolha um dos serviços gratuitos:

#### Opção A: cron-job.org (Recomendado)

1. Acesse https://cron-job.org
2. Crie uma conta gratuita
3. Clique em "Create cronjob"
4. Configure:
   - **Title**: Vinha Notifications
   - **URL**: `https://seu-dominio.com/api/v1/cron/notifications`
   - **Schedule**: `*/15 * * * *` (a cada 15 minutos)
   - **Request method**: GET
   - **Headers**:
     - `Authorization: Bearer seu-token-secreto-aqui`
5. Salve e ative

#### Opção B: EasyCron

1. Acesse https://www.easycron.com
2. Crie uma conta gratuita
3. Adicione novo cron job:
   - **URL**: `https://seu-dominio.com/api/v1/cron/notifications`
   - **Cron Expression**: `*/15 * * * *`
   - **HTTP Headers**: `Authorization: Bearer seu-token-secreto-aqui`

#### Opção C: Vercel Cron (Se hospedar na Vercel)

Crie `vercel.json` na raiz do projeto:

```json
{
  "crons": [
    {
      "path": "/api/v1/cron/notifications",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

**Nota**: Adicione o CRON_SECRET nas variáveis de ambiente da Vercel.

### 3. Testar Manualmente

Teste o endpoint localmente:

```bash
curl -H "Authorization: Bearer seu-token-secreto-aqui" \
  http://localhost:9002/api/v1/cron/notifications
```

Resposta esperada:

```json
{
  "success": true,
  "results": {
    "processed": 3,
    "sent": 3,
    "failed": 0,
    "errors": []
  }
}
```

## Tipos de Notificações Processadas

### 1. Novo Usuário Cadastrado (`user_registered`)

- Envia boas-vindas para usuários criados nas últimas 24h
- Marca usuário como `welcomeSent: true`

### 2. Pagamento Recebido (`payment_received`)

- Notifica transações completadas na última hora
- Confirma recebimento do pagamento

### 3. Lembrete de Vencimento (`payment_due_reminder`)

- Envia X dias ANTES do vencimento
- Usa campo `titheDay` do usuário
- Exemplo: `daysOffset: -5` = 5 dias antes

### 4. Aviso de Atraso (`payment_overdue`)

- Envia X dias APÓS o vencimento
- Exemplo: `daysOffset: 3` = 3 dias depois

## Frequência Recomendada

- **A cada 15 minutos**: Ideal para maioria dos casos
- **A cada hora**: Se tiver poucos usuários
- **A cada 5 minutos**: Para notificações críticas

## Monitoramento

### Logs

O endpoint retorna estatísticas de execução:

```json
{
  "processed": 5, // Regras processadas
  "sent": 4, // Enviadas com sucesso
  "failed": 1, // Falharam
  "errors": [
    // Detalhes dos erros
    "Lembrete 5 dias: WhatsApp not configured"
  ]
}
```

### Verificar Execução

1. Acesse o painel do serviço de cron
2. Verifique histórico de execuções
3. Monitore status codes (200 = sucesso)

## Segurança

⚠️ **IMPORTANTE:**

1. **Nunca exponha o CRON_SECRET** publicamente
2. Use HTTPS em produção
3. Monitore tentativas de acesso não autorizado
4. Rotacione o secret periodicamente

## Troubleshooting

### Erro 401 Unauthorized

- Verifique se o header `Authorization` está correto
- Confirme que o CRON_SECRET no .env está correto

### Notificações não enviadas

- Verifique se as regras estão ativas em `/admin/configuracoes/mensagens`
- Confirme configurações de WhatsApp/Email
- Verifique logs do servidor

### Timeout

- Reduza o limite de usuários processados por execução
- Aumente frequência do cron (processar menos por vez)

## Custos

- **cron-job.org**: Gratuito até 50 jobs
- **EasyCron**: Gratuito até 1 job
- **Vercel Cron**: Incluído no plano Pro ($20/mês)

## Próximos Passos

Após configurar o cron:

1. Crie regras em `/admin/configuracoes/mensagens`
2. Ative as regras desejadas
3. Aguarde a próxima execução do cron
4. Monitore os logs de envio

## Status de Produção

### ✅ Pronto para MVP/Testes

- Interface de gerenciamento funcional
- Envio de WhatsApp e Email operacional
- Controle de duplicação implementado
- Documentação completa

### ⚠️ Requer Atenção para Produção

- **Monitoramento**: Sem alertas se cron falhar
- **Escalabilidade**: Limitado a ~100 usuários por execução
- **Testes**: Sem cobertura automatizada

### 🚧 Melhorias Futuras

- Migrar para fila (BullMQ + Redis)
- Dashboard de métricas
- Editor visual de templates
- A/B testing de mensagens

Para mais detalhes, consulte `docs/ROADMAP.md`
