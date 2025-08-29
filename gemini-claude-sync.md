# 📚 Documentación Obligatoria AltaMedica - Guía de Desarrollo

**Fecha de Actualización:** 2025-08-29  
**Versión:** 3.0  
**Estado:** CRÍTICO - Lectura obligatoria antes de desarrollo

---

## 🤖 COMANDOS OBLIGATORIOS PARA IAs - EJECUTAR SIEMPRE

### 🔴 AL INICIO DE CADA SESIÓN (OBLIGATORIO)
```bash
# 1. VERIFICAR ESTADO DE DOCUMENTACIÓN
pnpm docs:health

# 2. LEER GLOSARIOS ACTUALIZADOS
cat packages/GLOSARIO_MAESTRO.md | head -100
cat gemini-claude-sync.md | head -50

# 3. VERIFICAR EXPORTS DISPONIBLES
pnpm docs:validate
```

### 🟡 ANTES DE ESCRIBIR CÓDIGO (OBLIGATORIO)
```bash
# 1. BUSCAR SI YA EXISTE
rg "@NombreDelExport" packages/*/GLOSARIO.md

# 2. VERIFICAR TIPOS DISPONIBLES
npx tsc --noEmit --listFiles | grep types

# 3. SINCRONIZAR DOCUMENTACIÓN
pnpm docs:sync
```

### 🟢 DURANTE EL DESARROLLO (OBLIGATORIO)
```bash
# USAR ESTOS COMANDOS, NO LOS BÁSICOS
pnpm type-check      # NO usar: tsc --noEmit
pnpm lint            # NO usar: turbo lint solo
pnpm build           # NO usar: turbo build solo

# Estos comandos AUTO-ACTUALIZAN la documentación
```

### 🔵 AL FINALIZAR TAREAS (OBLIGATORIO)
```bash
# 1. ACTUALIZAR DOCUMENTACIÓN
pnpm docs:update

# 2. REPORTAR CAMBIOS
echo "## Cambios realizados $(date)" >> AI_WORK_LOG.md
echo "- Archivos modificados: $(git status -s | wc -l)" >> AI_WORK_LOG.md
echo "- Nuevos exports: $(pnpm docs:validate | grep "new")" >> AI_WORK_LOG.md

# 3. VERIFICAR SALUD
pnpm docs:health
```

---

## 🚨 DOCUMENTOS OBLIGATORIOS - LEER ANTES DE DESARROLLAR

### 1️⃣ Glosarios de Referencia Rápida (CRÍTICOS)

Estos documentos contienen TODA la información sobre exports, tipos, y patrones correctos:

#### 📋 Glosario Maestro
**Archivo:** `packages/GLOSARIO_MAESTRO.md`
- **Contenido:** Referencia completa de TODOS los exports del ecosistema
- **Incluye:** 
  - ✅ Índice de soluciones rápidas con anclas directas
  - ✅ Playbook de errores comunes con soluciones
  - ✅ Matriz de compatibilidad runtime (Edge/Node/Client)
  - ✅ Configuración ESLint Flat Config real
  - ✅ Scripts de validación implementados
- **Uso:** Ctrl+F para búsqueda instantánea de cualquier tipo/función

#### 🔐 Auth Package
**Archivo:** `packages/auth/GLOSARIO.md`
- **Badges por export:** Runtime + Estabilidad + Tipo
- **Secciones críticas:**
  - Errores de LoggerService
  - UserRole enum usage
  - Server-only vs Edge-safe exports

#### 📝 Types Package  
**Archivo:** `packages/types/GLOSARIO.md`
- **Marcadores:** Estabilidad + HIPAA + Recomendaciones
- **Incluye:**
  - Guía de refactors por prioridad
  - Validación HIPAA obligatoria
  - UserRole enum patterns

#### 🪝 Hooks Package
**Archivo:** `packages/hooks/GLOSARIO.md`
- **80+ hooks documentados** con runtime compatibility
- **Secciones esenciales:**
  - Client-only vs SSR-safe patterns
  - Errores comunes (exhaustive-deps, infinite loops)
  - Recetas de implementación

#### 🔧 Shared Package
**Archivo:** `packages/shared/GLOSARIO.md`
- **Servicios y utilidades** con matriz de compatibilidad
- **Crítico:** LoggerService siempre requiere 2 parámetros

---

## 🎯 TIPS Y SUGERENCIAS PARA DESARROLLO CORRECTO

### ✅ DO - Patrones Correctos

