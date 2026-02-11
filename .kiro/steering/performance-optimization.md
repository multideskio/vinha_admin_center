---
inclusion: always
---

# Otimização de Performance

## Princípios de Performance

### 1. Next.js Optimizations

- Usar Server Components por padrão
- Implementar Suspense para streaming
- Lazy load componentes pesados com dynamic()
- Otimizar imagens com next/image
- Configurar cache apropriadamente

### 2. Database Performance

- Evitar N+1 queries (usar `with` do Drizzle)
- Implementar paginação em listas grandes
- Criar índices em colunas de busca
- Usar agregações no banco, não em memória
- Implementar cache para queries frequentes

### 3. Bundle Size

- Usar dynamic imports para code splitting
- Remover dependências não utilizadas
- Usar tree-shaking apropriadamente
- Analisar bundle com `npm run build`

### 4. Rendering Performance

- Usar React.memo para componentes pesados
- Implementar virtualização para listas longas
- Evitar re-renders desnecessários
- Usar useCallback e useMemo quando apropriado

## Metas de Performance

- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms
