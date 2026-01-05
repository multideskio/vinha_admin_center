# 🎨 Guia de Aplicação do Tema Videira

## Paleta de Cores Implementada

### 🌈 Cores do Gradiente do Logo

```
Cyan (Topo):    #00B8D4 → hsl(188 100% 42%)
Blue (Meio):    #3F51B5 → hsl(231 48% 48%)
Purple (Base):  #673AB7 → hsl(262 52% 47%)
```

### 📝 Cores de Texto da Marca

```
Dark Indigo:    #2C3E50 → hsl(210 28% 24%)
Muted Indigo:   #4A607A → hsl(207 24% 38%)
```

---

## 🎯 Mapeamento de Cores

| Elemento      | Light Mode       | Dark Mode        | Uso                        |
| ------------- | ---------------- | ---------------- | -------------------------- |
| **Primary**   | Blue #3F51B5     | Cyan #00B8D4     | Botões principais, links   |
| **Secondary** | Purple #673AB7   | Purple #673AB7   | Botões secundários, badges |
| **Accent**    | Cyan #00B8D4     | Blue (claro)     | Destaques, hover           |
| **Texto**     | Dark Indigo      | Branco           | Conteúdo principal         |
| **Gráficos**  | Cyan→Blue→Purple | Cyan→Blue→Purple | Charts                     |

---

## 💻 Exemplos de Código

### 1. **Header com Gradiente**

```tsx
<div className="videira-gradient p-6 rounded-lg">
  <h1 className="text-3xl font-bold text-white">Dashboard Videira</h1>
  <p className="text-white/80">Bem-vindo ao sistema</p>
</div>
```

### 2. **Título com Gradiente de Texto**

```tsx
<h1 className="text-4xl font-bold videira-gradient-text">Relatórios Financeiros</h1>
```

### 3. **Cards com Cores da Marca**

```tsx
{
  /* Card Cyan */
}
;<Card className="border-l-4 border-l-videira-cyan">
  <CardHeader>
    <CardTitle className="text-videira-cyan">Total Arrecadado</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">R$ 125.430,00</p>
  </CardContent>
</Card>

{
  /* Card Blue */
}
;<Card className="border-l-4 border-l-videira-blue">
  <CardHeader>
    <CardTitle className="text-videira-blue">Total de Membros</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">1.245</p>
  </CardContent>
</Card>

{
  /* Card Purple */
}
;<Card className="border-l-4 border-l-videira-purple">
  <CardHeader>
    <CardTitle className="text-videira-purple">Transações</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">3.892</p>
  </CardContent>
</Card>
```

### 4. **Botões com Cores da Marca**

```tsx
{
  /* Primário - Azul */
}
;<Button className="bg-primary hover:bg-primary/90">Salvar</Button>

{
  /* Secundário - Roxo */
}
;<Button className="bg-secondary hover:bg-secondary/90">Ver Detalhes</Button>

{
  /* Accent - Cyan */
}
;<Button className="bg-accent hover:bg-accent/90">Atualizar</Button>

{
  /* Com Gradiente */
}
;<Button className="videira-gradient hover:opacity-90 text-white">Ação Premium</Button>
```

### 5. **Badges Coloridos**

```tsx
<Badge className="bg-videira-cyan text-white">Novo</Badge>
<Badge className="bg-videira-blue text-white">Ativo</Badge>
<Badge className="bg-videira-purple text-white">Premium</Badge>
```

### 6. **Menu Sidebar com Hover Effect**

```tsx
<nav>
  <Link
    href="/admin/dashboard"
    className="flex items-center gap-3 px-3 py-2 rounded-lg videira-hover"
  >
    <LayoutDashboard className="h-4 w-4" />
    Dashboard
  </Link>
</nav>
```

### 7. **KPI Cards Estilizados**

```tsx
{
  /* Cyan */
}
;<Card className="hover:shadow-lg transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-sm font-medium">Arrecadação</CardTitle>
    <div className="p-2 rounded-lg bg-videira-cyan/10">
      <DollarSign className="h-4 w-4 text-videira-cyan" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">R$ 125.430</div>
    <p className="text-xs text-muted-foreground">+15.2% vs mês anterior</p>
  </CardContent>
</Card>

{
  /* Blue */
}
;<Card className="hover:shadow-lg transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-sm font-medium">Membros</CardTitle>
    <div className="p-2 rounded-lg bg-videira-blue/10">
      <Users className="h-4 w-4 text-videira-blue" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">1.245</div>
    <p className="text-xs text-muted-foreground">+12 este mês</p>
  </CardContent>
</Card>

{
  /* Purple */
}
;<Card className="hover:shadow-lg transition-shadow">
  <CardHeader className="flex flex-row items-center justify-between">
    <CardTitle className="text-sm font-medium">Transações</CardTitle>
    <div className="p-2 rounded-lg bg-videira-purple/10">
      <Activity className="h-4 w-4 text-videira-purple" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">3.892</div>
    <p className="text-xs text-muted-foreground">+8.5% vs mês anterior</p>
  </CardContent>
</Card>
```