#### 1. Imports Correctos
```typescript
// ✅ CORRECTO - Import desde index oficial
import { useAuth, AuthProvider } from '@altamedica/auth';
import { UserRole, type User } from '@altamedica/types';
import { LoggerService } from '@altamedica/shared';

// ❌ INCORRECTO - Deep imports
import { useAuth } from '@altamedica/auth/src/hooks/useAuth';
import { Environment } from '@altamedica/shared/config/environment';
```

#### 2. UserRole SIEMPRE como Enum
```typescript
// ✅ CORRECTO
import { UserRole } from '@altamedica/types';
const role = UserRole.ADMIN;
if (user.role === UserRole.DOCTOR) { }

// ❌ INCORRECTO - Strings literales
const role = 'ADMIN';
if (user.role === 'DOCTOR') { }
```

#### 3. LoggerService con Data Object
```typescript
// ✅ CORRECTO - Siempre 2 parámetros
LoggerService.info('User logged in', { userId: user.id });
LoggerService.error('Auth failed', { error: err.message });

// ❌ INCORRECTO - Solo mensaje
LoggerService.info('User logged in');
```

#### 4. Edge Runtime Compatibility
```typescript
// ✅ Para Edge Runtime
export const runtime = 'edge';
import { BaseAPIClient } from '@altamedica/shared'; // Edge-safe ✅

// ✅ Para Node.js APIs
export const runtime = 'nodejs';
import Redis from 'ioredis'; // Ahora permitido
```

#### 5. Validación HIPAA
```typescript
// ✅ SIEMPRE validar datos médicos
import { PatientSchema } from '@altamedica/types';

const validatePatient = (data: unknown) => {
  const validated = PatientSchema.parse(data); // Validación Zod
  return validated;
};
```

### ❌ DON'T - Antipatrones a Evitar

1. **NO usar console.log** - Usar LoggerService
2. **NO hacer deep imports** - Usar exports oficiales
3. **NO usar strings para roles** - Usar UserRole enum
4. **NO usar any** - Usar tipos específicos
5. **NO ignorar errores de lint** - Corregirlos inmediatamente

---

## 🔧 GUÍA DE DESARROLLO PASO A PASO

### 1️⃣ Antes de Empezar
```bash
# Verificar exports disponibles
node scripts/validate-package-exports.mjs

# Verificar tipos
npx tsc --noEmit

# Buscar en glosarios
grep "@useAuth" packages/*/GLOSARIO.md
```

### 2️⃣ Durante el Desarrollo

#### Buscar un Export/Tipo
1. Abrir `packages/GLOSARIO_MAESTRO.md`
2. Ctrl+F → buscar el nombre
3. Copiar el import correcto
4. Verificar badges de compatibilidad

#### Resolver un Error
1. Ir al índice de soluciones rápidas en GLOSARIO_MAESTRO
2. Click en el enlace del error
3. Aplicar la solución documentada

#### Añadir Nueva Funcionalidad
1. Verificar si ya existe en glosarios
2. Seguir estructura estándar de packages
3. Añadir badges de runtime/estabilidad
4. Actualizar glosario correspondiente

### 3️⃣ Antes de Commit

```bash
# Validar exports
node scripts/validate-package-exports.mjs

# Verificar tipos
npx tsc --noEmit

# Buscar problemas comunes
rg "console\." --type ts  # NO console.log
rg "'ADMIN'" --type ts     # NO string literals para roles
rg "/src/" --glob "*.ts" --glob "!**/node_modules/**"  # NO deep imports
```

---

## 📊 MATRIZ RÁPIDA DE DECISIÓN

| Necesito... | Usar... | Glosario |
|------------|---------|----------|
| Hook de autenticación | `useAuth` de `@altamedica/auth` | auth/GLOSARIO.md |
| Tipo de usuario | `User` de `@altamedica/types` | types/GLOSARIO.md |
| Logging | `LoggerService` de `@altamedica/shared` | shared/GLOSARIO.md |
| Hook médico | Ver `@altamedica/hooks` | hooks/GLOSARIO.md |
| Validación de datos | Schemas Zod de `@altamedica/types` | types/GLOSARIO.md |

---

## 🚀 COMANDOS ÚTILES

```bash
# Desarrollo
pnpm dev:medical    # Apps médicas
pnpm dev:core       # Apps core

# Validación
node scripts/validate-package-exports.mjs  # Validar exports
npx tsc --noEmit    # Check tipos
pnpm lint           # Linting

# Búsqueda rápida
rg "@useAuth" packages/*/GLOSARIO.md  # Buscar export
rg "Error.*TS" .    # Buscar errores TypeScript
```

