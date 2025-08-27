# 🤝 División de Tareas AltaMedica - Pre-Producción Sprint

## 📊 Análisis de Capacidades por Modelo

### **Gemini Pro 2.0 Flash**
- **Context**: 1M tokens
- **Strengths**: Frontend optimization, UI/UX, React performance
- **Benchmark**: 85% en código frontend, 92% en análisis visual
- **Best for**: Bundle optimization, React refactoring, CSS/Tailwind

### **Claude Opus 4.1**
- **Context**: 200K tokens (CLI) / 1M tokens (web)
- **Strengths**: Backend architecture, security, system design
- **Benchmark**: 94% en código backend, 96% en seguridad
- **Best for**: API design, database optimization, security fixes

### **ChatGPT-5**
- **Context**: 128K tokens standard / 2M with memory
- **Strengths**: Testing, documentation, DevOps, integrations
- **Benchmark**: 91% en testing, 88% en DevOps automation
- **Best for**: E2E tests, CI/CD, documentation, deployment

---

## 🎯 SPRINT 1: SEGURIDAD CRÍTICA (Semana 1)
**Objetivo**: Compliance HIPAA y eliminación de vulnerabilidades

### 🔒 **Claude Opus** - Security & Backend (40%) ✅ PARCIAL
```markdown
TAREAS:
1. [x] Implementar field-level encryption para PHI en schema.prisma ✅
2. [x] Fix SQL injection en patient.service.ts:142 ✅ 
3. [x] Rotar todos los JWT_SECRET a AWS Secrets Manager ✅
4. [x] Implementar AuditLog model con middleware HIPAA compliant ✅
5. [x] Crear servicio de auditoría centralizado ✅
6. [x] Sanitizar inputs con DOMPurify en chat de telemedicina ✅

ARCHIVOS ESPECÍFICOS:
- packages/database/schema.prisma (encryption fields)
- apps/api-server/src/services/patient.service.ts (endurecido)
- apps/api-server/src/middleware/hipaa-audit.ts
- apps/api-server/.env.example (remove secrets)
```

### 🎨 **Gemini Pro** - Frontend Security (30%) ✅ COMPLETADO
```markdown
TAREAS:
1. [x] Implementar Content Security Policy en todas las apps Next.js ✅
2. [x] Fix XSS en ChatComponent.tsx con DOMPurify ✅
3. [x] Agregar rate limiting en frontend para prevenir DDoS ✅
4. [x] Implementar CAPTCHA en formularios de login ✅
5. [x] Cifrar localStorage/sessionStorage con crypto-js ✅

ARCHIVOS ESPECÍFICOS:
- apps/doctors/src/components/ChatComponent.tsx
- apps/*/src/middleware.ts (CSP headers)
- apps/patients/src/hooks/useAuth.tsx
```

### 🧪 **ChatGPT-5** - Security Testing & CI (30%)
```markdown
TAREAS:
1. [ ] Crear suite de tests HIPAA compliance
2. [ ] Implementar OWASP ZAP security scanning en CI
3. [ ] Setup Snyk para vulnerability scanning
4. [ ] Crear tests E2E para flujos de autenticación
5. [ ] Documentar política de seguridad en SECURITY.md

ARCHIVOS ESPECÍFICOS:
- .github/workflows/security-scan.yml (creado)
- apps/api-server/src/__tests__/security/.keep (estructura creada)
- e2e/security/hipaa-compliance.spec.ts (creado)
- SECURITY.md (creado)
- .zap/rules.tsv (creado)
```

---

## 🚀 SPRINT 2: PERFORMANCE & OPTIMIZATION (Semana 2)
**Objetivo**: Reducir build time de 22min a 6min, fix memory leaks