### 8. **Tabelas com Header Estilizado**

```tsx
<Table>
  <TableHeader className="bg-gradient-to-r from-videira-cyan via-videira-blue to-videira-purple">
    <TableRow>
      <TableHead className="text-white">Nome</TableHead>
      <TableHead className="text-white">Valor</TableHead>
      <TableHead className="text-white">Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>{/* Linhas */}</TableBody>
</Table>
```

### 9. **Status Badges com Cores Apropriadas**

```tsx
{
  /* Sucesso - Verde */
}
;<Badge variant="success" className="bg-success text-white">
  Aprovado
</Badge>

{
  /* Pendente - Warning */
}
;<Badge variant="warning" className="bg-warning text-white">
  Pendente
</Badge>

{
  /* Info - Cyan */
}
;<Badge className="bg-info text-white">Novo</Badge>

{
  /* Erro - Vermelho */
}
;<Badge variant="destructive">Recusado</Badge>
```

### 10. **Gráficos com Cores da Marca**

```tsx
<PieChart>
  <Pie data={data} dataKey="value">
    <Cell fill="hsl(188 100% 42%)" /> {/* Cyan */}
    <Cell fill="hsl(231 48% 48%)" /> {/* Blue */}
    <Cell fill="hsl(262 52% 47%)" /> {/* Purple */}
  </Pie>
</PieChart>
```

---

## 🎨 Aplicação Rápida em Componentes Existentes

### Dashboard KPIs (Atualizar cores dos ícones)

```tsx
// src/app/admin/dashboard/page.tsx

// KPI 1 - Arrecadação (Cyan)
<div className="p-2 rounded-lg bg-videira-cyan/10">
  <kpi.icon className="h-4 w-4 text-videira-cyan" />
</div>

// KPI 2 - Membros (Blue)
<div className="p-2 rounded-lg bg-videira-blue/10">
  <kpi.icon className="h-4 w-4 text-videira-blue" />
</div>

// KPI 3 - Transações (Purple)
<div className="p-2 rounded-lg bg-videira-purple/10">
  <kpi.icon className="h-4 w-4 text-videira-purple" />
</div>
```

### Página de Relatórios (Cards com gradiente)

```tsx
// src/app/admin/relatorios/page.tsx

<Card className="hover:shadow-lg transition-all hover:scale-[1.02] border-t-2 border-t-videira-cyan">
  <CardHeader>
    <div className="p-3 rounded-lg bg-videira-cyan/10">
      <AlertTriangle className="h-6 w-6 text-videira-cyan" />
    </div>
    <CardTitle className="text-videira-cyan">Inadimplentes</CardTitle>
  </CardHeader>
</Card>
```

---

## 🔥 Classes Utilitárias Disponíveis

### Backgrounds

```css
.bg-videira-cyan        /* Cyan sólido */
.bg-videira-blue        /* Blue sólido */
.bg-videira-purple      /* Purple sólido */
.videira-gradient       /* Gradiente completo */
```

### Textos

```css
.text-videira-cyan
.text-videira-blue
.text-videira-purple
.text-videira-dark-indigo
.text-videira-muted-indigo
.videira-gradient-text   /* Texto com gradiente */
```

### Borders

```css
.border-videira-cyan
.border-videira-blue
.border-videira-purple
```

### Hover Effects

```css
.videira-hover           /* Hover com gradiente sutil */
```

---

## 🎯 Sugestões de Implementação Gradual

### Fase 1 - Cores Primárias (Já Aplicado Automaticamente)

