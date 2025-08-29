# Devaltamedica / AltaMedica — Backlog Inicial del Agente

Estado: Inicial • Última actualización: 2025-08-29

## Objetivos Estratégicos
- Gobierno del repo: documentación única de agente y sincronización AI.
- Salud del código: identificar TODO/FIXME/ts-ignore y patrones de riesgo.
- Consistencia de imports/alias y adopción del patrón de tipos en UI.
- Preparar camino para validaciones (type-check/lint/tests) sin instalar dependencias.

## Tareas Globales (Backlog)
- Documentación
  - Unificar referencia canónica de sincronización: usar `gemini-claude-sync.md` y enlazar `GEMINI-CLAUDE-SYNC.md` como alias (o eliminar duplicado con aprobación).
  - Integrar “Agent Quickstart” en `README.md` apuntando a `AGENT.md`.
  - Mantener `AGENT.md` como fuente única de operación del agente.
- Calidad/estándares
  - Escanear y listar: TODO, FIXME, HACK, ts-ignore, eslint-disable, any, console.log en código productivo.
  - Detectar imports relativos frágiles que deberían usar `@altamedica/*`.
  - Auditar uso del patrón de 3 capas (tipos simples + adaptadores) en apps.
- CI/CD (preparación)
  - Definir validaciones focalizadas (sin instalar deps): scope para `type-check` parcial o lints por carpeta cuando sea viable.
- Seguridad/Compliance
  - Verificar no exposición de secretos; buscar claves incrustadas/placeholder sensibles.

## Tareas del Agente (primer ciclo)
1) Añadir escáner de salud del repo y generar reportes JSON/MD.
2) Actualizar `README.md` con Quickstart del Agente y enlace a `AGENT.md`.
3) Consolidar duplicados de sincronización Gemini–Claude (propuesta y plan de cambio).
4) Proponer lote 1 de fixes de bajo riesgo (docs/alias/imports puntuales) basado en reportes.

## Entregables Esperados
- `AGENT_HEALTH_REPORT.json` y `AGENT_HEALTH_REPORT.md` (inventario de issues conocidos).
- `README.md` actualizado con Quickstart.
- Propuesta de consolidación de documentos duplicados.

## Prioridad Inmediata (Lote 1 sugerido)
- Documentación: unificar referencia de sincronización (duplicados `GEMINI-CLAUDE-SYNC.md` y `gemini-claude-sync.md`).
- Código (alcance acotado y seguro):
  - Reemplazar `console.log` por `logger` en código productivo de `packages/shared/src/services/*` (de acuerdo con patrón del repo).
  - Reducir `any` en archivos con mayor concentración si es trivial y sin efectos colaterales:
    - `packages/shared/src/services/patient-data-export.service.ts`
    - `packages/shared/src/services/patient-export/request/request-manager.service.ts`
  - Evitar cambios en tests y workflows al inicio (bajo impacto en producción).
