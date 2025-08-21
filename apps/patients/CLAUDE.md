# CLAUDE.md - App: Patients 🏥

## 🌳 WORKTREE PARA PATIENTS APP

- **Para auditar componentes duplicados**: usar `../devaltamedica-audit/`
- **Para conectar features de pacientes**: usar `../devaltamedica-integrate/`
- **Para validar funcionalidad de pacientes**: usar `../devaltamedica-validate/`
- **Las features de pacientes YA EXISTEN** - solo necesitan integración

## 2025-08-12 – Hotfix telemedicina (hooks y toasts)

- Arreglado error “Module not found: Can't resolve '@altamedica/hooks'” en TelemedicineMVP.
  - Se reemplazó la importación por subpath export: `import { useToast } from '@altamedica/hooks/ui'`.
  - Se eliminó dependencia de componentes no existentes en UI (`ConnectionStatus`), mostrando métricas básicas en badges.
  - Ajuste de API de `useToast` (usa `{ status: 'error' }` en lugar de `variant`).
- next.config.mjs: simplificado (sin alias personalizados) para que Next resuelva `@altamedica/hooks` desde node_modules y use `transpilePackages` del paquete `@altamedica/config-next`.
- Home importa `TelemedicineMVP` mediante el wrapper `TelemedicineClient.tsx` para forzar recompilación limpia y evitar caché stale en dev.

Rutas afectadas: `/` (home con TelemedicinaCard) y `/telemedicine/session/demo`.

## 2025-08-14 – Dockerización optimizada

- Se optimizó `Dockerfile` con stages: base, deps, build, runtime.
- Añadidos labels OCI y `pnpm fetch` para mejor caching.
- `.dockerignore` ampliado para reducir contexto.
- Script de build: `scripts/docker-build-patients.ps1` (ver guía `docs/DOCKER-PATIENTS.md`).
- Healthcheck HTTP simple `/`.
- Preparado para integración de escaneo (flag `-Scan`).

Documentación detallada: `docs/DOCKER-PATIENTS.md`.

# CLAUDE.md - App: Patients 👤

## 🌳 WORKTREE PARA PATIENTS APP

- **Para auditar componentes duplicados**: usar `../devaltamedica-audit/`
- **Para conectar features de pacientes**: usar `../devaltamedica-integrate/`
- **Para validar funcionalidad de pacientes**: usar `../devaltamedica-validate/`
- **Las features de pacientes YA EXISTEN** - solo necesitan integración

## ⚠️ FILOSOFÍA E2E OBLIGATORIA

**CRÍTICO**: Todas las soluciones deben ser **end-to-end (E2E)** - frontend + backend + tipos + testing completo.

### 🎯 Principios E2E

- **Frontend + Backend**: React/Next.js + API routes integrados
- **Datos Médicos**: Cumplimiento HIPAA completo
- **Tipos Compartidos**: Actualizar @altamedica/types
- **Sistemas Unificados**: Usar UnifiedAuthSystem, UnifiedNotificationSystem

## 🎯 Resumen de la Aplicación

- **Propósito:** Portal del paciente para gestión de citas, historial médico y comunicación con doctores
- **Tecnologías:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **Puerto:** 3003
- **Estado:** ✅ **NIVEL EMPRESARIAL** (9.5/10)

### Rutas Principales

- `/dashboard`: Vista principal con próximas citas
- `/appointments`: Gestión completa de citas
- `/medical-history`: Historial médico completo
- `/telemedicine/session/[id]`: Videollamadas médicas
- `/alta-anamnesis`: Asistente IA médico

## 🔌 APIs Principales

| Endpoint                          | Propósito                | Estado             |
| --------------------------------- | ------------------------ | ------------------ |
| `/api/v1/auth/*`                  | Login/registro pacientes | ✅ **PRODUCCIÓN**  |
| `/api/v1/appointments/*`          | Gestión de citas         | ✅ **PRODUCCIÓN**  |
| `/api/v1/medical-records/*`       | Historial médico         | ✅ **PRODUCCIÓN**  |
| `/api/v1/telemedicine/sessions/*` | Videollamadas médicas    | ✅ **EMPRESARIAL** |
| `/api/v1/ai/analyze-symptoms`     | IA médica para síntomas  | ✅ **EMPRESARIAL** |

## 🚀 Funcionalidades Tiempo Real

- ✅ **WebRTC**: Videollamadas HD con doctores
- ✅ **Socket.io**: Notificaciones de citas en tiempo real
- ✅ **AI Chat**: Análisis inteligente de síntomas (369 líneas)
- ✅ **Firestore Listeners**: Cambios automáticos de estado

## 🔗 Integraciones Principales

### Backend Services

- **API Server**: Puerto 3001 - todas las operaciones médicas
- **Signaling Server**: Puerto 8888 - WebRTC para videollamadas
- **Firebase**: Firestore + Auth + Storage + Cloud Messaging

### Packages Utilizados

- **@altamedica/ui**: Sistema de diseño centralizado
- **@altamedica/types**: Tipos y schemas médicos
- **@altamedica/auth**: Autenticación unificada
- **@altamedica/telemedicine-core**: Lógica WebRTC compartida

## 📝 Cambios Recientes

### **Agosto 2025 - Optimizaciones**

- ✅ **Hotfix telemedicina**: Hooks y toasts corregidos
- ✅ **Docker optimizado**: Multi-stage builds implementado
- ✅ **E2E Testing**: Selectores estables añadidos para Playwright

**Documentación detallada**: Ver `/CHANGELOG.md`