---

## 🔄 SISTEMA DE AUTO-MANTENIMIENTO DE DOCUMENTACIÓN

### Scripts Automáticos Implementados

#### 📝 docs-auto-update.mjs
- **Se ejecuta con:** `tsc`, `lint`, `build`, `test`
- **Función:** Actualiza errores y estadísticas en glosarios
- **Output:** Sección de errores actuales en GLOSARIO_MAESTRO

#### 👁️ docs-watch.mjs
- **Se ejecuta con:** `pnpm type-check:watch`
- **Función:** Monitorea cambios en tipos y exports
- **Output:** Actualización en tiempo real de glosarios

#### 🔄 sync-glosarios.mjs
- **Se ejecuta con:** `pnpm build`
- **Función:** Detecta nuevos exports y los documenta
- **Output:** Nuevas entradas en glosarios con badges

#### ✅ validate-package-exports.mjs
- **Se ejecuta con:** `pnpm docs:validate`
- **Función:** Valida exports documentados vs reales
- **Output:** validation-report.json

### Hooks de Documentación en Comandos

| Comando Original | Comando Mejorado | Auto-actualiza |
|-----------------|------------------|----------------|
| `tsc --noEmit` | `pnpm type-check` | ✅ Errores TypeScript |
| `turbo lint` | `pnpm lint` | ✅ Warnings ESLint |
| `turbo build` | `pnpm build` | ✅ Nuevos exports |
| `turbo test` | `pnpm test:unit` | ✅ Coverage stats |

---

## ⚠️ REGLAS CRÍTICAS PARA IAs

### 1. SIEMPRE Verificar Antes de Crear
```bash
# ANTES de crear CUALQUIER archivo o función:
rg "NombreFuncion" --type ts
rg "@NombreTipo" packages/*/GLOSARIO.md
```

### 2. NUNCA Usar Comandos Básicos
```bash
# ❌ NUNCA hacer esto:
tsc --noEmit
turbo lint
turbo build

# ✅ SIEMPRE hacer esto:
pnpm type-check
pnpm lint
pnpm build
```

### 3. SIEMPRE Reportar Trabajo
```bash
# Al finalizar CADA tarea:
git status >> AI_WORK_LOG.md
pnpm docs:health >> AI_WORK_LOG.md
```

### 4. LEER Documentación Actualizada
```bash
# Si han pasado más de 30 minutos:
cat packages/GLOSARIO_MAESTRO.md | grep "actualización"
pnpm docs:sync --dry-run
```

---

## 🔄 HISTORIAL DE SINCRONIZACIÓN

### 2025-08-29: Actualización Mayor v3.0
- ✅ Sistema de auto-mantenimiento de documentación
- ✅ Scripts automáticos integrados con comandos comunes
- ✅ Hooks en tsc, lint, build, test
- ✅ Detección automática de nuevos exports
- ✅ Actualización automática de errores en glosarios

### 2025-08-29: Actualización Mayor v2.0
- ✅ Creados 4 glosarios completos con badges
- ✅ Añadido índice de soluciones rápidas con anclas
- ✅ Implementado script de validación de exports
- ✅ Documentados TODOS los errores comunes con soluciones
- ✅ Añadida matriz de compatibilidad runtime

### Estado Actual (2025-08-29)
- **Glosarios:** 100% completos con badges
- **Exports reales:** auth(24), types(36), shared(3), hooks(39)
- **Última sincronización automática:** 29/8/2025, 6:18:29
---

## ⚠️ ADVERTENCIAS CRÍTICAS

1. **SIEMPRE** leer los glosarios antes de importar
2. **NUNCA** hacer deep imports (`/src/`)
3. **SIEMPRE** usar UserRole como enum, no strings
4. **SIEMPRE** pasar data object a LoggerService
5. **VERIFICAR** compatibilidad runtime antes de usar

---

## 📞 SOPORTE

- **Errores no documentados:** Añadir a GLOSARIO_MAESTRO
- **Exports faltantes:** Ejecutar script de validación
- **Dudas de runtime:** Consultar matriz de compatibilidad

---

**Este documento es la fuente de verdad para el desarrollo en AltaMedica**
**Última actualización:** 2025-08-29
**Mantenido por:** DevOps Team & AI Assistants