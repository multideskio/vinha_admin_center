---
inclusion: manual
---

# Padrões de Documentação

## Estrutura de Documentação

### 1. README de Funcionalidade

Cada funcionalidade complexa deve ter um README explicando:

```markdown
# Nome da Funcionalidade

## Visão Geral

Breve descrição do que a funcionalidade faz.

## Como Usar

Exemplos práticos de uso.

## Arquitetura

Diagrama ou explicação da estrutura.

## Configuração

Variáveis de ambiente e configurações necessárias.

## Troubleshooting

Problemas comuns e soluções.
```

### 2. Comentários em Código

```typescript
/**
 * Processa pagamento via Cielo
 *
 * @param paymentData - Dados do pagamento
 * @param paymentData.amount - Valor em centavos
 * @param paymentData.method - Método de pagamento
 * @returns Resultado do processamento
 * @throws {ValidationError} Se dados inválidos
 * @throws {PaymentError} Se pagamento falhar
 *
 * @example
 * const result = await processPayment({
 *   amount: 10000, // R$ 100,00
 *   method: 'credit_card'
 * });
 */
export async function processPayment(paymentData: PaymentData) {
  // Implementação
}
```

### 3. Changelog

Manter CHANGELOG.md atualizado:

```markdown
# Changelog

## [0.3.0] - 2025-02-11

### Adicionado

- Sistema de notificações automáticas
- Dashboard com KPIs em tempo real

### Corrigido

- N+1 queries no dashboard
- Validação de upload de arquivos

### Alterado

- Migração para Next.js 15
```

### 4. API Documentation

```typescript
/**
 * POST /api/users
 *
 * Cria um novo usuário no sistema
 *
 * Body:
 * {
 *   "name": "string",
 *   "email": "string",
 *   "role": "admin" | "manager" | "supervisor" | "pastor" | "igreja"
 * }
 *
 * Response 200:
 * {
 *   "success": true,
 *   "data": { "id": "string", ... }
 * }
 *
 * Response 400:
 * {
 *   "success": false,
 *   "error": "string"
 * }
 */
```

## Quando Documentar

- Funções públicas e exportadas
- APIs e endpoints
- Configurações complexas
- Decisões arquiteturais importantes
- Workarounds e soluções não óbvias
- Integrações com serviços externos