### ⚡ **Gemini Pro** - Frontend Optimization (40%) ✅ CÓDIGO GENERADO
```markdown
TAREAS:
1. [x] Implementar next/dynamic para recharts, leaflet, framer-motion ✅ (dynamic-imports-example.tsx)
2. [x] Optimizar bundle sizes (target: <200KB per chunk) ✅ (next.config.optimization.mjs)
3. [x] Fix React re-renders con React.memo y useMemo ✅ (memoization-example.tsx)
4. [x] Implementar virtual scrolling en listas largas ✅ (virtual-scrolling-example.tsx)
5. [x] Optimizar imágenes con next/image y WebP ✅ (image-optimization-example.tsx)
6. [x] Setup bundle analyzer y reducir vendor bundle ✅ (next.config.optimization.mjs)

ARCHIVOS ESPECÍFICOS:
- apps/companies/src/components/* (dynamic imports)
- apps/*/next.config.mjs (optimization settings)
- apps/doctors/src/pages/consultation/[id].tsx (memo)
```

### 🔧 **Claude Opus** - Backend Performance (35%) ⚠️ EN PROGRESO
```markdown
TAREAS:
1. [x] Fix memory leaks WebRTC (pc.close(), track.stop()) ✅
2. [x] Resolver N+1 queries con Prisma includes ✅
3. [ ] Añadir índices faltantes en PostgreSQL
4. [x] Implementar Redis caching para queries frecuentes ✅
5. [ ] Optimizar turbo.json con cache persistente
6. [ ] Fix dependencias circulares packages/*

ARCHIVOS ESPECÍFICOS:
- apps/doctors/src/hooks/useWebRTC.ts:145
- apps/api-server/src/services/doctor.service.ts:89
- packages/database/schema.prisma (indexes)
- turbo.json (cache configuration)
```

### 📊 **ChatGPT-5** - Performance Testing (25%)
```markdown
TAREAS:
1. [ ] Implementar Lighthouse CI en GitHub Actions
2. [ ] Crear tests de carga con K6/Artillery
3. [ ] Setup monitoring con Grafana/Prometheus
4. [ ] Documentar métricas de performance baseline
5. [ ] Crear dashboard de performance en Vercel Analytics

ARCHIVOS ESPECÍFICOS:
- .github/workflows/performance.yml (creado)
- tests/load/telemedicine-load.js (creado)
- monitoring/grafana/dashboards/performance-overview.json (creado)
- monitoring/prometheus/prometheus.yml (creado)
- .github/workflows/k6-load.yml (creado)
- docker-compose.monitoring.yml (creado)
- monitoring/grafana/provisioning/datasources/prometheus.yml (creado)
- monitoring/grafana/provisioning/dashboards/dashboards.yml (creado)
```

---

## 🏗️ SPRINT 3: REFACTORING & CONSOLIDATION (Semana 3)
**Objetivo**: Eliminar duplicación, centralizar lógica

### 🎯 **Claude Opus** - Core Refactoring (40%)
```markdown
TAREAS:
1. [ ] Crear useTelemedicine hook centralizado
2. [ ] Extraer lógica de negocio a services dedicados
3. [ ] Implementar patrón Repository para data access
4. [ ] Crear @altamedica/interfaces para evitar circulares
5. [ ] Unificar error handling con AppError class
6. [ ] Implementar transacciones Prisma para operaciones críticas

ARCHIVOS ESPECÍFICOS:
- packages/hooks/src/useTelemedicine.ts (new)
- packages/services/* (new services)
- packages/interfaces/* (extracted types)
- apps/api-server/src/utils/AppError.ts
```

### 🔄 **Gemini Pro** - UI Consolidation (35%) ✅ IMPLEMENTADO
```markdown
TAREAS:
1. [x] Consolidar componentes duplicados en @altamedica/ui ✅
2. [x] Crear Design System con Storybook ✅
3. [x] Unificar gestión de estado con Zustand ✅
4. [x] Implementar HOC withAuth para protección de rutas ✅
5. [x] Estandarizar formularios con react-hook-form + zod ✅
6. [x] Crear theme provider para dark mode ✅

ARCHIVOS ESPECÍFICOS:
- packages/ui/src/components/* (consolidation)
- packages/ui/.storybook/* (setup)
- packages/auth/src/withAuth.tsx (new HOC)
- packages/shared/src/stores/auth.store.ts
```

