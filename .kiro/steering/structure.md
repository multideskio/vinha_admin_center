---
inclusion: always
---

# Estrutura do Projeto - Vinha Admin Center

## Estrutura de Diretórios

```
src/
├── app/
│   ├── admin/          # Dashboard admin completo
│   ├── manager/        # Supervisão de rede
│   ├── supervisor/     # Gestão regional
│   ├── pastor/         # Conta pessoal
│   ├── igreja/         # Conta da igreja
│   └── api/v1/         # Endpoints versionados
├── components/
│   ├── contributions/  # Sistema de pagamentos
│   └── ui/             # shadcn/ui components
├── db/
│   └── schema.ts       # Schema Drizzle
├── lib/                # Utilitários e integrações
└── hooks/              # Custom hooks
```

## Convenções de Nomenclatura

- **Páginas**: `kebab-case` (ex: `nova-conta/`)
- **Componentes**: `PascalCase.tsx` (ex: `ContributionForm.tsx`)
- **Utilitários**: `kebab-case.ts` (ex: `api-error-handler.ts`)
- **Hooks**: `use-kebab-case.ts` (ex: `use-upload.ts`)
- **Tabelas DB**: `snake_case` (ex: `church_accounts`)
- **Colunas**: `camelCase` no TS, `snake_case` no SQL
