# 👨‍💼 EDUARDO - Guía del Propietario para Control Total de AltaMedica

**Fecha:** 2025-08-29  
**Versión:** 1.0  
**Confidencial:** Solo para Eduardo - NO compartir con IAs

---

## 🎯 TU CONTROL EJECUTIVO EN 5 MINUTOS DIARIOS

### Rutina Matutina (8:00 AM)

```bash
# 1. Estado del sistema (30 segundos)
pnpm docs:health
node scripts/agent-health-scan.mjs

# 2. Ver trabajo de las IAs (1 minuto)
cat AI_WORK_LOG.md | tail -50

# 3. Verificar integridad (30 segundos)
git status
git log --oneline -10
```

### Check de Mediodía (2:00 PM)

```bash
# Verificar si hay problemas
pnpm type-check 2>&1 | grep -c "error TS"
```

### Cierre del Día (6:00 PM)

```bash
# Backup y sincronización
git add -A
git commit -m "EOD backup $(date +%Y%m%d)"
git push
```

---

## 📝 PROMPTS DIARIOS PARA IAs - COPIA Y PEGA

### 🌅 Prompt de Inicio de Día

```markdown
INICIO DE SESIÓN - EJECUTA ESTOS COMANDOS OBLIGATORIOS:

1. pnpm docs:health
2. cat packages/GLOSARIO_MAESTRO.md | head -100
3. cat AI_WORK_LOG.md | tail -30
4. git status

Reporta el estado actual y qué tareas completaste ayer.
```

### 🔧 Prompt para Desarrollo

```markdown
TAREA: [Descripción específica]

RESTRICCIONES:
- NO crear archivos nuevos sin verificar 5 veces si ya existe
- NO usar comandos prohibidos (pnpm build, tsc directo)
- USAR comandos mejorados (pnpm type-check, pnpm lint)
- ACTUALIZAR AI_WORK_LOG.md al terminar

ENTREGABLES:
1. Código funcionando
2. Sin errores de TypeScript
3. Documentación actualizada

Usa TodoWrite para planificar antes de empezar.
```

### 🐛 Prompt para Debug

```markdown
PROBLEMA: [Error específico]

DIAGNÓSTICO REQUERIDO:
1. Ejecuta: node scripts/agent-health-scan.mjs
2. Busca el error en GLOSARIO_MAESTRO.md
3. Verifica los logs: cat logs/error.log | tail -100
4. NO intentes soluciones ya probadas: [lista de intentos fallidos]

Dame 3 soluciones alternativas, no las obvias.
```

### 🚀 Prompt para Deploy

```markdown
PREPARAR DEPLOY A PRODUCCIÓN:

1. Ejecuta todos los checks:
   - pnpm type-check
   - pnpm lint
   - pnpm test:unit
   
2. Verifica integridad:
   - node scripts/validate-package-exports.mjs
   - git status (debe estar limpio)
   
3. Genera reporte:
   - Crea DEPLOY_READY_REPORT.md con todos los resultados

NO hagas deploy, solo prepara el reporte.
```

### 📊 Prompt de Auditoría

```markdown
AUDITORÍA COMPLETA DEL SISTEMA:

Ejecuta estos scripts y genera reporte:
1. node scripts/agent-health-scan.mjs
2. node scripts/analyze-duplications.mjs  
3. pnpm audit
4. Cuenta archivos sin usar (más de 30 días sin modificar)
5. Identifica dependencias obsoletas

Genera AUDIT_REPORT_[fecha].md con hallazgos críticos.
```

---

## 🎮 COMANDOS DE CONTROL EXCLUSIVOS PARA EDUARDO

### 🔴 Scripts SOLO para Eduardo (NUNCA dar a IAs)

```bash
# 1. Kill switch - Detener todo desarrollo
./scripts/eduardo-only/emergency-stop.sh

# 2. Rollback completo
./scripts/eduardo-only/rollback-to-last-stable.sh

# 3. Audit trail de IAs
node scripts/eduardo-only/ai-audit-trail.mjs

# 4. Backup completo con secrets
./scripts/eduardo-only/full-backup-with-secrets.sh

# 5. Resetear permisos de IAs
./scripts/eduardo-only/reset-ai-permissions.sh

# 6. Ver costos de APIs
node scripts/eduardo-only/api-costs-monitor.mjs

# 7. Purgar trabajo de IA específica
./scripts/eduardo-only/purge-ai-work.sh [AI_NAME]
```

