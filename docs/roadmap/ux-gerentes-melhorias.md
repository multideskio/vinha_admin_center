# UX - Melhorias na Experiência do Usuário - Sistema de Gerentes

## 🎯 Objetivo
Aprimorar a experiência do usuário (UX) no sistema de gerentes, tanto na área admin quanto no acesso manager, implementando micro-interações, melhorias de acessibilidade, performance visual e feedback avançado.

## 📋 Escopo
- [ ] Implementar micro-interações avançadas
- [ ] Melhorar acessibilidade (A11Y)
- [ ] Otimizar performance visual
- [ ] Adicionar feedback avançado ao usuário
- [ ] Implementar funcionalidades de UX modernas
- [ ] Manter consistência com o Design System Videira

## 🔧 Implementação

### 1. Micro-interações Avançadas
**Arquivos a modificar:**
- `src/app/admin/gerentes/page.tsx`
- `src/app/admin/gerentes/[id]/page.tsx`
- `src/app/manager/perfil/page.tsx`

**Melhorias:**

#### 1.1 Animações de Entrada/Saída
```typescript
// Adicionar animações Framer Motion para modais
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8, y: -20 }
}

// Animações para cards na listagem
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1 }
  })
}
```

#### 1.2 Hover States Elaborados
```typescript
// Cards com transformações suaves
className="hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"

// Botões com efeitos de ripple
className="relative overflow-hidden before:absolute before:inset-0 before:bg-white/20 before:scale-0 hover:before:scale-100 before:transition-transform before:duration-300"
```

#### 1.3 Loading States com Progress
```typescript
// Progress bar para uploads
const [uploadProgress, setUploadProgress] = useState(0)

// Skeleton com shimmer effect
className="animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer"
```

### 2. Melhorias de Acessibilidade (A11Y)

#### 2.1 Focus Management
```typescript
// Trap focus em modais
import { useFocusTrap } from '@/hooks/use-focus-trap'

// Auto-focus em campos importantes
useEffect(() => {
  if (isOpen && firstInputRef.current) {
    firstInputRef.current.focus()
  }
}, [isOpen])
```

#### 2.2 ARIA Labels Descritivos
```typescript
// Labels mais específicos
aria-label="Editar perfil do gerente João Silva"
aria-describedby="manager-status-description"
role="region"
aria-live="polite" // Para feedback dinâmico
```

#### 2.3 Keyboard Navigation
```typescript
// Navegação por teclado em tabelas
const handleKeyDown = (e: KeyboardEvent, index: number) => {
  switch (e.key) {
    case 'ArrowDown':
      focusRow(index + 1)
      break
    case 'ArrowUp':
      focusRow(index - 1)
      break
    case 'Enter':
      openManagerProfile(managers[index].id)
      break
  }
}
```

### 3. Performance Visual

#### 3.1 Lazy Loading para Avatares
```typescript
// Componente LazyAvatar
const LazyAvatar = ({ src, alt, fallback }: AvatarProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  
  return (
    <div ref={ref} className="relative">
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      {!isLoaded && <Skeleton className="w-full h-full rounded-full" />}
    </div>
  )
}
```

#### 3.2 Virtualization para Listas Grandes
```typescript
// Implementar react-window para listas com 100+ itens
import { FixedSizeList as List } from 'react-window'

const VirtualizedManagerList = ({ managers }: { managers: Manager[] }) => {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <ManagerCard manager={managers[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={managers.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

#### 3.3 Image Optimization
```typescript
// Otimização automática de imagens
const OptimizedAvatar = ({ src, size = 96 }: AvatarProps) => {
  const optimizedSrc = useMemo(() => {
    if (!src) return null
    // Adicionar parâmetros de otimização para S3/CloudFront
    return `${src}?w=${size}&h=${size}&f=webp&q=80`
  }, [src, size])

  return (
    <Image
      src={optimizedSrc || '/placeholder-avatar.webp'}
      alt="Avatar"
      width={size}
      height={size}
      className="rounded-full object-cover"
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    />
  )
}
```

### 4. Feedback Avançado

#### 4.1 Undo Actions
```typescript
// Sistema de undo para exclusões
const useUndoableAction = () => {
  const [undoStack, setUndoStack] = useState<UndoAction[]>([])
  
  const executeWithUndo = async (action: () => Promise<void>, undoAction: () => Promise<void>, description: string) => {
    await action()
    
    toast({
      title: "Ação executada",
      description: (
        <div className="flex items-center justify-between">
          <span>{description}</span>
          <Button size="sm" onClick={() => undoAction()}>
            Desfazer
          </Button>
        </div>
      ),
      duration: 5000
    })
  }
}
```

#### 4.2 Bulk Operations
```typescript
// Seleção múltipla com feedback visual
const [selectedManagers, setSelectedManagers] = useState<Set<string>>(new Set())

