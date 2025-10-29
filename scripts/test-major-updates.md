# 🧪 Testando Major Updates

## ⚠️ Updates que precisam de teste cuidadoso:

### 1. **Zod 3.x → 4.x**
- **Risco:** Alto - Breaking changes na API
- **Teste:** Verificar todos os schemas de validação
- **Arquivos:** Procurar por `z.` no código

### 2. **Next.js 15.x → 16.x**  
- **Risco:** Muito Alto - Mudanças no App Router
- **Teste:** Build completo + teste manual
- **Arquivos:** Toda a estrutura `src/app/`

### 3. **React Day Picker 8.x → 9.x**
- **Risco:** Médio - Mudanças na API
- **Teste:** Testar calendários e date pickers
- **Arquivos:** Componentes que usam calendário

### 4. **Lint-staged 15.x → 16.x**
- **Risco:** Baixo - Configuração pode mudar
- **Teste:** Testar pre-commit hooks

## 🔧 Como testar:

1. **Criar branch de teste:**
   ```bash
   git checkout -b test-major-updates
   ```

2. **Mergear UMA PR por vez**

3. **Testar localmente:**
   ```bash
   npm install
   npm run build
   npm run typecheck
   npm run lint
   ```

4. **Se funcionar:** Mergear na main
5. **Se quebrar:** Reverter e investigar

## 💡 Recomendação:

**DEIXAR POR ÚLTIMO:**
- Next.js 16.x (muito arriscado)
- Zod 4.x (pode quebrar validações)

**TESTAR PRIMEIRO:**
- React Day Picker
- Lint-staged