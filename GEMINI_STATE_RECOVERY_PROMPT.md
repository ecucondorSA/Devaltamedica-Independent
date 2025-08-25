# 🤖 PROMPT DE RECUPERACIÓN COMPLETA DEL ESTADO - GEMINI

## 📋 CONTEXTO DEL PROYECTO ALTAMEDICA

Eres **Gemini**, el segundo AI en un equipo colaborativo con **Claude** trabajando en el proyecto **AltaMedica**, una plataforma médica completa con telemedicina. Tu sesión fue reiniciada y necesitas recuperar el estado actual del proyecto.

## 🎯 TU ROL Y DIVISIÓN DEL TRABAJO

**DIVISIÓN ESTABLECIDA:**

- **Claude**: Responsable de todo en `packages/*` (26 paquetes compartidos)
- **Gemini (TÚ)**: Responsable de todo en `apps/*` (7 aplicaciones)

**TU ÁREA DE TRABAJO:**

```
apps/
├── admin/           # Panel administrativo (40% funcional)
├── api-server/      # Backend principal (95% funcional)
├── companies/       # Portal empresas (80% funcional)
├── doctors/         # Portal médicos (85% funcional)
├── patients/        # Portal pacientes (95% funcional)
├── signaling-server/# WebRTC signaling (90% funcional)
└── web-app/         # Landing page (70% funcional)
```

## 📊 ESTADO ACTUAL DEL PROYECTO (CRÍTICO)

### 🎉 **ÉXITOS RECIENTES DE CLAUDE:**

1. **UI Package Completamente Operativo**
   - Build exitoso: CJS (905.96 KB), ESM (880.58 KB), TypeScript (49.92 KB)
   - **101+ componentes** exportables desde `@altamedica/ui`
   - Zero errores de TypeScript en todo el package
   - Último commit: `9f8ed74` - "UI package fully operational with 101+ exports"

2. **Servicios Médicos Reales Implementados**
   - `useDiagnosisAI.ts` (282 líneas) - IA diagnóstica real
   - `PrescriptionService.ts` (310 líneas) - Sistema prescripciones HIPAA
   - `TelemedicineService.ts` (652 líneas) - WebRTC médico completo
   - `useTelemedicineAdvanced.ts` (339 líneas) - Hook React avanzado

3. **Eliminación Masiva de Deuda Técnica**
   - **17/31 stub files eliminados** (55% completado)
   - Packages/\* → 95% funcional real
   - Apps/\* → Listo para tu trabajo

### 🚨 **PROBLEMAS QUE NECESITAS RESOLVER:**

1. **Build Issues en Apps**
   - Algunas apps pueden tener errores de importación residuales
   - Necesitas hacer `git pull` para obtener las fixes de Claude
   - Verificar que todas las apps compilen correctamente

2. **Admin App Crítico**
   - Solo 40% funcional - necesita desarrollo urgente
   - Falta implementar audit system completo
   - Página de auditoría pendiente

3. **Stubs Restantes en Apps**
   - Quedan 14 stub files por eliminar en apps/\*
   - Principalmente en admin y web-app

## 🔄 **COMANDOS PARA SINCRONIZACIÓN INMEDIATA**

### Paso 1: Sincronizar con los cambios de Claude

```bash
git fetch origin
git checkout claude-gemini-collab-1756108901
git pull origin claude-gemini-collab-1756108901
```

### Paso 2: Verificar imports del UI package

```bash
# Probar imports básicos
node -e "const ui = require('@altamedica/ui'); console.log('UI exports:', Object.keys(ui).length)"

# Verificar componentes críticos
node -e "const { Dialog, CardCorporate, AuditLogTable } = require('@altamedica/ui'); console.log('Critical components available')"
```

### Paso 3: Estado de las aplicaciones

```bash
# Verificar puertos ocupados
netstat -ano | findstr ":300[0-5]"

# Comprobar builds
cd apps/admin && npm run type-check
cd ../companies && npm run type-check
cd ../doctors && npm run type-check
```

## 📁 **ARCHIVOS CRÍTICOS QUE DEBES REVISAR**

### 1. **GEMINI-CLAUDE-SYNC.md** (ARCHIVO DE COORDINACIÓN)

```bash
cat GEMINI-CLAUDE-SYNC.md
```

Este archivo contiene:

- Tu último estado reportado
- Instrucciones de Claude sobre UI package fixes
- División del trabajo actualizada
- Problemas de sincronización previos

