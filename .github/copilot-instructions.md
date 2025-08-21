# 🤖 AltaMedica – Guía Rápida para Agentes de IA (Copilot)

Objetivo: que puedas producir cambios útiles desde el minuto 3 en este monorepo pnpm con Next.js (App Router) y backend centralizado. Siempre migre,solidifique, unifique archivos duplicados y evite duplicar lógica. OBLIGATORIO ACTUALIZAR ARCHIVOS COMO CLAUDE.MD Y README.md DESPUES DE REALIZAR CAMBIOS.

1) Arquitectura esencial
- apps/*: frontends (Next 14/15). api-server: backend central. packages/*: UI, tipos, hooks, clientes.
- Seguridad/HIPAA: sesiones JWT solo en cookies HttpOnly/Secure emitidas por api-server. Nunca uses localStorage para tokens.
- Tipos y validaciones: @altamedica/types (TS + Zod) es el contrato entre frontend y backend.

2) Flujos clave (ejemplos reales)
- Autenticación: Cliente obtiene Firebase idToken → POST a api-server (/api/v1/auth/*) → api-server valida y setea cookies → frontend redirige según rol.
- Data fetching: TanStack Query + hooks compartidos. Envuelve apps con QueryProvider y AuthProvider (ver apps/*/src/app/layout.tsx).

3) Patrones del proyecto que debes seguir
- Leaflet SSR-safe: importa react-leaflet con dynamic(..., { ssr:false }), arregla iconos por defecto y llama map.invalidateSize() cuando cambie el layout.
  - Emite/escucha evento global 'map:invalidate-size' y realiza un invalidate inicial tras montar. Contenedores con h-full w-full.
- Recarga de chunks en dev: handler inline que escucha ChunkLoadError y recarga con ?nocache (apps/companies/src/app/layout.tsx). No existe componente ChunkReload.
- Companies sin Turbopack: ejecuta sin --turbopack (ya ajustado en scripts).
- UI/Tipado: usa @altamedica/ui y @altamedica/types; evita duplicar utilidades que ya están en packages/.

4) Workflows de desarrollo
- Instala dependencias: pnpm install (raíz).
- Dev por app: pnpm --filter <app> dev (ej.: companies, patients, doctors, api-server).
- Build/Lint/Test: pnpm build | pnpm lint:fix | pnpm test. En Windows usa PowerShell (no bash). Hay tareas de VS Code preconfiguradas.

5) Dónde mirar antes de tocar código
- api-server: contratos y lógica (apps/api-server/). Actualiza tipos en @altamedica/types cuando cambie un endpoint.
- Guías por app: apps/companies/CLAUDE.md, apps/patients/CLAUDE.md, etc. Resumen global: /CLAUDE.md.
- Ejemplos de mapas/Hub: apps/companies/src/components/MarketplaceMap.tsx y /src/app/marketplace/page.tsx (evento 'map:invalidate-size', SSR-safe).

6) Reglas operativas mínimas
- Commits: Conventional Commits (ej.: fix(companies): reflow robusto en mapa).
- Al cambiar contratos: actualiza tipos, validaciones Zod y docs del módulo afectado.
- No re-formatees archivos completos; aplica cambios mínimos y coherentes con el estilo existente.

7) Integraciones externas
- Firebase (Auth/Firestore/Storage) v9 modular; usa los wrappers de @altamedica/firebase.
- Observabilidad básica en api-server; no loguees PHI en cliente.

Referencias rápidas: apps/*/CLAUDE.md, packages/*, apps/api-server, tasks de VS Code (dev/build/lint/test).