# 📄 Documentação do Frontend - Vinha Admin Center

Este documento detalha a arquitetura, tecnologias e estrutura do frontend da aplicação Vinha Admin Center.

## ✨ Tecnologias Principais

*   **Framework:** [Next.js](https://nextjs.org/) (com App Router)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Framework:** [React](https://reactjs.org/)
*   **Autenticação:** [Lucia Auth](https://lucia-auth.com/) para gerenciamento de sessões no lado do servidor.
*   **Comunicação com Backend:** **API RESTful**. O frontend utiliza `fetch` (principalmente dentro de hooks como `useEffect`) para se comunicar com os endpoints da API do Next.js localizados em `src/app/api/v1/`.
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
│   ├── api           # Endpoints da API RESTful (backend)
│   │   └── v1
│   │       └── regioes
│   ├── admin         # Layout e páginas do painel de Administrador
│   ├── auth          # Layout e páginas de autenticação (login, cadastro, etc.)
│   ├── gerente       # Layout e páginas do painel de Gerente
│   └── ...           # Outros painéis de perfil
├── actions           # Server Actions (usadas primariamente para autenticação)
├── components
│   ├── layout        # Componentes de layout (Sidebars, Header)
│   └── ui            # Componentes da biblioteca ShadCN/UI
├── hooks             # Hooks customizados (ex: use-toast)
└── lib               # Utilitários, configurações (auth.ts) e funções auxiliares (cn)
```

### Principais Diretórios

*   **`src/app/[role]`**: Cada diretório dentro de `app` (como `admin`, `gerente`, etc.) representa um perfil de usuário diferente e contém seu próprio `layout.tsx` e sub-rotas.
*   **`src/app/api`**: Contém os *Route Handlers* que formam a API RESTful do backend. É a principal fonte de dados para as páginas do cliente.
*   **`src/app/auth`**: Contém todas as páginas relacionadas à autenticação.
*   **`src/actions`**: Armazena as Server Actions. Com a migração para a API REST, seu uso principal se concentra em operações específicas como o fluxo de login (`loginUser`) e logout (`logoutUser`).
*   **`src/lib/auth.ts`**: Arquivo central de configuração do Lucia Auth, responsável por definir o adaptador, a estratégia de sessão e a validação de requisições.

---

## 🎨 Estilização e Tema

*   **Tailwind CSS:** A estilização é feita primariamente com classes utilitárias do Tailwind CSS.
*   **Variáveis CSS:** As cores do tema (primária, secundária, fundo, etc.) são definidas como variáveis CSS no arquivo `src/app/globals.css`, permitindo a fácil customização do tema e suporte a modo escuro (`dark mode`).
*   **Responsividade:** O layout é construído com um foco "mobile-first". Classes de breakpoint do Tailwind (`sm`, `md`, `lg`) são usadas para adaptar a interface a diferentes tamanhos de tela.

---

## 🔗 Fluxo de Autenticação

1.  O usuário acessa a página de login (`/auth/login`).
2.  O formulário (`LoginPage`) chama a Server Action `loginUser`.
3.  A ação `loginUser` executa no servidor:
    *   Valida os dados de entrada.
    *   Verifica o usuário e a senha no banco.
    *   Se as credenciais forem válidas, cria uma sessão com `lucia.createSession()` e define o cookie de sessão no navegador.
    *   Retorna um objeto de sucesso com o `role` do usuário.
4.  O frontend recebe a resposta e redireciona o usuário para o dashboard apropriado (ex: `/admin/dashboard`).
5.  Em cada painel (`/admin`, `/gerente`, etc.), o `layout.tsx` principal usa a função `validateRequest` de `lucia` para verificar a sessão. Durante o desenvolvimento, o redirecionamento em caso de falha foi removido para agilizar o trabalho, mas os dados do usuário (nome, email) são carregados e exibidos se a sessão for válida.

---

## 🔄 Comunicação com o Backend

A aplicação utiliza uma abordagem híbrida:

1.  **API REST (Preferencial):** Para a maioria das operações CRUD (Criar, Ler, Atualizar, Deletar), o frontend faz chamadas `fetch` para os endpoints da API REST em `src/app/api/v1/`. Isso é feito dentro de componentes do cliente, geralmente com `useEffect`.
    *   **Exemplo:** A página de Regiões (`/admin/regioes`) busca e manipula dados exclusivamente através do endpoint `/api/v1/regioes`.

2.  **Server Actions (Para Casos Específicos):** São usadas para funcionalidades onde uma chamada de procedimento remoto (RPC) do cliente para o servidor é mais direta, como no processo de login e logout.

Esta documentação deve ser mantida atualizada conforme novas funcionalidades e estruturas são adicionadas ao projeto.
