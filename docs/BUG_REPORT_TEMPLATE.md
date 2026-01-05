# 🐛 Bug Report Template

Use este template para reportar bugs identificados no projeto.

---

## Bug ID

**#[Número]** - [Título Curto do Bug]

---

## 📊 Informações Básicas

**Status:** ❌ NÃO RESOLVIDO / ✅ RESOLVIDO  
**Prioridade:** 🔴 CRÍTICA / 🟡 MÉDIA / 🟢 BAIXA  
**Descoberto em:** YYYY-MM-DD  
**Resolvido em:** YYYY-MM-DD (se aplicável)

**Arquivos Afetados:**

- `caminho/para/arquivo.ts` (linha XX-YY)
- `caminho/para/outro.ts` (linha ZZ)

**Responsável:** @username ou "A ser atribuído"

---

## 📝 Descrição

[Descreva claramente o problema. O que está acontecendo de errado?]

---

## 🔍 Código Problemático

```typescript
// Mostrar o código com problema
// Adicionar comentários ❌ indicando a parte problemática
```

---

## 💥 Impacto

**Severidade:** [Alta/Média/Baixa]

**Consequências:**

- [ ] Quebra funcionalidade crítica
- [ ] Dados podem ser perdidos/corrompidos
- [ ] Vulnerabilidade de segurança
- [ ] Performance degradada
- [ ] UX ruim
- [ ] Outro: [especificar]

**Descrição do Impacto:**
[Explique como este bug afeta o sistema e os usuários]

---

## 🎯 Causa Raiz

**Análise Técnica:**
[Explique POR QUE o bug acontece. Qual é a causa técnica?]

**Exemplo:**

- Lógica invertida (usando `lte` em vez de `gte`)
- Falta validação de entrada
- Configuração incorreta
- Dependência incompatível
- etc.

---

## ✅ Solução Proposta

### Opção 1 (Recomendada)

```typescript
// Código corrigido
// Adicionar comentários ✅ indicando as melhorias
```

**Por que funciona:**
[Explique por que esta solução resolve o problema]

**Prós:**

- [Listar vantagens]

**Contras:**

- [Listar desvantagens, se houver]

### Opção 2 (Alternativa)

[Se houver solução alternativa]

---

## 🔧 Passos para Resolver

- [ ] Passo 1: [descrição]
- [ ] Passo 2: [descrição]
- [ ] Passo 3: [descrição]
- [ ] Testar em desenvolvimento
- [ ] Testar em staging
- [ ] Code review
- [ ] Deploy para produção
- [ ] Atualizar documentação

---

## 🧪 Como Testar

### Pré-requisitos

- [O que é necessário para reproduzir]

### Passos para Reproduzir

1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

### Comportamento Atual (Bugado)

[O que acontece atualmente]

### Comportamento Esperado (Correto)

[O que deveria acontecer]

---

## 🔗 Referências

**Issues Relacionados:**

- #[número] - [descrição]

**Pull Requests:**

- #[número] - [descrição]

**Documentação:**

- [Link para doc relevante]

**Discussões:**

- [Link para discussão relevante]

---

## 📸 Screenshots/Logs (se aplicável)

```
[Colar logs de erro]
```

ou

![Screenshot](link-para-imagem)

---

## 💬 Notas Adicionais

[Qualquer informação adicional relevante]

---

## ✅ Checklist de Resolução

Marcar quando completar:

- [ ] Bug reproduzido em ambiente local
- [ ] Causa raiz identificada
- [ ] Solução implementada
- [ ] Testes adicionados (se aplicável)
- [ ] Code review aprovado
- [ ] Testes manuais passaram
- [ ] Testes automatizados passaram (se houver)
- [ ] Deploy em staging realizado
- [ ] Validação em staging OK
- [ ] Deploy em produção realizado
- [ ] Validação em produção OK
- [ ] Documentação atualizada
- [ ] `KNOWN_BUGS.md` atualizado
- [ ] `.cursorrules` atualizado (se aplicável)
- [ ] Issue fechado

---

**Criado por:** @username  
**Data:** YYYY-MM-DD  
**Última atualização:** YYYY-MM-DD
