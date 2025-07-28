# 📄 Documentação do Frontend - Vinha Admin Center

Este documento detalha a arquitetura, tecnologias e estrutura do frontend da aplicação Vinha Admin Center.

## ✨ Tecnologias Principais

*   **Framework:** [Next.js](https://nextjs.org/) (com App Router)
*   **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Framework:** [React](https://reactjs.org/)
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
├── components
│   ├── layout        # Componentes de layout (Sidebars, Header)
│   └── ui            # Componentes da biblioteca ShadCN/UI
├── hooks             # Hooks customizados (ex: use-toast)
└── lib               # Utilitários e funções auxiliares (ex: cn)
```

### Principais Diretórios

*   **`src/app/[role]`**: Cada diretório dentro de `app` (como `admin`, `gerente`, etc.) representa um perfil de usuário diferente e contém seu próprio `layout.tsx` e sub-rotas. Isso permite criar painéis totalmente isolados e customizados para cada tipo de acesso.
*   **`src/app/auth`**: Contém todas as páginas relacionadas à autenticação, como login, criação de conta e recuperação de senha. Utiliza um layout próprio (`layout.tsx`) com design de duas colunas.
*   **`src/components/layout`**: Armazena componentes de estrutura principal, como as sidebars de navegação para cada perfil de usuário (`AppSidebar`, `ManagerSidebar`, etc.).
*   **`src/components/ui`**: Contém os componentes base da interface, como `Button`, `Card`, `Input`, `Table`, etc., fornecidos pela biblioteca ShadCN/UI.

---

## 🎨 Estilização e Tema

*   **Tailwind CSS:** A estilização é feita primariamente com classes utilitárias do Tailwind CSS.
*   **Variáveis CSS:** As cores do tema (primária, secundária, fundo, etc.) são definidas como variáveis CSS no arquivo `src/app/globals.css`, permitindo a fácil customização do tema e suporte a modo escuro (`dark mode`).
*   **Responsividade:** O layout é construído com um foco "mobile-first". Classes de breakpoint do Tailwind (`sm`, `md`, `lg`) são usadas para adaptar a interface a diferentes tamanhos de tela.

---

## 🔗 Fluxo de Autenticação

1.  O usuário acessa a raiz do site e é redirecionado para `/auth/login`.
2.  A partir da página de login, ele pode navegar para:
    *   `/auth/nova-conta` para se cadastrar como Pastor ou Igreja.
    *   `/auth/recuperar-senha` para iniciar o processo de recuperação de senha.
3.  O layout de autenticação (`src/app/auth/layout.tsx`) provê uma estrutura visual consistente para todas essas páginas.

Esta documentação deve ser mantida atualizada conforme novas funcionalidades e estruturas são adicionadas ao projeto.
