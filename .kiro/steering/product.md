---
inclusion: always
---

# Visão do Produto - Vinha Admin Center

**Sistema em PRODUÇÃO** - priorize estabilidade, segurança e integridade de dados.

## Arquitetura de Roles

### Admin (`/admin/*`)

- Acesso total ao sistema
- Gestão de usuários, configurações, gateways, relatórios globais

### Manager (`/manager/*`)

- Supervisão de rede multi-regional
- Acesso filtrado por regiões atribuídas

### Supervisor (`/supervisor/*`)

- Gestão regional de igrejas
- Acesso filtrado por região atribuída

### Pastor (`/pastor/*`)

- Gestão de conta pessoal
- Acesso apenas aos próprios registros

### Igreja (`/igreja/*`)

- Dashboard da igreja
- Acesso apenas aos registros da própria igreja

## Regras Críticas de Negócio

### Pagamentos (Cielo + Bradesco)

**Geral:**

- Transações DEVEM ser idempotentes - nunca duplicar cobranças
- Valores monetários em inteiros (centavos) - evitar float
- Webhooks podem chegar antes do redirect - tratar estado async
- Falhas requerem revisão manual - NUNCA auto-retry

**Cielo API:**

- Cartão de crédito/débito
- Boleto via provider Bradesco2

**Bradesco API (REST):**

- PIX: Cobrança imediata com QR Code
- Boleto: Registro via API REST (não usa CNAB 400)
- Autenticação: OAuth 2.0 com certificado digital mTLS
- NUNCA implementar geração de arquivos CNAB - sistema usa API REST moderna

### Hierarquia de Dados

- Admin → Manager → Supervisor → Pastor/Igreja
- Cascatas de deleção controladas - prevenir perda de dados
- Filtros por região para Manager/Supervisor

### Segurança

- JWT em TODAS rotas protegidas
- Rate limiting em todos endpoints
- Validação Zod antes de operações no banco
- Validar tipo/tamanho de uploads antes do S3
- NUNCA expor dados sensíveis em logs/responses

### Comunicação

- Email via AWS SES - respeitar bounces/complaints
- WhatsApp via Evolution API v2 - conexão volátil
- Notificações via BullMQ - garantir idempotência
- Sanitizar variáveis de template

## Armadilhas Comuns

1. **Confusão de Roles** - cada role tem rotas e permissões isoladas
2. **Duplicação de Pagamentos** - sempre verificar status antes de criar cobrança
3. **Vazamento de Dados** - filtrar queries por escopo do role
4. **Race Conditions em Webhooks** - tratar chegada antes do redirect
5. **Segurança de Upload** - validar antes de enviar ao S3
6. **Spam de Notificações** - respeitar preferências e limites
7. **Migrations** - testar em staging - dados de produção são insubstituíveis
