# Módulo de Validação de Variáveis de Ambiente

Este módulo centraliza a validação de todas as variáveis de ambiente críticas do sistema usando Zod, garantindo que o aplicativo não inicie com configurações inválidas ou ausentes.

## Uso

```typescript
import { env } from '@/lib/env'

// Usar variáveis validadas
const companyId = env.COMPANY_INIT // string (UUID validado)
const jwtSecret = env.JWT_SECRET // string (mínimo 32 caracteres)
const nodeEnv = env.NODE_ENV // 'development' | 'production' | 'test'
```

## Variáveis Obrigatórias

Estas variáveis **DEVEM** estar definidas no arquivo `.env`:

| Variável           | Tipo   | Validação         | Descrição                        |
| ------------------ | ------ | ----------------- | -------------------------------- |
| `DATABASE_URL`     | string | min 1 caractere   | URL de conexão com PostgreSQL    |
| `COMPANY_INIT`     | string | UUID válido       | ID da empresa inicial            |
| `ADMIN_INIT`       | string | UUID válido       | ID do admin inicial              |
| `JWT_SECRET`       | string | min 32 caracteres | Chave secreta para JWT           |
| `DEFAULT_PASSWORD` | string | min 6 caracteres  | Senha padrão para novos usuários |

## Variáveis Opcionais

Estas variáveis têm valores padrão seguros:

| Variável                    | Tipo   | Default                    | Descrição                  |
| --------------------------- | ------ | -------------------------- | -------------------------- |
| `NODE_ENV`                  | enum   | `'development'`            | Ambiente de execução       |
| `REDIS_URL`                 | string | `'redis://localhost:6379'` | URL do Redis               |
| `AWS_SES_REGION`            | string | -                          | Região AWS SES             |
| `AWS_SES_ACCESS_KEY_ID`     | string | -                          | Access Key AWS SES         |
| `AWS_SES_SECRET_ACCESS_KEY` | string | -                          | Secret Key AWS SES         |
| `AWS_SES_FROM_EMAIL`        | string | -                          | Email remetente (validado) |
| `AWS_S3_REGION`             | string | -                          | Região AWS S3              |
| `AWS_S3_ACCESS_KEY_ID`      | string | -                          | Access Key AWS S3          |
| `AWS_S3_SECRET_ACCESS_KEY`  | string | -                          | Secret Key AWS S3          |
| `AWS_S3_BUCKET_NAME`        | string | -                          | Nome do bucket S3          |

## Comportamento

### Validação no Startup

O módulo valida todas as variáveis **imediatamente** quando é importado. Se alguma variável obrigatória estiver ausente ou inválida, o aplicativo **não iniciará** e exibirá uma mensagem de erro clara:

```
❌ Erro de validação de variáveis de ambiente:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • JWT_SECRET: String must contain at least 32 character(s)
  • COMPANY_INIT: Invalid uuid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Verifique seu arquivo .env e certifique-se de que todas as variáveis obrigatórias estão definidas.
```

### Type Safety

O objeto `env` é totalmente tipado, fornecendo autocomplete e verificação de tipos em tempo de desenvolvimento:

```typescript
// ✅ TypeScript sabe que COMPANY_INIT é uma string
const id: string = env.COMPANY_INIT

// ✅ TypeScript sabe que NODE_ENV é um enum
if (env.NODE_ENV === 'production') {
  // ...
}

// ❌ Erro de compilação - propriedade não existe
const invalid = env.INVALID_VAR
```

## Migração do Código Existente

### Antes (sem validação)

```typescript
// ❌ Sem validação - pode falhar em runtime
const COMPANY_ID = process.env.COMPANY_INIT || ''

// ❌ Fallback vazio para variável crítica
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret'
```

### Depois (com validação)

```typescript
// ✅ Validado e tipado
import { env } from '@/lib/env'

const COMPANY_ID = env.COMPANY_INIT // Garantido ser UUID válido
const JWT_SECRET = env.JWT_SECRET // Garantido ter 32+ caracteres
```

## Testes

Execute os testes unitários:

```bash
npx tsx src/lib/env.test.ts
```

Os testes verificam:

- ✅ Validação de variáveis obrigatórias
- ✅ Validação de formatos (UUID, email, URL)
- ✅ Validação de tamanhos mínimos
- ✅ Aplicação de defaults
- ✅ Rejeição de valores inválidos

## Exemplo de .env

```env
# Obrigatórias
DATABASE_URL=postgresql://user:password@localhost:5432/vinha_admin
COMPANY_INIT=123e4567-e89b-12d3-a456-426614174000
ADMIN_INIT=123e4567-e89b-12d3-a456-426614174001
JWT_SECRET=your-super-secret-jwt-key-with-at-least-32-characters
DEFAULT_PASSWORD=senha123

# Opcionais
NODE_ENV=development
REDIS_URL=redis://localhost:6379

# AWS SES (opcional)
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SES_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SES_FROM_EMAIL=noreply@example.com

# AWS S3 (opcional)
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=my-bucket
```

## Benefícios

1. **Fail Fast**: Erros de configuração são detectados no startup, não em runtime
2. **Type Safety**: TypeScript garante uso correto das variáveis
3. **Documentação**: Schema Zod serve como documentação viva
4. **Validação**: Formatos e tamanhos são validados automaticamente
5. **Defaults Seguros**: Variáveis opcionais têm valores padrão sensatos
6. **Mensagens Claras**: Erros descritivos facilitam debug

## Notas Importantes

- ⚠️ **Nunca** use `process.env` diretamente - sempre use `env` deste módulo
- ⚠️ **Nunca** use fallbacks vazios para variáveis críticas
- ⚠️ Adicione novas variáveis ao schema quando necessário
- ⚠️ Mantenha os testes atualizados ao modificar o schema
