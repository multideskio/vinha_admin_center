---
inclusion: manual
---

# Padrões de Commit Git

## Formato de Commit

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

## Tipos de Commit

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações na documentação
- `style`: Formatação, ponto e vírgula, etc
- `refactor`: Refatoração de código
- `perf`: Melhorias de performance
- `test`: Adição ou correção de testes
- `chore`: Tarefas de manutenção

## Exemplos

```bash
feat(auth): adicionar autenticação JWT

Implementa sistema de autenticação com JWT
- Cookies httpOnly e secure
- Middleware de proteção de rotas
- Refresh token automático

Closes #123
```

```bash
fix(dashboard): corrigir N+1 queries

Otimiza queries do dashboard usando relações do Drizzle
Reduz de 200+ queries para 3 queries

Performance: 98% mais rápido
```

```bash
docs(readme): atualizar instruções de instalação
```

## Regras

- Usar português brasileiro
- Primeira linha com no máximo 72 caracteres
- Usar imperativo ("adicionar" não "adicionado")
- Corpo do commit opcional mas recomendado
- Referenciar issues quando aplicável
