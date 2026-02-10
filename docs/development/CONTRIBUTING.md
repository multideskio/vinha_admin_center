# 🤝 Guia de Desenvolvimento - Equipe Interna

Guia para desenvolvedores da equipe **Multidesk.io** trabalhando no **Vinha Admin Center**.

## 📋 Como Contribuir

### 🐛 Reportando Bugs

1. Verifique se o bug já foi reportado nas [Issues](https://github.com/multideskio/vinha_admin_center/issues)
2. Use o template de **Bug Report**
3. Inclua informações detalhadas sobre o ambiente
4. Adicione screenshots se aplicável

### ✨ Sugerindo Funcionalidades

1. Verifique se a funcionalidade já foi sugerida
2. Use o template de **Feature Request**
3. Descreva casos de uso específicos
4. Considere o impacto nos usuários existentes

### 🔄 Enviando Pull Requests

1. **Fork** o repositório
2. Crie uma **branch** para sua funcionalidade (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um **Pull Request**

## 📝 Padrões de Código

### Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige bug específico
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudança de funcionalidade
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

### Código

- **ESLint** e **Prettier** configurados
- **TypeScript** obrigatório
- Testes para novas funcionalidades
- Documentação atualizada

## 🧪 Verificação de Qualidade

```bash
# Instalar dependências
npm install

# Executar linting
npm run lint

# Verificar tipos
npm run typecheck

# Build do projeto
npm run build
```

## 📚 Estrutura do Projeto

```
src/
├── app/           # Next.js App Router
├── components/    # Componentes reutilizáveis
├── lib/          # Utilitários e configurações
├── db/           # Schema e configuração do banco
└── hooks/        # Custom hooks

docs/             # Documentação
├── CHANGELOG.md  # Histórico de versões
├── ROADMAP.md    # Planejamento futuro
└── *.md         # Guias técnicos
```

## 🎯 Prioridades Atuais

Veja nosso [ROADMAP.md](docs/ROADMAP.md) para funcionalidades planejadas.

### Alta Prioridade

- Testes automatizados
- Melhorias de performance
- Acessibilidade

### Média Prioridade

- Novas integrações
- Funcionalidades avançadas
- Melhorias de UX

## 💬 Comunicação Interna

- **Issues:** Para bugs e funcionalidades (equipe interna)
- **Email:** dev-team@multidesk.io
- **Segurança:** security@multidesk.io

## 🔒 Confidencialidade

- Todo código é **propriedade da Multidesk.io**
- **NÃO compartilhar** código fora da equipe
- Seguir políticas de **NDA** da empresa
- Reportar vazamentos imediatamente

## 📄 Direitos Autorais

Todo trabalho desenvolvido é propriedade exclusiva da **Multidesk.io** conforme contrato de trabalho.

---

**Desenvolvimento profissional para a equipe Multidesk.io** 🚀