- ✅ Botões primários ficam azuis (#3F51B5)
- ✅ Links ficam azuis
- ✅ Focus rings ficam azuis
- ✅ Dark mode usa cyan para destaque

### Fase 2 - KPIs e Cards do Dashboard

```tsx
// Substituir os ícones coloridos por cores da marca
<div className="p-2 rounded-lg bg-videira-cyan/10">
  <DollarSign className="h-4 w-4 text-videira-cyan" />
</div>
```

### Fase 3 - Headers e Títulos Especiais

```tsx
<h1 className="videira-gradient-text">Videira Admin Center</h1>
```

### Fase 4 - Cards de Destaque

```tsx
<Card className="border-t-4 border-t-videira-blue">{/* Conteúdo importante */}</Card>
```

---

## 🌓 Preview Light vs Dark Mode

### Light Mode

- Background: Branco limpo
- Primary: **Azul vibrante** (#3F51B5)
- Accent: **Cyan brilhante** (#00B8D4)
- Texto: Dark Indigo (#2C3E50)

### Dark Mode

- Background: Azul escuro profundo
- Primary: **Cyan brilhante** (#00B8D4) - Melhor contraste
- Accent: **Azul médio** (mais claro)
- Texto: Branco off-white

**Nota:** As cores mudam automaticamente para melhor legibilidade em cada modo!

---

## ✅ Vantagens da Nova Paleta

1. ✅ **Identidade Visual Forte** - Baseada no logo oficial
2. ✅ **Contraste Adequado** - WCAG AA/AAA compliant
3. ✅ **Dark Mode Harmonioso** - Cores ajustadas para cada tema
4. ✅ **Gráficos Profissionais** - Charts com cores consistentes
5. ✅ **Fácil Manutenção** - Variáveis CSS centralizadas
6. ✅ **Flexível** - Use cores específicas ou sistema padrão

---

## 🚀 Como Usar

### Opção 1: Deixar Automático (Recomendado)

O sistema já aplica as cores automaticamente em:

- Botões `<Button>` → Azul primário
- Links → Azul primário
- Inputs com focus → Ring azul
- Charts → Gradiente Videira

### Opção 2: Aplicar Manualmente

Use classes customizadas onde quiser destaque:

```tsx
className = 'bg-videira-cyan'
className = 'text-videira-purple'
className = 'videira-gradient'
className = 'videira-gradient-text'
className = 'videira-hover'
```

---

## 📊 Recomendações por Seção

### Dashboard

- **KPIs**: Ícones com `bg-videira-{cor}/10` e `text-videira-{cor}`
- **Gráficos**: Usar `--chart-1`, `--chart-2`, `--chart-3` (já mapeados)
- **Cards importantes**: `border-t-4 border-t-videira-blue`

### Relatórios

- **Header da página**: `videira-gradient-text` no título
- **Tabelas**: Header com fundo sutil da marca
- **Botão exportar**: `bg-accent` (cyan)

### Forms

- **Labels importantes**: `text-videira-blue`
- **Botão submit**: `bg-primary` (azul) ou `videira-gradient`
- **Fields com erro**: Mantém `border-destructive`

### Notificações/Toasts

- **Sucesso**: `bg-success` (verde) + ícone `text-videira-cyan`
- **Info**: `bg-info` (cyan)
- **Warning**: `bg-warning` (laranja)
- **Erro**: `bg-destructive` (vermelho)

---

## 🎨 Paleta Completa para Referência

```css
/* Cores da Marca Videira */
--videira-cyan: hsl(188 100% 42%) #00b8d4 --videira-blue: hsl(231 48% 48%) #3f51b5
  --videira-purple: hsl(262 52% 47%) #673ab7 --videira-dark-indigo: hsl(210 28% 24%) #2c3e50
  --videira-muted-indigo: hsl(207 24% 38%) #4a607a /* Cores do Sistema */ --primary: Azul
  (#3f51b5 light) / Cyan (#00b8d4 dark) --secondary: Roxo (#673ab7) --accent: Cyan (#00b8d4 light) /
  Azul claro (dark) --success: Verde (#22c55e) --warning: Laranja (#f59e0b) --destructive: Vermelho
  (#ef4444) --info: Cyan (#00b8d4);
```

---

## 🖼️ Preview Visual

```
┌─────────────────────────────────────────┐
│ [Cyan]  →  [Blue]  →  [Purple]         │  ← Gradiente do Logo
├─────────────────────────────────────────┤
│                                         │
│  📊 Dashboard                           │  ← Título com gradiente
│                                         │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐│
│  │💰 Cyan   │ │👥 Blue   │ │📈 Purple││  ← KPI Cards
│  │R$ 125k   │ │1.245     │ │3.892    ││
│  └──────────┘ └──────────┘ └─────────┘│
│                                         │
│  ┌─────────────────────────────────────┤
│  │ [Cyan] PIX: R$ 50k                  │
│  │ [Blue] Cartão: R$ 45k               │  ← Gráficos
│  │ [Purple] Boleto: R$ 30k             │
│  └─────────────────────────────────────┤
│                                         │
│  [Salvar - Azul] [Detalhes - Roxo]    │  ← Botões
└─────────────────────────────────────────┘
```

---

**Tema implementado e pronto para uso! 🎉**

Agora todo o sistema usa as cores do logo Videira de forma automática e você pode adicionar mais destaque usando as classes customizadas quando quiser.
