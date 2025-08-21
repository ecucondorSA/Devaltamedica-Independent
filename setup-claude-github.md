# 🤖 Guía: Implementar Claude Code Base Action

## 🚀 Setup Rápido (Método Recomendado 2025)

### Paso 1: Instalar Claude GitHub App
```bash
# En terminal de Claude Code
/install-github-app
```

Este comando:
- Te guiará por la configuración del GitHub App
- Creará automáticamente los secrets necesarios
- Generará el workflow file en .github/workflows/claude.yml

### Paso 2: Configurar API Key
1. Ve a tu repo → **Settings** → **Secrets and variables** → **Actions**
2. Agrega secret: `ANTHROPIC_API_KEY` 
3. Valor: Tu API key de console.anthropic.com

### Paso 3: Activar Workflow
- Claude creará un PR con el workflow
- Revisa y haz merge para activar

---

## 🛠️ Setup Manual (Alternativo)

### 1. Instalar GitHub App
https://github.com/apps/claude

### 2. Crear Workflow File
```yaml
# Ya creado en .github/workflows/claude.yml
# Configurado específicamente para AltaMedica
```

---

## 🎯 Funcionalidades Implementadas

### 🤖 Claude Code Assistant
- **Triggers**: @claude en issues, PRs, comments
- **Capacidades**: 
  - Code review automático
  - Implementación de features  
  - Bug fixing y refactoring
  - Documentación automática

### 🔒 Security Review Automático
- **Análisis HIPAA** automático en PRs
- **Detección de vulnerabilidades** healthcare
- **Audit trail** y logging compliance
- **WebRTC security** para telemedicina

### ⚙️ Configuración AltaMedica
- **Respeta CLAUDE.md** (no ejecuta builds)
- **Contexto healthcare** incluido
- **Monorepo awareness** (7 apps, 22 packages)
- **Stack-specific** (Next.js, TypeScript, Firebase)

---

## 🚀 Uso Práctico

### En Issues
```
@claude Implement user authentication with HIPAA compliance
```

### En Pull Requests  
```
@claude Review this telemedicine feature for security issues
```

### Security Review Automático
- Se ejecuta automáticamente en cada PR
- Analiza compliance HIPAA
- Detecta vulnerabilities específicas de healthcare

---

## 🎛️ Comandos Disponibles

### Desarrollo
- `@claude implement [feature]` - Implementa nueva funcionalidad
- `@claude fix [issue]` - Corrige bugs
- `@claude refactor [code]` - Refactoriza código
- `@claude document [component]` - Genera documentación

### Healthcare Específico
- `@claude hipaa-review` - Análisis HIPAA compliance
- `@claude security-audit` - Auditoría de seguridad
- `@claude webrtc-optimize` - Optimiza WebRTC para telemedicina

### Monorepo
- `@claude analyze-dependencies` - Analiza dependencias cross-package
- `@claude optimize-build` - Optimiza configuración Turbo
- `@claude package-review [package]` - Revisa package específico

---

## 📊 Integración con Workflows Existentes

### Compatible con tus workflows:
- ✅ No interfiere con workflows deshabilitados
- ✅ Respeta comandos prohibidos en CLAUDE.md
- ✅ Se ejecuta solo cuando se menciona @claude
- ✅ Manual approval para cambios críticos

### Artifacts Generated:
- `claude-analysis.md` - Análisis detallado
- `claude-suggestions.json` - Sugerencias estructuradas  
- `claude-security-report.md` - Reporte de seguridad

---

## 🔐 Configuración de Secrets

### Required Secrets:
```
ANTHROPIC_API_KEY=your_api_key_here
```

### Optional Secrets:
```
CLAUDE_MAX_TOKENS=8192
CLAUDE_TEMPERATURE=0.1
CLAUDE_MODEL=claude-3.5-sonnet-20241022
```

---

## 🧪 Testing la Integración

### Paso 1: Crear Issue de Prueba
```
Title: Test Claude Integration
Body: @claude Hello! Please analyze the current project structure
```

### Paso 2: Abrir PR de Prueba
- Claude ejecutará security review automáticamente
- Verificar que respeta CLAUDE.md constraints

### Paso 3: Verificar Artifacts
- Revisar `claude-analysis.md` generado
- Confirmar que no ejecutó comandos prohibidos

---

## ⚡ Resultado Esperado

Después de esta implementación tendrás:
- 🤖 **Claude activo** en todos los issues y PRs  
- 🔒 **Security reviews automáticos** con contexto HIPAA
- 📊 **Análisis inteligente** respetando tu configuración
- 🚀 **Desarrollo acelerado** con IA pair programming

**¡Claude estará disponible 24/7 para ayudar con AltaMedica!**