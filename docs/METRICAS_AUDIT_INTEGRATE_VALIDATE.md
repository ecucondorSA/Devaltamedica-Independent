# Métricas Definidas por Worktree (Auditor, Integrador, Validador)

Objetivo: estandarizar medición y trazabilidad para que cada worktree (AUDIT/INTEGRATE/VALIDATE) produzca resultados consistentes y un score realista.

---

## 🔍 Auditor (AUDIT)

### Objetivos

- Eliminar duplicaciones y código huérfano
- Endurecer seguridad base (CSP, CORS, CSRF, rate-limit, helmet)
- Asegurar que los middlewares críticos se aplican realmente

### KPIs y Umbrales

- Duplicaciones eliminadas: ≥ 100% de las detectadas por el script
- Middlewares aplicados vs definidos: 100% aplicados (0 huérfanos)
- Seguridad estática (checklist): ≥ 90% ítems PASSED
  - Helmet configurado (CSP/HSTS/nosniff/referrer-policy)
  - CSP sin 'unsafe-inline'/'unsafe-eval'
  - CORS con dominios conocidos (sin regex amplio en prod)
  - CSRF doble envío activo y exceptuado solo en endpoints iniciales controlados
  - Rate limit global y específicos activos
- Evidencia por hallazgo crítico: 100% con cita (ruta + líneas)

### Cómo medir

```powershell
# Duplicaciones
powershell -File scripts/find-duplications.ps1

# Helmet / CSRF / Rate limit / JWT
rg "helmet\(|csrf|issueCsrfToken|express-rate-limit|jwt\.verify|jsonwebtoken" -n apps/

# Nginx: CSP endurecida
rg "Content-Security-Policy|unsafe-inline|unsafe-eval" -n config/nginx/

# Middlewares realmente aplicados
rg "app\.use\(csrfMiddleware\)|initializeMiddlewares\(|app\.use\(globalRateLimiter" -n apps/api-server/src
```

### Capacidades Avanzadas (Recomendadas)

- SAST/Secret Scanning: revisión de patrones sensibles (keys, tokens) y funciones criptográficas inseguras.
- Supply Chain: SBOM + licencias + vulnerabilidades (npm audit/pnpm audit) y políticas de licencia (deny-list).
- Threat Modeling (STRIDE): identificar amenazas por módulo; documentar mitigaciones.
- Infra Config Review: Nginx/Headers, CSP nonces/hashes, HSTS, cookies (HttpOnly, SameSite), TLS policy.
- Config Drift: detectar divergencias entre apps en `next.config.mjs` y `packages/config-next`.

---

## 🔗 Integrador (INTEGRATE)

### Objetivos

- Conectar features existentes (sin crear nuevas)
- Asegurar flujos SSO/seguridad completos en UI ↔ API
- Documentar contratos API usados (headers, cookies, status)

### KPIs y Umbrales

- Features integradas (prioritarias) / mapeadas: ≥ 90%
- Flujos SSO conformes: 100% (login → session-login → session-verify → redirect por rol)
- CSRF en métodos mutables (POST/PUT/PATCH/DELETE): ≥ 95% con `x-csrf-token`
- CORS efectivo: 100% peticiones con orígenes esperados y sin duplicidad de headers
- Contratos API documentados para endpoints integrados: ≥ 90%
- Errores de consola (navegador) en flujos críticos: 0

### Cómo medir

```powershell
# Mapa de features
powershell -File scripts/map-existing-features.ps1

# E2E (tags de integración)
playwright test --grep "@integracion|@sso"

# CORS / CSRF sanity checks
rg "allowedHeaders|origin\:" -n apps/api-server/src/server.ts
rg "fetch\(.*(POST|PUT|PATCH|DELETE).*x-csrf-token" -n apps/*/src
```

### Capacidades Avanzadas (Recomendadas)

