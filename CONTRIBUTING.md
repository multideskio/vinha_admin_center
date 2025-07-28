# Constituição e Guia de Contribuição do Projeto

Este documento estabelece as diretrizes, regras e boas práticas a serem seguidas durante o desenvolvimento do projeto **Vinha Admin Center**. É fundamental que este guia seja consultado antes de qualquer alteração no código para garantir a consistência, segurança e manutenibilidade do sistema.

## 📜 Princípios Fundamentais

1.  **Segurança em Primeiro Lugar:** A proteção de dados e credenciais é a maior prioridade.
2.  **Consistência é a Chave:** Manter um padrão de código, estrutura de arquivos e design de interface consistente em toda a aplicação.
3.  **Foco no Mobile:** A experiência em dispositivos móveis deve ser tão boa, ou melhor, quanto a de desktop. Todos os layouts devem ser responsivos.
4.  **Documentação Clara:** O código e as funcionalidades devem ser bem documentados para facilitar a manutenção e a colaboração.
5.  **Componentização:** Priorizar a criação de componentes reutilizáveis para manter o código limpo (DRY - Don't Repeat Yourself).

---

## 🔑 Gerenciamento de Variáveis de Ambiente

A segurança das credenciais é crítica. Siga estritamente as regras abaixo.

1.  **NÃO APAGUE `.env` e `.env.local`:** Se precisar adicionar novas variáveis, adicione-as ao final dos arquivos. Nunca remova ou altere as variáveis existentes sem discussão prévia, pois elas podem estar em uso.

2.  **Mantenha o Backup Sincronizado:** Sempre que criar ou alterar uma variável no `.env`, adicione a mesma variável (com um valor de exemplo ou vazio) ao arquivo `.env.backup`. Isso garante que a estrutura de configuração seja preservada.

3.  **Atualize o Exemplo:** Para cada variável adicionada ao `.env`, adicione sua definição (sem a chave secreta) ao arquivo `.env.example`. Isso ajuda outros desenvolvedores a configurarem seus ambientes locais.
    *   **Exemplo:** Se adicionou `CIELO_API_KEY="secret-key"`, adicione `CIELO_API_KEY=` ao `.env.example`.

4.  **NUNCA CODIFIQUE CREDENCIAIS:** Jamais coloque chaves de API, senhas ou qualquer informação sensível diretamente no código-fonte. O código será hospedado no GitHub e expor credenciais é uma falha de segurança grave. Utilize sempre as variáveis de ambiente.

---

## 📚 Documentação e Versionamento

5.  **Atualize a Documentação:** Após implementar uma nova funcionalidade ou fazer uma alteração significativa, descreva o que foi feito de forma clara. Crie ou atualize os arquivos de documentação relevantes, separando as notas do frontend e do backend, se necessário.

6.  **Gerencie o CHANGELOG:** Mantenha um arquivo `CHANGELOG.md` (a ser criado) para registrar todas as mudanças importantes.
    *   **Versionamento:** Siga o versionamento semântico (Ex: `1.2.3`).
    *   **Aumento de Versão:** Mude a versão do sistema sempre que houver mudanças significativas.
    *   **Restrição:** **NUNCA** avance para a versão `2.0.0` sem o consentimento explícito do proprietário do projeto.

---

## 💻 Diretrizes de Desenvolvimento

### Estilo de Código e Linting

*   **Padrão de Código:** Siga as configurações de linting e formatação já estabelecidas no projeto (`ESLint`, `Prettier`).
*   **Consistência:** Mantenha o estilo de nomenclatura (camelCase para variáveis e funções, PascalCase para componentes e tipos) e a estrutura de arquivos.

### Estrutura de Arquivos

*   **Rotas:** Utilize a `App Router` do Next.js.
*   **Componentes:** Crie componentes reutilizáveis em `src/components/`. Separe componentes de UI (interface pura) em `src/components/ui/`.
*   **Lógica de Negócio:** Isole a lógica de busca de dados, manipulação de estado e chamadas de API em hooks (`src/hooks/`) ou serviços (`src/services/`) sempre que possível.

### Fluxo de Trabalho (Git)

*   **Branches:** Crie uma nova *feature branch* a partir da `main` para cada nova funcionalidade ou correção (ex: `feature/login-page` ou `fix/sidebar-bug`).
*   **Commits:** Escreva mensagens de commit claras e concisas, explicando *o quê* e *porquê* da mudança.
*   **Pull Requests (PRs):** Ao concluir o trabalho, abra um Pull Request para a branch `main`. Descreva as mudanças detalhadamente no PR.

### Testes

*   **Prioridade:** Embora não implementado ainda, a criação de testes unitários e de integração é uma prioridade futura para garantir a estabilidade do sistema. Novas funcionalidades complexas devem, idealmente, vir acompanhadas de testes.