const BulkActionBar = ({ selectedCount }: { selectedCount: number }) => (
  <AnimatePresence>
    {selectedCount > 0 && (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg p-4 border"
      >
        <div className="flex items-center gap-4">
          <span className="font-medium">{selectedCount} selecionados</span>
          <Button size="sm" variant="outline">Exportar</Button>
          <Button size="sm" variant="outline">Enviar Mensagem</Button>
          <Button size="sm" variant="destructive">Excluir</Button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
)
```

#### 4.3 Real-time Updates
```typescript
// WebSocket para atualizações em tempo real
const useRealtimeManagers = () => {
  const [managers, setManagers] = useState<Manager[]>([])
  
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!)
    
    ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data)
      
      switch (type) {
        case 'MANAGER_UPDATED':
          setManagers(prev => prev.map(m => 
            m.id === data.id ? { ...m, ...data } : m
          ))
          toast({
            title: "Atualização em tempo real",
            description: `${data.firstName} ${data.lastName} foi atualizado`,
            variant: "info"
          })
          break
      }
    }
    
    return () => ws.close()
  }, [])
  
  return managers
}
```

### 5. Funcionalidades UX Modernas

#### 5.1 Command Palette (⌘K)
```typescript
// Busca global com atalhos
const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput 
        placeholder="Buscar gerentes, ações..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandGroup heading="Gerentes">
          {filteredManagers.map(manager => (
            <CommandItem key={manager.id} onSelect={() => navigateToManager(manager.id)}>
              <UserIcon className="mr-2 h-4 w-4" />
              {manager.firstName} {manager.lastName}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Ações">
          <CommandItem onSelect={() => openCreateModal()}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Gerente
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

#### 5.2 Smart Search com Highlights
```typescript
// Busca inteligente com destaque
const SmartSearch = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      onSearch(searchQuery)
      // Salvar no histórico de busca
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
      if (searchQuery && !history.includes(searchQuery)) {
        localStorage.setItem('searchHistory', JSON.stringify([searchQuery, ...history.slice(0, 4)]))
      }
    }, 300),
    [onSearch]
  )
  
  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          debouncedSearch(e.target.value)
        }}
        placeholder="Buscar por nome, email, CPF..."
        className="pr-10"
      />
      {suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 mt-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
              onClick={() => {
                setQuery(suggestion)
                debouncedSearch(suggestion)
              }}
            >
              <HighlightedText text={suggestion} highlight={query} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

#### 5.3 Contextual Tooltips
```typescript
// Tooltips contextuais com informações úteis
const ContextualTooltip = ({ manager }: { manager: Manager }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={manager.status === 'active' ? 'success' : 'destructive'}>
          {manager.status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-medium">Status do Gerente</p>
          <p className="text-xs text-muted-foreground">
            {manager.status === 'active' 
              ? `Ativo desde ${formatDate(manager.createdAt)}`
              : `Inativo desde ${formatDate(manager.deletedAt)}`
            }
          </p>
          {manager.lastLoginAt && (
            <p className="text-xs text-muted-foreground">
              Último acesso: {formatRelativeTime(manager.lastLoginAt)}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)
```

## ✅ Critérios de Aceitação

### Micro-interações
- [ ] Modais abrem/fecham com animações suaves (300ms)
- [ ] Cards têm hover effects com transformações
- [ ] Loading states mostram progresso real para uploads
- [ ] Transições entre estados são fluidas

### Acessibilidade
- [ ] Focus trap funciona em todos os modais
- [ ] Navegação por teclado funciona em tabelas
- [ ] ARIA labels são descritivos e específicos
- [ ] Screen readers conseguem navegar facilmente

### Performance Visual
- [ ] Avatares carregam apenas quando visíveis (lazy loading)
- [ ] Listas com 100+ itens usam virtualização
- [ ] Imagens são otimizadas automaticamente
- [ ] Não há layout shifts durante carregamento

### Feedback Avançado
- [ ] Ações destrutivas podem ser desfeitas (5s)
- [ ] Seleção múltipla funciona com feedback visual
- [ ] Atualizações em tempo real são mostradas
- [ ] Toasts são informativos e acionáveis

### Funcionalidades Modernas
- [ ] Command Palette (⌘K) funciona globalmente
- [ ] Busca inteligente com sugestões e highlights
- [ ] Tooltips contextuais mostram informações úteis
- [ ] Histórico de ações é mantido

## 🧪 Testes

### Testes de Usabilidade
- [ ] **Teste A/B** - Comparar tempo de conclusão de tarefas antes/depois
- [ ] **Teste de Acessibilidade** - Validar com screen readers
- [ ] **Teste de Performance** - Medir tempo de carregamento e FPS
- [ ] **Teste Mobile** - Validar experiência em dispositivos móveis

### Métricas de Sucesso
- [ ] **Tempo de carregamento** < 2s para listagem de gerentes
- [ ] **Tempo de conclusão** de tarefas reduzido em 30%
- [ ] **Score de acessibilidade** > 95 (Lighthouse)
- [ ] **Satisfação do usuário** > 4.5/5 (pesquisa pós-implementação)

## 📅 Estimativa
- **Tempo:** 3-4 semanas (60-80 horas)
- **Prioridade:** 🟡 Média (Melhoria de UX)
- **Versão:** v0.4.0

## 🔗 Dependências
- **Framer Motion** - Para animações
- **React Window** - Para virtualização
- **cmdk** - Para command palette
- **@radix-ui/react-tooltip** - Para tooltips avançados

## 📚 Referências
- **Design System Videira** - Manter consistência visual
- **WCAG 2.1 AA** - Padrões de acessibilidade
- **Material Design Motion** - Princípios de animação
- **Apple HIG** - Diretrizes de interação

## 📝 Notas de Implementação
- **Implementação incremental** - Uma funcionalidade por vez
- **Testes contínuos** - Validar cada melhoria individualmente
- **Feedback dos usuários** - Coletar opinões durante desenvolvimento
- **Performance monitoring** - Monitorar impacto nas métricas
- **Rollback plan** - Possibilidade de reverter mudanças se necessário

---

**Status:** 📋 PLANEJADO  
**Data:** 2025-01-05  
**Criado por:** Kiro AI

**Próximo passo:** Aguardar aprovação para iniciar implementação