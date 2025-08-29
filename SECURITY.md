# 🔒 Política de Seguridad y Cumplimiento (HIPAA)

Este documento define controles, procedimientos y validaciones técnicas para garantizar seguridad y cumplimiento HIPAA en AltaMedica.

## 1) Estándares y Alcance

- Marco: HIPAA (45 CFR Parts 160 y 164), OWASP ASVS v4.0.3, OWASP Top 10 2021
- Ámbitos: API Server, Apps Next.js (web-app, patients, doctors, companies, admin), Signaling Server, Packages compartidos

## 2) Gestión de Secrets

- Almacenamiento: AWS Secrets Manager (JWT, refresh, DB, claves privadas)
- Prácticas:
  - Nunca commitear secretos en VCS
  - Rotación automática (scripts/infra) y manual de emergencia
  - Variables obligatorias en producción: JWT_SECRET (≥64), JWT_REFRESH_SECRET (≥64)
- Implementación:
  - `apps/api-server/src/config/secrets-loader.ts` (carga en arranque)

## 3) Cifrado y PHI

- En tránsito: TLS 1.2+
- En reposo (PHI): AES-256-GCM (campos sensibles)
- Hash de búsqueda: SHA-256 en campos permitidos (exact match)
- Implementación:
  - Prisma: `packages/database/schema.prisma` y `schema.prisma.encrypted`
  - Servicio: `apps/api-server/src/services/encryption.service.ts`

## 4) Auditoría HIPAA

- Objetivo: registrar acciones CREATE/READ/UPDATE/DELETE/EXPORT y accesos a PHI
- Modelo: `AuditLog` en Prisma
- Middleware: `apps/api-server/src/middleware/hipaa-audit.middleware.ts` (incluye `accessedPHI` y `phiFields`)
- Retención: `DataRetention` (configurable por entidad)

## 5) Endurecimiento de Entrada y Mitigación de Injection

- Sanitización: DOMPurify en frontend y sanitización server-side
- Construcción de queries parametrizada (Firestore/Prisma)
- Ejemplo: `apps/api-server/src/domains/patients/patient.service.ts` (whitelist de sort y sanitización)

## 6) Cabeceras de Seguridad y CSP

- CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Apps Next.js: middleware de seguridad por app

## 7) Control de Acceso, Auth y Sesiones

- UnifiedAuth + RBAC, MFA opcional
- Cookies httpOnly, SameSite=Lax; en prod: Secure

## 8) Scanning y Validación en CI

- OWASP ZAP: `.github/workflows/security-scan.yml`
- Snyk: `.github/workflows/security-scan.yml`
- Lighthouse CI (performance): `.github/workflows/performance.yml`
- K6 (carga): `.github/workflows/k6-load.yml`
- TypeDoc (docs técnicas): `.github/workflows/typedoc.yml`

## 9) Ejecución Local (Security/Perf)

- ZAP Baseline (Docker):
  ```bash
  docker run --rm -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3001 -r zap-report.html
  ```
- Snyk (requiere autenticación):
  ```bash
  snyk test --all-projects
  ```
- Lighthouse (ejemplo simple):
  ```bash
  npx @lhci/cli autorun --collect.url=http://localhost:3000 --upload.target=filesystem
  ```
- K6:
  ```bash
  k6 run tests/load/telemedicine-load.js
  ```

## 10) Incidentes y Respuesta

- Detección: alertas CI/CD, reportes ZAP/Snyk, logs de auditoría HIPAA
- Contención: revocar claves comprometidas (AWS SM), invalidar sesiones, rollback
- Erradicación: parches, rotación de secretos, actualización de dependencias
- Recuperación: revalidación ZAP/Snyk, pruebas E2E y verificación de auditoría
- Post-mortem: documento en `reports/` con causa raíz, acciones y follow-ups

## 11) Criterios de Aceptación (Go/No-Go)

- 0 vulnerabilidades críticas abiertas (Snyk/ZAP)
- Auditoría HIPAA activa y verificable
- Secrets fuera del repo y gestionados en AWS SM
- Build < 6 min; 0 memory leaks reportados
- Coverage ≥ 80%; “Todos los tests passing”

## 12) Operación Segura

- Monitoreo: Prometheus/Grafana (`monitoring/`)
- Rate limiting global + per-endpoint
- Logs estructurados con contexto de usuario y request-id

---

Última actualización: sprint de seguridad.