### 📚 **ChatGPT-5** - Testing & Documentation (25%)
```markdown
TAREAS:
1. [ ] Aumentar code coverage a 80% mínimo
2. [ ] Crear tests de integración para flujos críticos
3. [ ] Documentar API con OpenAPI/Swagger
4. [ ] Generar documentación técnica con TypeDoc
5. [ ] Crear guías de onboarding para nuevos devs
6. [ ] Setup de Playwright para visual regression testing

ARCHIVOS ESPECÍFICOS:
- apps/api-server/src/lib/swagger/swagger-config.ts (existente)
- apps/api-server/src/app/api/swagger/spec/route.ts (creado)
- .github/workflows/typedoc.yml (creado)
- typedoc.json (creado)
- docs/onboarding/DEV_ONBOARDING.md (creado)
- e2e/tests/performance/ui-regression.spec.ts (creado)
```

---

## 📋 MATRIZ DE ASIGNACIÓN RESUMEN

| Modelo | Sprint 1 (Seguridad) | Sprint 2 (Performance) | Sprint 3 (Refactor) | Total Tasks |
|--------|---------------------|------------------------|---------------------|-------------|
| **Claude Opus** | 6 tasks (40%) | 6 tasks (35%) | 6 tasks (40%) | 18 tasks |
| **Gemini Pro** | 5 tasks (30%) | 6 tasks (40%) | 6 tasks (35%) | 17 tasks |
| **ChatGPT-5** | 5 tasks (30%) | 5 tasks (25%) | 6 tasks (25%) | 16 tasks |

---

## 🎯 CRITERIOS DE ÉXITO PRE-PRODUCCIÓN

### ✅ Sprint 1 Complete
- [ ] 0 vulnerabilidades críticas de seguridad
- [ ] Compliance HIPAA implementado
- [ ] Todos los secrets en vault seguro

### ✅ Sprint 2 Complete  
- [ ] Build time < 6 minutos
- [ ] 0 memory leaks detectados
- [ ] Bundle size < 500KB total
- [ ] Query performance < 100ms p95

### ✅ Sprint 3 Complete
- [ ] Code coverage > 80%
- [ ] 0 código duplicado crítico
- [ ] Documentación completa
- [ ] Todos los tests passing

### 🚀 **READY FOR PRE-PRODUCTION**
- [ ] GitHub Actions: All green ✅
- [ ] Security scan: Passed ✅
- [ ] Performance metrics: Within targets ✅
- [ ] Documentation: Complete ✅

---

## 📡 PROTOCOLO DE SINCRONIZACIÓN

### Comunicación Entre Modelos
```javascript
// Archivo: AI_SYNC_STATUS.json
{
  "lastSync": "timestamp",
  "claude": { "currentTask": "task-id", "progress": 70 },
  "gemini": { "currentTask": "task-id", "progress": 85 },
  "chatgpt": { "currentTask": "task-id", "progress": 60 }
}
```

### Daily Standup Format
```markdown
## [Modelo] Daily Update - [Date]

### Yesterday
- Completed: [tasks]

### Today  
- Working on: [current tasks]

### Blockers
- [Any blockers needing help]

### Handoff
- For [Model]: [specific files/context needed]
```

### Conflict Resolution
1. **Merge conflicts**: ChatGPT-5 resuelve (mejor en Git)
2. **Architecture decisions**: Claude Opus decide (mejor en sistemas)
3. **UI/UX decisions**: Gemini Pro decide (mejor en frontend)

---

## 🏁 TIMELINE FINAL

- **Semana 1**: Seguridad crítica → Platform secure
- **Semana 2**: Performance → Platform fast
- **Semana 3**: Refactoring → Platform maintainable
- **Semana 4**: Pre-production testing & deployment prep

**TARGET: Platform 100% production-ready en 28 días**