### 🟢 Scripts que las IAs DEBEN ejecutar

```bash
# Documentación y salud
pnpm docs:health
pnpm docs:sync
node scripts/validate-package-exports.mjs

# Análisis (read-only)
node scripts/agent-health-scan.mjs
node scripts/analyze-duplications.mjs

# Desarrollo controlado
pnpm type-check
pnpm lint
pnpm test:unit
```

### 🟡 Scripts que requieren tu APROBACIÓN

```bash
# Estos scripts las IAs pueden sugerir, pero TÚ ejecutas:
pnpm build
pnpm deploy
git push
npm publish
firebase deploy
```

---

## 📋 ESTRATEGIAS DE DELEGACIÓN EFECTIVA

### 1. División por Especialización

**Claude** (Arquitecto Principal)
- Diseño de sistemas
- Refactoring complejo
- Documentación técnica
- Debugging difícil

**ChatGPT** (Implementador Rápido)
- Features nuevas
- Tests unitarios
- Fixes rápidos
- Integraciones API

**Gemini** (Optimizador)
- Performance
- Análisis de código
- Seguridad
- Clean code

### 2. Método de Delegación por Fases

```markdown
FASE 1 - ANÁLISIS (Gemini)
"Analiza [componente] y genera reporte de problemas"

FASE 2 - DISEÑO (Claude)  
"Basado en el reporte, diseña solución para [problemas]"

FASE 3 - IMPLEMENTACIÓN (ChatGPT)
"Implementa el diseño de Claude para [componente]"

FASE 4 - VALIDACIÓN (Claude)
"Revisa implementación y sugiere mejoras"
```

### 3. Delegación por Prioridad

```markdown
🔴 CRÍTICO (Hazlo tú o supervisa en tiempo real)
- Cambios en autenticación
- Modificaciones de base de datos
- Deploy a producción
- Cambios en payments

🟡 IMPORTANTE (Delega con checkpoints)
- Nuevas features
- Refactoring mayor
- Integraciones externas

🟢 RUTINARIO (Delega completamente)
- Fixes de UI
- Actualización de docs
- Tests unitarios
- Limpieza de código
```

---

## 🛡️ MECANISMOS DE CONTROL Y SEGURIDAD

### 1. Límites Automáticos para IAs

```javascript
// Configurar en .env.local (NO compartir con IAs)
MAX_FILES_PER_SESSION=50
MAX_LINES_PER_FILE=500
FORBIDDEN_PATHS=/secrets,/.env,/backup
FORBIDDEN_COMMANDS=rm -rf,drop,delete from
AUTO_COMMIT_THRESHOLD=20  // Auto-commit cada 20 cambios
```

### 2. Alertas Automáticas

```bash
# Script de monitoreo (ejecutar en background)
./scripts/eduardo-only/monitor-ai-activity.sh &

# Te alertará si:
# - Más de 50 archivos modificados
# - Cambios en archivos críticos
# - Intentos de acceso a secrets
# - Comandos peligrosos
```

### 3. Checkpoints Obligatorios

```markdown
Las IAs DEBEN pedirte aprobación para:
1. Crear más de 5 archivos nuevos
2. Borrar cualquier archivo
3. Modificar package.json
4. Cambiar configuraciones (.env, firebase.json)
5. Ejecutar scripts no documentados
```

---

## 📈 MÉTRICAS DE PRODUCTIVIDAD DE IAs

### Dashboard Semanal

```bash
# Generar reporte semanal
node scripts/eduardo-only/weekly-ai-report.mjs

# Métricas incluidas:
# - Líneas de código por IA
# - Bugs introducidos vs resueltos
# - Tiempo de respuesta promedio
# - Calidad del código (complejidad)
# - Documentación generada
```

### KPIs para Evaluar IAs

| Métrica | Claude | ChatGPT | Gemini | Target |
|---------|--------|---------|--------|--------|
| Código sin errores | 95% | 85% | 90% | >90% |
| Docs actualizadas | 100% | 70% | 80% | 100% |
| Tests coverage | 85% | 90% | 80% | >80% |
| Bugs/1000 líneas | 2 | 5 | 3 | <3 |

