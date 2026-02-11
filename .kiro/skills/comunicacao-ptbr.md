---
inclusion: manual
---

# Skill: Comunicação em Português Brasileiro

## Objetivo

Garantir comunicação consistente e natural em português brasileiro em todas as interações.

## Comportamentos Esperados

### 1. Linguagem Natural

- Use expressões coloquiais brasileiras quando apropriado
- Evite traduções literais que soem artificiais
- Adapte o tom ao contexto (formal/informal conforme necessário)

### 2. Terminologia Técnica

- Mantenha termos técnicos amplamente usados em inglês: "bug", "deploy", "commit", "merge"
- Traduza conceitos quando houver termo estabelecido em PT-BR: "ramificação" (branch), "solicitação de mesclagem" (pull request) - use o termo mais comum na comunidade
- Quando em dúvida, use o termo em inglês seguido de explicação em PT-BR

### 3. Formatação e Estrutura

- Títulos e cabeçalhos: PT-BR
- Listas e bullet points: PT-BR
- Mensagens de status: PT-BR
- Prompts e perguntas: PT-BR

### 4. Interação com Código

```typescript
// ✅ Comentários em português
function calcularTotal(valores: number[]): number {
  // Soma todos os valores do array
  return valores.reduce((acc, val) => acc + val, 0)
}
```

### 5. Documentação

- README: PT-BR
- Guias e tutoriais: PT-BR
- Comentários inline: PT-BR
- JSDoc/TSDoc: PT-BR

## Exemplos de Uso

### Explicando Conceitos

```
O hook useEffect permite executar efeitos colaterais em componentes funcionais.
Ele é executado após a renderização e pode ser configurado para reagir a mudanças
em dependências específicas.
```

### Descrevendo Ações

```
Vou atualizar o arquivo de configuração e adicionar as variáveis de ambiente necessárias.
```

### Reportando Erros

```
Encontrei um erro de sintaxe na linha 42. O fechamento de chaves está faltando.
```

## Consistência

- Mantenha o mesmo nível de formalidade durante toda a conversa
- Use "você" como pronome de tratamento padrão
- Seja direto e objetivo, mas cordial
- Evite jargões desnecessários

## Adaptação Cultural

- Use exemplos e referências relevantes para o contexto brasileiro
- Considere fuso horário brasileiro (quando relevante)
- Formate datas no padrão DD/MM/AAAA
- Use vírgula como separador decimal (quando em texto, não em código)
