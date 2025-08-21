# 🌳 Guía de Git Worktrees con Claude para AltaMedica

## 📋 Modelo Recomendado: Híbrido por Tipo de Trabajo

### ¿Por qué este modelo es ideal para ti?

1. **Mantiene el contexto completo** - Claude puede ver todo el proyecto cuando necesitas hacer cambios cross-cutting
2. **Separa concerns** - Hotfixes aislados de desarrollo nuevo
3. **Sandbox para experimentos** - Probar ideas con Claude sin riesgo
4. **Simple de gestionar** - Solo 3-4 worktrees máximo

## 🚀 Setup Inicial (5 minutos)

```powershell
# Desde tu carpeta devaltamedica actual
cd C:\Users\Eduardo\Documents\devaltamedica

# Inicializar el modelo recomendado
powershell -File scripts\setup-claude-worktrees.ps1 init
```

Esto creará:

- `devaltamedica-hotfix/` - Para tus correcciones de CI/CD actuales
- `devaltamedica-next/` - Para la próxima feature grande
- `devaltamedica-sandbox/` - Para experimentar con Claude

## 📊 Cuándo Usar Cada Worktree

### 🔥 **HOTFIX** - Para tu trabajo actual de CI/CD

```powershell
# Cambiar a hotfix para correcciones
powershell -File scripts\setup-claude-worktrees.ps1 switch hotfix

# Trabajar con Claude
claude "Corregir errores de build en packages"
```

**Usar cuando:**

- Corriges errores de CI/CD (tu caso actual)
- Arreglas bugs urgentes
- Necesitas cambios mínimos y seguros
- El fix debe ir a producción rápido

### 🚀 **NEXT** - Para features nuevas

```powershell
# Crear branch de feature
powershell -File scripts\setup-claude-worktrees.ps1 create next feature/telemedicine-v2

# Trabajar con Claude
claude "Implementar nueva funcionalidad de telemedicina"
```

**Usar cuando:**

- Desarrollas features completas
- Necesitas refactoring grande
- Añades nuevos packages
- Trabajas en épicas de 1-2 semanas

### 🧪 **SANDBOX** - Para experimentar

```powershell
# Cambiar a sandbox
powershell -File scripts\setup-claude-worktrees.ps1 switch sandbox

# Experimentar con Claude
claude "Auditar todo el proyecto y generar reporte de optimizaciones"
```

**Usar cuando:**

- Pruebas ideas con Claude
- Haces auditorías completas
- Generas reportes
- Exploras refactorings mayores

## 💡 Flujo de Trabajo Típico

### Día 1: Setup

```powershell
# 1. Inicializar worktrees
powershell -File scripts\setup-claude-worktrees.ps1 init

# 2. Ver estado
powershell -File scripts\setup-claude-worktrees.ps1 status
```

### Día a día: Trabajo normal

```powershell
# Mañana: Trabajar en hotfixes
cd ..\devaltamedica-hotfix
claude "Revisar y corregir errores de CI/CD"

# Tarde: Desarrollar feature
cd ..\devaltamedica-next
claude "Continuar con feature de dashboard"

# Experimentar
cd ..\devaltamedica-sandbox
claude "Probar nueva arquitectura de packages"
```

### Sincronización

```powershell
# En main, pull últimos cambios
cd ..\devaltamedica
git pull origin main

# Actualizar hotfix
cd ..\devaltamedica-hotfix
git rebase main
```

## 🎯 Ventajas Específicas con Claude

### 1. **Contexto Optimizado**

Cada worktree tiene su `.claude/CLAUDE.md` con instrucciones específicas:

- **Hotfix**: Claude es más conservador, no refactoriza
- **Next**: Claude puede ser creativo y proponer mejoras
- **Sandbox**: Claude tiene libertad total

### 2. **Historial Separado**

- Las conversaciones de hotfixes no se mezclan con features
- Puedes retomar contexto fácilmente

### 3. **Testing Aislado**

- Pruebas cambios sin afectar otros worktrees
- Rollback fácil si algo sale mal

## 📝 Comandos Rápidos

```powershell
# Ver estado de todos los worktrees
powershell -File scripts\setup-claude-worktrees.ps1 status

# Cambiar a hotfix
powershell -File scripts\setup-claude-worktrees.ps1 switch hotfix

# Cambiar a next
powershell -File scripts\setup-claude-worktrees.ps1 switch next

# Cambiar a sandbox
powershell -File scripts\setup-claude-worktrees.ps1 switch sandbox

# Limpiar worktrees huérfanos
powershell -File scripts\setup-claude-worktrees.ps1 clean
```

## ⚡ Tips Pro

1. **Para tu trabajo actual de CI/CD**: Usa `hotfix`
2. **Para auditorías con Claude**: Usa `sandbox`
3. **Para features médicas nuevas**: Usa `next`
4. **Commits frecuentes**: En hotfix, commit después de cada fix
5. **No más de 4 worktrees**: Mantén la simplicidad

## 🔄 Migrar tu Trabajo Actual

```powershell
# 1. Commit cambios actuales
git add .
git commit -m "WIP: fixes de CI/CD"

# 2. Crear hotfix worktree con tu branch actual
powershell -File scripts\setup-claude-worktrees.ps1 create hotfix fix/cicd-dependencies

# 3. Cambiar a hotfix
cd ..\devaltamedica-hotfix

# 4. Continuar trabajo con Claude
claude "Continuar corrigiendo errores de build"
```

## ❓ FAQ

**P: ¿Necesito worktrees si trabajo solo?**
R: Sí, te ayuda a separar contextos mentales y Claude trabaja mejor con instrucciones específicas.

**P: ¿Cuánto espacio en disco usa?**
R: Cada worktree es una copia completa (~500MB), pero git comparte objetos, así que el overhead es mínimo (~50MB por worktree adicional).

**P: ¿Puedo tener el mismo branch en múltiples worktrees?**
R: No, cada branch solo puede estar en un worktree a la vez.

**P: ¿Cómo sincronizo cambios entre worktrees?**
R: Usa `git rebase` o `git merge` desde el worktree que quieres actualizar.

## 🎉 Resultado Esperado

Con este modelo tendrás:

- ✅ Trabajo organizado por tipo
- ✅ Claude optimizado para cada contexto
- ✅ Cambios aislados y seguros
- ✅ Flujo de trabajo eficiente
- ✅ Menos conflictos de merge
- ✅ Historial git limpio

---

_Última actualización: Agosto 2025_
