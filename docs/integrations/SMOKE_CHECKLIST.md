# Checklist de Smoke para Integrações

Use este checklist após alterações nas integrações para validar que tudo funciona.

## Pré-requisitos

- [ ] App rodando (`npm run dev`)
- [ ] Worker rodando (`npm run dev:worker`)
- [ ] Banco de dados e Redis disponíveis
- [ ] Credenciais de teste configuradas conforme necessário

---

## 1. Cielo (Sandbox)

- [ ] Criar transação PIX via interface de contribuição
- [ ] Verificar se QR Code é exibido
- [ ] Consultar status da transação (sync) no painel admin
- [ ] Simular webhook: `POST /api/v1/webhooks/cielo` com payload `{ "PaymentId": "<uuid>", "ChangeType": 1 }`
- [ ] Verificar que status da transação é atualizado

---

## 2. Bradesco (Sandbox/Homologação)

- [ ] Configurar gateway Bradesco com certificado de homologação
- [ ] Criar transação PIX via interface
- [ ] Verificar QR Code PIX
- [ ] Criar transação Boleto (se configurado)
- [ ] Simular webhooks PIX e Boleto
- [ ] Verificar atualização de status

---

## 3. Email

- [ ] Configurar SMTP ou AWS SES no painel (Configurações > SMTP)
- [ ] Enviar email de teste via painel
- [ ] Verificar recebimento na caixa de entrada
- [ ] Verificar logs em Configurações > Logs de Lembretes

---

## 4. WhatsApp (Evolution API)

- [ ] Configurar Evolution API no painel (Configurações > WhatsApp)
- [ ] Conectar instância via QR Code
- [ ] Enviar mensagem de teste
- [ ] Verificar recebimento no WhatsApp

---

## 5. S3

- [ ] Configurar S3 no painel (Configurações > Armazenamento)
- [ ] Fazer upload de avatar (perfil)
- [ ] Verificar exibição da imagem
- [ ] Testar delete (se aplicável)

---

## 6. OpenAI

- [ ] Configurar chave da OpenAI no painel (Configurações > API OpenAI)
- [ ] Ir em Configurações > Mensagens Automáticas
- [ ] Usar sugestão de template por IA
- [ ] Verificar que o texto é gerado
- [ ] Acessar dashboard admin e verificar insights (se disponível)

---

## Comandos úteis

```bash
# Rodar testes de contrato e mapeamento
npm run test -- src/__tests__/integrations/

# Rodar todos os testes (exceto logger/rate-limit se houver falhas)
npm run test -- src/__tests__/integrations/ src/__tests__/delete-schemas src/__tests__/pagination-utils src/__tests__/report-schemas
```

---

## Rollback

Se algo falhar após alterações:

1. Reverter o último commit: `git revert HEAD`
2. Ou reverter commits específicos: `git revert <commit-hash>`
3. Consultar `docs/integrations/PAYLOAD_CONTRACTS.md` para validar contratos