- Contract Testing (API): snapshot/diff de esquemas (OpenAPI/JSON shape) para detectar breaking changes.
- Backward Compatibility: pruebas de compatibilidad de versiones cliente-servidor (+1/-1 versiones).
- Circuit Breakers/Feature Flags: integración segura detrás de flags, con rollback plan.
- Matriz de Integración Cross-App: rutas y permisos por rol entre apps (Patients/Doctors/Companies/Admin).
- DB Migrations Dry-Run: validación de migraciones y rollback scripts antes de integrar flujos que dependan de datos.

---

## ✅ Validador (VALIDATE)

### Objetivos

- Validar calidad global (testing, seguridad, performance)
- Certificar estado GO/NO-GO con evidencia

### KPIs y Umbrales

- Cobertura global Jest: ≥ 80% (branches, functions, lines, statements)
- E2E flujos críticos (login, dashboard, CRUD, SSO): ≥ 95% passed
- Seguridad E2E (rate-limit y CSRF): 100% passed
- Performance:
  - Lighthouse Desktop ≥ 90, Mobile ≥ 85
  - TTI < 5s (3G) y LCP < 2.5s
- API: P95 latencia < 500ms, errores 5xx < 0.5%
- Evidencia de cada check: reporte + citas

### Cómo medir

```powershell
# Coverage (Jest)
node -e "console.log(require('./coverage/coverage-summary.json').total)"

# E2E
playwright test --reporter=json,line

# Lighthouse
pnpm lighthouse

# Web Vitals (web-app)
pnpm --filter @altamedica/web-app web-vitals
```

### Capacidades Avanzadas (Recomendadas)

- DAST básico (scan de endpoints QA), validación de headers de seguridad y cookies.
- Load/Soak Testing: pruebas de carga y resistencia con SLOs definidos (P95 < 500ms; error rate < 0.5%).
- Flakiness Control: tasa de flakiness E2E < 2%, con cuarentena automática de tests.
- Observabilidad: verificación de dashboards (Grafana), alertas y KPIs de negocio.
- DORA Metrics: lead time for changes, change failure rate, MTTR, deployment frequency (si aplica en CI/CD).

---

## 📏 Scoring y Trazabilidad

- AUDIT: Duplicaciones (30%), Seguridad estática (50%), Middlewares aplicados (20%)
- INTEGRATE: Features integradas (35%), SSO/CSRF/CORS (45%), Contratos API (20%)
- VALIDATE: Coverage (30%), E2E críticos (30%), Seguridad E2E (20%), Performance (20%)

Regla: Ningún punto suma sin evidencia citada (ruta + líneas / reporte).

---

## 🧪 Niveles de Madurez por Rol (L1–L5)

- L1 (Básico): métricas principales registradas manualmente, evidencia parcial.
- L2 (Fundacional): checklist completo por rol, evidencia obligatoria.
- L3 (Estandarizado): automatización parcial (scripts) y reportes en CI.
- L4 (Avanzado): quality gates en CI con thresholds; reportes firmados por rol.
- L5 (Excelencia): alertas proactivas, dashboards, tendencias y mejoras continuas.

---

## 🚫 Criterios de Bloqueo (Quality Gates)

- CSP insegura (unsafe-inline/eval) en producción → NO-GO
- coverageThreshold global < 80% → NO-GO
- E2E críticos < 95% o flakiness > 2% → NO-GO
- CSRF/Rate-limit fallidos en E2E → NO-GO
- CORS con orígenes no autorizados en producción → NO-GO

---

## 📦 Artefactos de Evidencia Requeridos

- Auditor: `sbom.json` (opcional), `security-static-checklist.md`, citas (ruta+líneas)
- Integrador: `api-contracts/*.md` (contratos utilizados), `integration-matrix.md`, registros E2E con tags `@integracion`
- Validador: `coverage/coverage-summary.json`, `playwright-report/`, `lighthouse-*.html`, `api-latency-report.json`