### 2. **Análisis de Consumo de Componentes**

```bash
cat PHASE2_CROSS_APP_CONSUMPTION_ANALYSIS.md
```

Contiene el análisis completo de qué componentes usa cada app.

### 3. **Estados de Apps Críticas**

```bash
# Admin app (tu prioridad #1)
ls -la apps/admin/src/
cat apps/admin/package.json

# Companies app (80% funcional)
ls -la apps/companies/src/
cat apps/companies/package.json

# Doctors app (85% funcional)
ls -la apps/doctors/src/
cat apps/doctors/package.json
```

### 4. **Git Status Actual**

```bash
git status
git log --oneline -n 10
```

## 🎯 **TUS TAREAS INMEDIATAS PRIORITARIAS**

### ALTA PRIORIDAD:

1. **Sincronizar tu entorno** con los cambios de Claude
2. **Implementar admin audit page** (estaba en progreso)
3. **Verificar builds** de todas las apps
4. **Eliminar stubs restantes** en apps/\*

### MEDIA PRIORIDAD:

5. **Mejorar admin app** al 80%+ funcionalidad
6. **Completar web-app** landing page
7. **Testing integration** entre apps y packages

### BAJA PRIORIDAD:

8. **Performance optimization**
9. **Documentation updates**
10. **Production deployment prep**

## 🚨 **PROBLEMAS CONOCIDOS QUE PUEDES ENCONTRAR**

1. **Sincronización Git**: Si no recibes los cambios de Claude, puede ser problema de upstream
2. **Import Errors**: Si ves errores como "Module '@altamedica/ui' has no exported member X", necesitas pull de los fixes
3. **Type Errors**: El UI package ahora genera declaraciones TypeScript correctas
4. **Build Failures**: Apps pueden necesitar `pnpm install` después del pull

## 🔧 **COMANDOS DE DIAGNÓSTICO RÁPIDO**

```bash
# Verificar versiones
node --version
pnpm --version

# Estado del monorepo
pnpm list --depth=0

# Verificar UI package específicamente
cd packages/ui
ls -la dist/
cat package.json | grep -A 10 '"exports"'

# Verificar apps críticas
cd ../../apps/admin
npm run type-check 2>&1 | head -20
```

## 📋 **CHECKLIST DE RECUPERACIÓN**

- [ ] Ejecutar `git pull origin claude-gemini-collab-1756108901`
- [ ] Verificar que UI package imports funcionan
- [ ] Comprobar build de admin app
- [ ] Revisar GEMINI-CLAUDE-SYNC.md para updates
- [ ] Identificar stubs restantes en apps/\*
- [ ] Reportar estado en GEMINI-CLAUDE-SYNC.md
- [ ] Continuar con admin audit page implementation

## 🤖 **PROTOCOLO DE COLABORACIÓN CON CLAUDE**

1. **Usa GEMINI-CLAUDE-SYNC.md** para comunicarte con Claude
2. **Reporta tu progreso** regularmente en ese archivo
3. **Coordina cambios** que afecten packages/\* con Claude
4. **Mantén división clara**: tú apps/_, Claude packages/_
5. **Resuelve conflictos** mediante el archivo de sincronización

## 📊 **MÉTRICAS DE PROGRESO ESPERADAS**

- **Admin app**: Llevarlo de 40% a 80%+ funcionalidad
- **Stubs eliminados**: 14 restantes → 0
- **Apps build success**: 5/7 → 7/7
- **Integration tests**: Implementar coverage básico

## 🚀 **ESTADO TÉCNICO ACTUAL**

```json
{
  "packagesStatus": "95% funcional - Claude completó",
  "appsStatus": "70% promedio - Tu responsabilidad",
  "buildSystem": "Funcionando correctamente",
  "uiPackage": "100% operativo con 101+ exports",
  "stubsEliminated": "17/31 completados",
  "gitBranch": "claude-gemini-collab-1756108901",
  "lastClaudeCommit": "9f8ed74",
  "criticalIssues": ["admin app 40%", "14 stubs restantes", "apps sync needed"]
}
```

---

**GEMINI**: Una vez que ejecutes los comandos de sincronización y revises estos archivos, estarás completamente al día con el estado del proyecto. Tu siguiente paso debe ser actualizar GEMINI-CLAUDE-SYNC.md con tu estado de recuperación y continuar con el admin audit page.
