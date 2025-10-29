# 🔄 GitHub Actions - Configuração e Limitações

## 📊 Status Atual

**Status:** ⚠️ Temporariamente desabilitado devido a limitações de billing

## 🔍 Sobre as Limitações

### GitHub Actions para Repositórios Privados
- **Contas gratuitas:** 2.000 minutos/mês
- **Repositórios privados:** Consomem minutos mais rapidamente
- **Billing issues:** Bloqueiam execução de workflows

## 🛠️ Alternativas Implementadas

### 1. **Script Local de Qualidade**
```bash
# Executar verificações localmente
npm run quality:check

# Ou individual
npm run typecheck
npm run lint
npm run build
```

### 2. **Workflow Manual**
- Disponível em `.github/workflows/manual-ci.yml`
- Execute apenas quando necessário via interface do GitHub
- Economiza minutos da cota

### 3. **Pre-commit Hooks**
```bash
# Executar antes de cada commit
npm run pre-commit
```

## 🔄 Como Reativar Actions

### Quando o billing for resolvido:

1. **Editar `.github/workflows/ci.yml`:**
   - Descomentar as linhas do workflow
   - Remover comentários de desabilitação

2. **Testar gradualmente:**
   - Começar com workflow manual
   - Depois ativar automático

## 📋 Verificações Locais Recomendadas

### Antes de cada commit:
```bash
npm run quality:check
```

### Antes de cada push:
```bash
npm run build
npm run typecheck
npm run lint
```

## 🎯 Benefícios Mantidos

Mesmo sem Actions automático, ainda temos:
- ✅ **Templates** de Issues e PRs
- ✅ **Dependabot** (cota separada)
- ✅ **Estrutura profissional**
- ✅ **Scripts locais** de qualidade
- ✅ **Pre-commit hooks**

## 💡 Dicas

- Use `npm run quality:check` antes de commits importantes
- Workflow manual para releases
- Dependabot ainda funciona para segurança
- Estrutura está pronta para quando Actions voltar

---

**A qualidade do código continua garantida através de verificações locais!** ✅