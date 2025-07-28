# 📄 Documentação do Frontend - Vinha Admin Center

Este documento detalha a arquitetura, tecnologias e estrutura do frontend da aplicação Vinha Admin Center.

## ✨ Tecnologias Principais

*   **Framework:** [Next.js](https://nextjs.org/) (com App Router)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Framework:** [React](https://reactjs.org/)
*   **Autenticação:** [Lucia Auth](https://lucia-auth.com/) para gerenciamento de sessões no lado do servidor.
*   **Comunicação com Backend:** [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) para chamadas seguras de API.
*   **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
*   **Componentes:** [ShadCN/UI](https://ui.shadcn.com/) - Uma coleção de componentes reutilizáveis e acessíveis.
*   **Ícones:** [Lucide React](https://lucide.dev/)
*   **Gráficos:** [Recharts](https://recharts.org/)
*   **Formulários:** [React Hook Form](https://react-hook-form.com/) com [Zod](https://zod.dev/) para validação.

---

## 📂 Estrutura de Arquivos

A estrutura de pastas segue as convenções do Next.js App Router para uma organização clara e escalável.

```
src
├── app
│   ├── admin         # Layout e páginas do painel de Administrador
│   ├── auth          # Layout e páginas de autenticação (login, cadastro, etc.)
│   ├── gerente       # Layout e páginas do painel de Gerente
│   ├── igreja        # Layout e páginas do painel da Igreja
│   ├── pastor        # Layout e páginas do painel do Pastor
│   ├── supervisor    # Layout e páginas do painel do Supervisor
│   ├── globals.css   # Estilos globais e variáveis de tema (Tailwind)
│   └── layout.tsx    # Layout raiz da aplicação
├── actions           # Server Actions para comunicação com o backend
├── components
│   ├── layout        # Componentes de layout (Sidebars, Header)
│   └── ui            # Componentes da biblioteca ShadCN/UI
├── hooks             # Hooks customizados (ex: use-toast)
└── lib               # Utilitários, configurações (auth.ts) e funções auxiliares (cn)
```

### Principais Diretórios

*   **`src/app/[role]`**: Cada diretório dentro de `app` (como `admin`, `gerente`, etc.) representa um perfil de usuário diferente e contém seu próprio `layout.tsx` e sub-rotas. Isso permite criar painéis totalmente isolados e customizados para cada tipo de acesso.
*   **`src/app/auth`**: Contém todas as páginas relacionadas à autenticação. O `layout.tsx` provê uma estrutura visual consistente para login, cadastro e recuperação de senha.
*   **`src/actions`**: Armazena as Server Actions, que são funções assíncronas executadas no servidor. Elas são responsáveis por toda a lógica de negócio, como autenticar usuários e interagir com o banco de dados.
*   **`src/lib/auth.ts`**: Arquivo central de configuração do Lucia Auth, responsável por definir o adaptador, a estratégia de sessão e a validação de requisições.

---

## 🎨 Estilização e Tema

*   **Tailwind CSS:** A estilização é feita primariamente com classes utilitárias do Tailwind CSS.
*   **Variáveis CSS:** As cores do tema (primária, secundária, fundo, etc.) são definidas como variáveis CSS no arquivo `src/app/globals.css`, permitindo a fácil customização do tema e suporte a modo escuro (`dark mode`).
*   **Responsividade:** O layout é construído com um foco "mobile-first". Classes de breakpoint do Tailwind (`sm`, `md`, `lg`) são usadas para adaptar a interface a diferentes tamanhos de tela.

---

## 🔗 Fluxo de Autenticação

1.  O usuário acessa uma rota protegida e, se não estiver logado, é redirecionado para `/auth/login`.
2.  Na página de login, o formulário (`LoginPage`) utiliza `react-hook-form` para gerenciar o estado e a validação.
3.  Ao submeter, o formulário chama a Server Action `loginUser` (`src/actions/auth.ts`).
4.  A ação `loginUser` executa no servidor:
    *   Valida os dados com Zod.
    *   Busca o usuário no banco de dados.
    *   Compara o hash da senha usando `bcrypt`.
    *   Se as credenciais forem válidas, cria uma sessão com `lucia.createSession()`.
    *   Define o cookie de sessão no navegador.
    *   Retorna um objeto de sucesso com o `role` do usuário.
5.  O frontend recebe a resposta de sucesso e usa o `role` para redirecionar o usuário para o dashboard apropriado (ex: `/admin/dashboard`).
6.  Em cada requisição subsequente a páginas protegidas, o `layout.tsx` do respectivo painel utiliza a função `validateRequest` de `lucia` para verificar a validade da sessão através do cookie.

Esta documentação deve ser mantida atualizada conforme novas funcionalidades e estruturas são adicionadas ao projeto.
