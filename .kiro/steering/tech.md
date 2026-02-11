---
inclusion: always
---

# Stack Tecnológica - Vinha Admin Center

## Tecnologias Principais

- **Next.js 15.5.3** (App Router) + **React 18.3.1** + **TypeScript 5**
- **PostgreSQL** + **Drizzle ORM 0.44.7**
- **JWT** (jose) + **bcrypt** + **Zod**
- **Tailwind CSS 3.4.1** + **shadcn/ui**
- **AWS S3/SES**, **Cielo API**, **Bradesco API (PIX + Boleto)**, **Evolution API v2**, **ViaCEP**
- **BullMQ + Redis** para filas

## Gateways de Pagamento

### Cielo API

- Cartão de crédito/débito
- Boleto via Bradesco2 provider
- Webhooks em tempo real

### Bradesco API (REST)

- **PIX**: Cobrança imediata via API REST
- **Boleto**: Registro via API REST (não usa CNAB)
- **OAuth 2.0**: Autenticação com certificado digital mTLS
- **Webhooks**: Notificações automáticas de pagamento
- **Ambientes**: Production, Development (Homologação), Sandbox

## Comandos Principais

```bash
npm run dev              # Servidor dev (porta 9002)
npm run dev:worker       # Worker de background
npm run db:push          # Aplicar migrations
npm run db:studio        # GUI do banco
npm run build            # Build produção
```
