# Paleta de Cores Videira - Guia de Implementação

## 🎨 Paleta Principal

### Gradiente do Logo
```css
Cyan (Topo):    #00B8D4 - rgb(0, 184, 212)
Blue (Meio):    #3F51B5 - rgb(63, 81, 181)
Purple (Base):  #673AB7 - rgb(103, 58, 183)
```

### Cores da Marca
```css
Dark Indigo:    #2C3E50 - rgb(44, 62, 80)   - Texto principal
Muted Indigo:   #4A607A - rgb(74, 96, 122)  - Texto secundário
```

---

## 🎯 Aplicação no Sistema

### 1. **Primary (Ação Principal)**
- Cor: **Vibrant Blue (#3F51B5)**
- Uso: Botões primários, links, elementos interativos principais
- Exemplo: Botão "Salvar", links de navegação

### 2. **Secondary (Ação Secundária)**
- Cor: **Rich Purple (#673AB7)**
- Uso: Botões secundários, badges especiais, highlights
- Exemplo: Botão "Ver detalhes", tags importantes

### 3. **Accent (Destaque)**
- Cor: **Teal/Cyan (#00B8D4)**
- Uso: Notificações positivas, ícones de sucesso, hover effects
- Exemplo: Ícones ativos, indicadores de progresso

### 4. **Success**
- Cor: **Verde (#22C55E)**
- Uso: Mensagens de sucesso, status aprovado
- Exemplo: "Salvo com sucesso", transações aprovadas

### 5. **Warning**
- Cor: **Laranja (#F59E0B)**
- Uso: Alertas, pendências
- Exemplo: Status pendente, avisos

### 6. **Destructive**
- Cor: **Vermelho (#EF4444)**
- Uso: Exclusões, erros, cancelamentos
- Exemplo: Botão deletar, transações recusadas

---

## 💡 Exemplos de Uso

### Headers e Títulos Principais
```tsx
<h1 className="videira-gradient-text text-4xl font-bold">
  Videira Admin Center
</h1>
```

### Cards com Gradiente
```tsx
<Card className="border-t-4 border-t-transparent videira-gradient">
  <CardContent className="pt-6">
    {/* Conteúdo */}
  </CardContent>
</Card>
```

### Botões com Cores da Marca
```tsx
{/* Primário - Azul */}
<Button className="bg-primary">Ação Principal</Button>

{/* Secundário - Roxo */}
<Button className="bg-secondary">Ação Secundária</Button>

{/* Accent - Cyan */}
<Button className="bg-accent">Destaque</Button>
```

### Badges Coloridos
```tsx
<Badge className="bg-primary">Ativo</Badge>
<Badge className="bg-accent">Novo</Badge>
<Badge className="bg-secondary">Premium</Badge>
```

### Sidebar com Gradiente Sutil
```tsx
<div className="sidebar videira-hover">
  {/* Itens do menu */}
</div>
```

---

## 🌓 Light Mode vs Dark Mode

### Light Mode
- **Background:** Branco (#FFFFFF)
- **Primary:** Vibrant Blue (#3F51B5)
- **Texto:** Dark Indigo (#2C3E50)
- **Cards:** Branco com sombra sutil

### Dark Mode
- **Background:** Azul escuro (#0F172A)
- **Primary:** Teal/Cyan (#00B8D4) - Mais vibrante
- **Texto:** Branco off-white
- **Cards:** Azul escuro com borda sutil

---

## 📊 Uso por Seção

### Dashboard
- **KPI Cards:** Ícones com cores do gradiente
- **Gráficos:** Primary (azul) como cor principal
- **Badges:** Accent (cyan) para destaques

### Relatórios
- **Tabelas:** Header com `videira-gradient`
- **Filtros:** Botões com `bg-primary`
- **Exportar:** Botão com `bg-accent`

### Forms
- **Input Focus:** Ring com `ring-primary`
- **Labels:** Texto com `text-primary`
- **Submit:** Botão com `videira-gradient`

### Notificações
- **Sucesso:** Verde + Accent (cyan)
- **Erro:** Destructive (vermelho)
- **Info:** Primary (azul)
- **Aviso:** Warning (laranja)

---

## 🎨 Classes Utilitárias Customizadas

```css
/* Gradiente completo do logo */
.videira-gradient

/* Texto com gradiente */
.videira-gradient-text

/* Hover effect com cores da marca */
.videira-hover

/* Cores individuais */
.bg-videira-cyan
.bg-videira-blue
.bg-videira-purple
.text-videira-dark-indigo
.text-videira-muted-indigo
```

---

## 🚀 Instalação

1. Importe o arquivo CSS no seu layout principal:

```tsx
// src/app/layout.tsx
import '@/styles/videira-theme.css'
```

2. Use as classes nos componentes:

```tsx
<Button className="bg-primary hover:bg-primary/90">
  Botão Estilizado
</Button>
```

3. Para componentes Shadcn/UI, as variáveis CSS já estão aplicadas automaticamente!

---

## 🎯 Resultado Esperado

✨ **Sistema visualmente coeso com a identidade da marca**
🎨 **Gradientes modernos e profissionais**
🌓 **Dark mode harmonioso**
♿ **Contraste adequado para acessibilidade**
📱 **Responsivo em todos os dispositivos**

