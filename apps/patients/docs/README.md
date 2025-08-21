# Altamedica - Frontend Pacientes

## Estructura General

- **Stack:** Next.js, React, TypeScript, Tailwind, PNPM workspaces.
- **Carpetas principales:**
  - `src/app/dashboard`: Dashboard principal del paciente.
  - `src/app/telemedicine`: Flujos de telemedicina (listado y detalle de sesión).
  - `src/components/telemedicine`: Componentes reutilizables para videollamada, chat y controles.
  - `src/hooks`: Hooks centralizados para lógica de negocio (ej: `useTelemedicine`).
  - `src/services`: Servicios y mocks preparados para integración real.

## Flujos Principales

- **Dashboard:**
  - Layout corporativo con header, sidebar y contenido principal.
  - Accesos rápidos a historial médico, resultados, doctores, soporte y telemedicina.
  - Métricas de salud, próximas citas y prescripciones activas.

- **Telemedicina:**
  - Listado de sesiones (mock, preparado para API real).
  - Detalle de sesión con videollamada simulada, chat funcional y controles de sesión.
  - Modularidad total: cada parte es un componente reutilizable.

## Modularidad y Extensión

- **Componentes desacoplados:** Fácil de extender o reemplazar por integración real.
- **Hooks centralizados:** Toda la lógica de estado y acciones está en hooks (`useTelemedicine`, `useDashboardData`, etc.).
- **Mocks claros:** Datos simulados listos para ser reemplazados por llamadas a API.
- **Estilos corporativos:** Uso de Tailwind y componentes UI propios para coherencia visual.

## Puntos de Extensión

- **Integración API:** Reemplazar mocks en hooks y servicios por llamadas reales.
- **Nuevos módulos:** Añadir nuevas rutas y componentes siguiendo la estructura modular.
- **Automatización:** Preparado para orquestación MCP y testing automatizado.

## Notas

- El desarrollo prioriza robustez, claridad y preparación para integración real.
- Los errores en otros módulos no afectan el avance del frontend de pacientes.
- Documentación y comentarios inline en los archivos clave. 