---

## 🎯 FLUJOS DE TRABAJO OPTIMIZADOS

### 1. Flujo de Feature Nueva

```bash
# Día 1 - Análisis
PROMPT: "Analiza viabilidad de [feature] en el ecosistema actual"

# Día 2 - Diseño
PROMPT: "Diseña arquitectura para [feature] compatible con packages actuales"

# Día 3-4 - Implementación
PROMPT: "Implementa [feature] siguiendo el diseño aprobado"

# Día 5 - Testing y Polish
PROMPT: "Agrega tests, documentación y optimiza [feature]"
```

### 2. Flujo de Hotfix

```bash
# URGENTE (< 1 hora)
PROMPT: "HOTFIX CRÍTICO: [descripción del bug]
- Tiempo límite: 45 minutos
- Solo fix mínimo viable
- Sin refactoring
- Tests después
GO!"
```

### 3. Flujo de Refactoring

```bash
# Semana completa
LUNES: "Audita [módulo] y lista mejoras necesarias"
MARTES: "Crea plan de refactoring con riesgos"
MIÉRCOLES-JUEVES: "Ejecuta refactoring con tests"
VIERNES: "Documenta cambios y actualiza glosarios"
```

---

## 🚨 COMANDOS DE EMERGENCIA

### Si algo sale mal:

```bash
# 1. Detener todas las operaciones
pkill node
docker stop $(docker ps -q)

# 2. Verificar daños
git status
git diff HEAD~1

# 3. Rollback rápido
git reset --hard HEAD~1

# 4. Restaurar desde backup
./scripts/eduardo-only/restore-from-backup.sh [fecha]

# 5. Auditar qué pasó
git log --oneline --graph -20
cat AI_WORK_LOG.md | grep "$(date +%Y-%m-%d)"
```

---

## 💡 MEJORES PRÁCTICAS Y TIPS

### 1. Comunicación Efectiva con IAs

✅ **HAZLO ASÍ:**
- Contexto específico
- Límites claros
- Ejemplos del resultado esperado
- Restricciones explícitas

❌ **EVITA ESTO:**
- Instrucciones vagas
- Múltiples tareas en un prompt
- Asumir conocimiento previo
- Dejar decisiones críticas a la IA

### 2. Gestión del Tiempo

```markdown
MAÑANA (8-12): Tareas creativas y diseño con Claude
TARDE (12-4): Implementación con ChatGPT
TARDE-NOCHE (4-8): Testing y documentación con Gemini
NOCHE (8+): Reviews y planificación (tú solo)
```

### 3. Rotación de IAs

```markdown
Regla: No uses la misma IA más de 4 horas seguidas

Razones:
- Evita "fatiga" del contexto
- Perspectivas frescas
- Especialización natural
- Mejor calidad general
```

### 4. Backup y Versionado

```bash
# Backup automático diario
crontab -e
0 22 * * * cd /home/edu/Devaltamedica-Independent && git add -A && git commit -m "Auto-backup $(date)" && git push

# Snapshot antes de cambios grandes
git tag -a "pre-[feature]" -m "Snapshot antes de [feature]"
git push --tags
```

---

## 📊 PLANTILLAS DE REPORTES

### Reporte Diario para Ti Mismo

```markdown
## Reporte Diario - [Fecha]

### ✅ Completado
- [Lista de tareas completadas]

### 🔄 En Progreso  
- [Tareas actuales]

### 🚫 Bloqueadores
- [Problemas encontrados]

### 📈 Métricas
- Líneas agregadas: X
- Archivos modificados: Y
- Tests agregados: Z
- Coverage: N%

### 🎯 Para Mañana
- [Top 3 prioridades]
```

### Reporte Semanal de IAs

```markdown
## Performance IA - Semana [N]

### Claude
- Tareas: X completadas, Y pendientes
- Calidad: N/10
- Problemas: [lista]

### ChatGPT
- Tareas: X completadas, Y pendientes
- Calidad: N/10
- Problemas: [lista]

### Gemini
- Tareas: X completadas, Y pendientes
- Calidad: N/10
- Problemas: [lista]

### Decisión
- Mejor performer: [IA]
- Necesita mejora: [IA]
- Ajustes para próxima semana: [cambios]
```

