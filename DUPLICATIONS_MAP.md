# Duplications Map — 2025-08-29

Este informe resume ocurrencias actuales para guiar la consolidación.

- useAuth menciones: 469 (aprox; incluye tests/docs)
- PatientService definiciones: 7
- PatientService imports tipo legacy: N/D (no coincidencias claras con patrón simple)
- api-server console.* en src: 3 (solo en tests de setup)

Notas:
- api-server fue saneado (logs de consola solo en tests), consistente con sincronización.
- useAuth ya consolidado en código productivo; quedan menciones en docs/tests y código no crítico.

Acción propuesta:
- Fase 2: Reemplazar importaciones analíticas residuales a `PatientAnalyticsService` cuando aparezcan; los imports actuales desde `@altamedica/services` continúan válidos.

Fuente:
- Cálculos vía grep local. Para precisión por archivo, ejecutar el escáner y filtros específicos.