---

## 🔐 SECRETOS Y CONFIGURACIONES (SOLO EDUARDO)

### Archivos que NUNCA deben ver las IAs:

```
.env.production
.env.stripe
.env.firebase-admin
/secrets/*
/backup/*
/eduardo-only/*
*.key
*.pem
*.p12
```

### Configuración de Permisos

```bash
# Crear directorio seguro
mkdir -p ~/altamedica-secrets
chmod 700 ~/altamedica-secrets

# Mover secrets
mv .env.production ~/altamedica-secrets/
ln -s ~/altamedica-secrets/.env.production .env.production

# Script de carga segura
source ~/altamedica-secrets/load-secrets.sh
```

---

## 🎮 ATAJOS Y COMANDOS RÁPIDOS

### Aliases Recomendados (.bashrc o .zshrc)

```bash
# AltaMedica shortcuts
alias am-health='pnpm docs:health'
alias am-status='git status && pnpm type-check 2>&1 | grep -c "error"'
alias am-work='cat AI_WORK_LOG.md | tail -30'
alias am-clean='git clean -fd && pnpm clean'
alias am-fresh='git pull && pnpm install && pnpm build:packages'
alias am-backup='git add -A && git commit -m "Backup $(date +%Y%m%d-%H%M)" && git push'

# IA management
alias ai-claude='echo "Working with Claude" > .current-ai'
alias ai-gpt='echo "Working with ChatGPT" > .current-ai'
alias ai-gemini='echo "Working with Gemini" > .current-ai'
alias ai-current='cat .current-ai'
alias ai-reset='rm .current-ai && echo "No AI selected"'

# Emergency
alias emergency='pkill node && docker stop $(docker ps -q) && echo "All stopped"'
alias rollback='git reset --hard HEAD~1'
```

---

## 📚 REFERENCIAS RÁPIDAS

### Documentos Clave

1. **gemini-claude-sync.md** - Comandos obligatorios para IAs
2. **GLOSARIO_MAESTRO.md** - Referencia de todos los exports
3. **AI_WORK_LOG.md** - Registro de trabajo de IAs
4. **CLAUDE.md** - Manual de instrucciones para IAs

### Scripts Críticos

1. **agent-health-scan.mjs** - Salud del sistema
2. **validate-package-exports.mjs** - Validación de exports
3. **docs-auto-update.mjs** - Auto-actualización de docs
4. **sync-glosarios.mjs** - Sincronización de glosarios

### Directorios Importantes

```
/packages - Código compartido (vigilar cambios)
/apps - Aplicaciones (donde ocurre el trabajo)
/scripts - Herramientas (algunos son solo para ti)
/.github - CI/CD (cambios requieren tu aprobación)
```

---

## 🎯 CHECKLIST DIARIO PARA EDUARDO

### ☀️ Mañana (5 min)
- [ ] Revisar AI_WORK_LOG.md
- [ ] Ejecutar pnpm docs:health
- [ ] Verificar git status
- [ ] Asignar tareas del día a IAs

### 🌤️ Mediodía (2 min)
- [ ] Check rápido de progreso
- [ ] Resolver bloqueadores si hay

### 🌙 Noche (5 min)
- [ ] Revisar trabajo completado
- [ ] Backup (am-backup)
- [ ] Planificar día siguiente
- [ ] Actualizar AI_WORK_LOG.md si es necesario

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

1. **Hoy:** Prueba los comandos de control y familiarízate
2. **Esta semana:** Establece rutina diaria con las IAs
3. **Este mes:** Optimiza flujos basado en métricas
4. **Trimestre:** Evalúa qué IA es más efectiva para qué tareas

---

**RECUERDA:** Tú tienes el control total. Las IAs son herramientas poderosas pero necesitan dirección clara y límites firmes. Usa esta guía para maximizar productividad mientras mantienes seguridad y calidad.

**Último consejo:** Si dudas sobre dar un permiso o acceso a una IA, la respuesta es NO. Es mejor ser restrictivo y abrir gradualmente que lo contrario.

---

*Esta guía es confidencial y solo para uso de Eduardo. No compartir con IAs ni terceros.*