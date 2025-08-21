# AltaMedica - Notas Operativas (Claude)

## Migración de Hosting a Vercel

- Todas las apps Next (`apps/patients`, `apps/doctors`, `apps/companies`, `apps/admin`, `apps/web-app`) se despliegan ahora en Vercel.
- `firebase.json` ya no define sitios de Hosting; Firebase se usa para Auth, Firestore, Storage y Functions (Node 20).
- En Vercel configurar variables `NEXT_PUBLIC_FIREBASE_*` (cliente) y `FIREBASE_SERVICE_ACCOUNT_JSON` (server) por entorno.
- Evitar usar Edge runtime con `firebase-admin`. Para server actions o API handlers con Admin usar `export const runtime = 'nodejs'`.

## Versiones alineadas del monorepo

- React 19, React DOM 19
- Next.js 15.3.4
- TypeScript 5.5.4
- firebase (web) 11.10.0, firebase-admin 13.4.0
- Node 20

## TypeScript y paths

- Nueva base `tsconfig.base.json` en la raíz; todas las apps/paquetes la extienden.
- Paths monorepo: `@altamedica/*` resuelve a `packages/*/src` y `packages/*/dist`.

## Deploy

- Vercel: cada app como proyecto apuntando a su subdirectorio `apps/<app>`.
- Firebase: `firebase deploy --only functions,firestore,storage`.

# 📜 Manual de Operaciones para IA: Desarrollo Full-Stack Acelerado en AltaMedica

## 🚨🚨🚨 ADVERTENCIA CRÍTICA PARA CLAUDE - LEER PRIMERO 🚨🚨🚨

**CLAUDE PARA EMPEZAR NO EJECUTE ACCIONES DE BUILD, LINT, TSC. LA RAZÓN ES QUE TUS TIMEOUT INTERPRETA COMO ERROR Y EMPIEZA A CREAR ARCHIVOS REDUNDANTES, POR LO TANTO LOS PNPM YO LOS EJECUTO MANUALMENTE.**

### ❌ COMANDOS PROHIBIDOS - NUNCA EJECUTAR:

- `pnpm build`, `pnpm lint`, `pnpm type-check`, `pnpm test`
- `tsc`, `tsup`, `npm run build`
- `npm install` o `pnpm install`
- NINGÚN comando de compilación, validación o instalación

### ✅ ÚNICO PERMITIDO:

- Leer archivos con herramientas Read/Grep/LS
- Escribir/editar código con Edit/Write
- Crear documentación
- Análisis y reportes

**Versión 4.6 - Última actualización: 20 de agosto de 2025**

## ✅ INSTALACIÓN DE DEPENDENCIAS COMPLETADA

### 📊 Estado Actual de Dependencias

- **Total dependencias instaladas:** 245+ packages
- **Apps con testing habilitado:** 6/6 (100%)
- **Dependencias críticas resueltas:** 100%
- **Funcionalidades críticas habilitadas:** 100%

### ✅ Dependencias Críticas Instaladas

- **Testing:** vitest, supertest, node-mocks-http, @testing-library/react, @testing-library/jest-dom
- **Peer Dependencies:** 100% satisfechas (React, Next.js, build tools)
- **Funcionales:** @sentry/nextjs, @react-three/fiber, three, framer-motion, cypress

### 📋 Reporte Completo

Ver: `DEPENDENCIES_INSTALLATION_PROGRESS.md` - Reporte completo de instalación exitosa

### ✅ Funcionalidades Habilitadas

- **Testing completo** habilitado en 6 apps
- **Build sin errores** por dependencias
- **Funcionalidades críticas** operativas (WebRTC, pagos, monitoring)

## 🔧 CORRECCIONES APLICADAS - CI/CD FUNCIONANDO

### 🚨 Problemas Resueltos (20/08/2025)

#### **Error Principal: Lockfile Desincronizado**

- **Package afectado**: `@altamedica/telemedicine-core`
- **Dependencias faltantes**: `@types/express-rate-limit`, `@types/ioredis`, `@types/minimatch`
- **Solución**: Agregadas dependencias y sincronizado lockfile

#### **Configuración TypeScript Corregida**

- **Problema**: `"incremental": true` causando fallos en DTS build
- **Solución**: Removido del tsconfig.json raíz
- **Archivo corrupto**: `tsconfig.tsbuildinfo` eliminado

#### **Estado Actual**

- ✅ **Build exitoso**: Todos los packages compilan
- ✅ **Dependencias sincronizadas**: 100%
- ✅ **Type Check**: Sin errores
- 🟡 **GitHub Actions**: Listo para re-ejecución

### 📋 Próximos Pasos

1. Commit y push de correcciones
2. Re-ejecutar GitHub Actions
3. Verificar que todos los jobs pasen

## 🆕 AGENTES IA: Oportunidades de Alto Valor

### 📊 ROI Proyectado Total

- **Companies**: $350,000 USD/año por empresa
- **Professionals**: $35,000 USD/año por profesional
- **Total caso base**: $490,000 USD/año | **ROI**: 1,533% | **Payback**: 2.2 meses

**Análisis detallado**: Ver `docs/AI-AGENTS-ANALYSIS.md`

## 🤖 Configuración GPT-5 Optimizada para AltaMedica

### Parámetros API Recomendados

```yaml
# Configuración base para desarrollo médico
reasoning_effort: 'high' # Para features médicas críticas
verbosity: 'low' # Global para respuestas concisas
verbosity_override:
  code_generation: 'high' # Código detallado y legible

# Configuración por contexto
medical_emergency:
  reasoning_effort: 'high'
  tool_budget: unlimited
  confirmation: false

routine_operations:
  reasoning_effort: 'medium'
  tool_budget: 5
  confirmation: selective

sensitive_operations:
  reasoning_effort: 'high'
  tool_budget: 2
  confirmation: always
```

### Responses API Integration

- **Migrar de Chat Completions a Responses API** para persistencia de razonamiento
- **Mejora esperada**: +25% en tareas médicas complejas, -60% latencia
- **Use case principal**: Sesiones largas de telemedicina con WebRTC

### Prompts Estructurados XML

El proyecto ahora incluye plantillas optimizadas en `/prompts/`:

- `medical-features.xml` - Desarrollo de features médicas con HIPAA
- `telemedicine-webrtc.xml` - WebRTC y videollamadas optimizadas
- `compliance-hipaa.xml` - Seguridad y cumplimiento regulatorio

### Tool Preambles Médicos

```xml
<tool_preambles>
  <before_medical_operation>
    🏥 Iniciando operación médica segura...
    Plan: [1] Validar permisos [2] Encriptar PHI [3] Ejecutar [4] Auditar
  </before_medical_operation>

  <progress_update>
    ✅ Completado: [TAREA]
    🔄 En progreso: [ACTUAL]
    ⏭️ Siguiente: [PROXIMA]
  </progress_update>
</tool_preambles>
```

### Metaprompting para Optimización

Usar GPT-5 para mejorar sus propios prompts:

```bash
# Script disponible para metaprompting
powershell -File scripts/gpt5-metaprompt.ps1 -Prompt "current_prompt.xml"
```

## 🛡️ Compliance y Seguridad

### Estado Actual

- **Sistema de auditoría con hash chain**: ✅ Implementado y funcionando
- **Compliance HIPAA**: ✅ 98% cobertura en tests automatizados
- **Referencias legales**: Ley 25.326, Ley 26.529 Art. 15, Ley 27.706, RG AFIP 4291/2018

### Fases de Implementación

- **Fase MVP**: Registro mínimo obligatorio (timestamp, userId, action, resource) ✅
- **Fase Avanzada**: Integridad criptográfica, verificación batch, métricas ✅

**Detalles completos**: Ver `CHANGELOG.md` para historial de cambios de seguridad

## 🎉 ESTADO ACTUAL DEL PROYECTO

### **Progreso de Consolidación Completado**

- **Duplicación reducida**: 25-30% → ~15% ✅
- **Servicios unificados**: 10/10 completados ✅
- **Backwards compatibility**: 100% mantenida ✅
- **Testing coverage**: 1,894 líneas test médico crítico ✅

### **Sistemas Unificados Principales**

- ✅ **UnifiedTelemedicineService**: 3 servicios → 1 centralizado (365 líneas)
- ✅ **@altamedica/anamnesis**: Paquete completo historia clínica (630 líneas)
- ✅ **useMedicalHistoryUnified.ts**: Consolidación hooks médicos (1,074 líneas)
- ✅ **useTelemedicineUnified.ts**: Telemedicina empresarial (858 líneas)
- ✅ **UnifiedNotificationSystem**: 90% reducción duplicación servicios

**Detalles históricos completos**: Ver `CHANGELOG.md`

Tu rol es ser un **EXPERTO EN CODIFICACIÓN EFICIENTE**. Tu misión principal es:

1. **BUSCAR** código existente antes de crear nuevo
2. **REUTILIZAR** componentes, hooks y tipos de packages
3. **ELIMINAR** duplicaciones inmediatamente al detectarlas
4. **NUNCA** crear archivos duplicados (layout.tsx, layoutSimple.tsx, etc.)

**REGLA DE ORO**: Si ya existe en `packages/*`, REUTILIZAR. Si no existe, verificar 3 veces antes de crear.

**IMPORTANTE**: Usar el worktree correcto según la tarea:

- Para eliminar duplicaciones: usar `devaltamedica-audit`
- Para conectar features: usar `devaltamedica-integrate`
- Para validar: usar `devaltamedica-validate`
- NUNCA mezclar tareas entre worktrees

## Capítulo 1: La Filosofía - Por Qué Trabajamos Así

Entender _por qué_ nuestra base de código está estructurada de esta manera es crucial para tomar las decisiones correctas. Nuestro monorepo (`pnpm` con `turborepo`) no es solo una colección de carpetas; es un sistema diseñado para:

- **Máxima Reutilización:** El código escrito una vez en un `package` sirve a todas las aplicaciones, presentes y futuras. Esto acelera radicalmente el desarrollo.
- **Consistencia Absoluta:** Todas nuestras aplicaciones se sienten como una sola plataforma unificada porque comparten los mismos componentes de UI, tipos de datos y lógica de cliente.
- **Mantenibilidad Centralizada:** Un cambio en una regla de negocio en el `api-server` se aplica instantáneamente a todos. Una corrección de un bug en un componente de `@altamedica/ui` lo arregla en todas partes.
- **Separación de Intereses Clara:**
  - `apps/`: Se preocupan de la **presentación** (el "qué ve el usuario").
  - `packages/`: Proveen las **herramientas** (los "bloques de construcción").
  - `apps/api-server/`: Impone la **lógica y la verdad** (las "reglas del juego").

## Capítulo 2: Anatomía del Ecosistema AltaMedica

Debes tener un mapa mental claro de nuestro territorio.

- `apps/`: **Los Consumidores.**
  - Son los puntos de entrada para los usuarios (`patients`, `doctors`, `admin`, etc.).
  - Su principal responsabilidad es **orquestar la experiencia del usuario**.
  - **NO** deben contener lógica de negocio crítica.
  - **SÍ** deben consumir hooks y componentes de los `packages`.
  - **SÍ** deben comunicarse exclusivamente con el `api-server` para cualquier operación de datos.

- `packages/`: **La Caja de Herramientas Compartida.**
  - `@altamedica/types`: **EL CONTRATO.** Este es posiblemente el paquete más importante. Define la "verdad" sobre la forma de nuestros datos (`Patient`, `Appointment`, `MedicalRecord`, etc.) usando **TypeScript** y **Zod**. Actúa como un contrato vinculante entre el `api-server` y los frontends. Si el backend envía un `User` y el frontend espera un `User`, ambos deben importar y usar el mismo tipo `User` de este paquete. Esto elimina una clase entera de errores de integración.
  - `@altamedica/ui`: **EL SISTEMA DE DISEÑO.** La fuente de verdad para todos los elementos visuales, basado en **Tailwind CSS + Radix UI**. Si necesitas un botón, importas `{ Button } from '@altamedica/ui'`. Nunca debes escribir `<button className="...">` manualmente. Esto asegura consistencia visual y de accesibilidad.
  - `@altamedica/auth`: **EL GUARDIÁN.** Contiene toda la lógica de cliente para la autenticación. Los hooks como `useAuth()`, los proveedores de contexto y las funciones para iniciar/cerrar sesión viven aquí. Ninguna `app` debe implementar su propia lógica de autenticación.
  - `@altamedica/hooks`: **LA LÓGICA REUTILIZABLE.** Hooks de React que encapsulan lógica de cliente no relacionada con la autenticación pero que puede ser compartida (ej. `useDebounce`, `useLocalStorage`, etc.).
  - `@altamedica/api-client`: (O similar) Aquí residen las configuraciones del cliente de API (ej. una instancia de `axios` preconfigurada con interceptores) y los hooks de **TanStack Query** que son reutilizables en múltiples aplicaciones.

- `apps/api-server/`: **EL CEREBRO CENTRAL.**
  - Es la **única autoridad** sobre la lógica de negocio y el estado de la base de datos.
  - **NUNCA confíes en los datos que vienen del cliente.** Valida cada `request` usando los esquemas de Zod definidos en `@altamedica/types`.
  - Todas las interacciones con la base de datos (Firestore, Postgres) deben ocurrir aquí y solo aquí.

## Capítulo 3: Tu Flujo de Trabajo en Acción (Ejemplo Práctico)

**Requerimiento:** "Permitir a los usuarios añadir notas privadas."

**Tu Proceso Mental y Ejecución (Paso a Paso):**

1.  **PRIMERO BUSCAR - NO CREAR:**
    - _Pensamiento:_ "¿Ya existe algo similar en packages?"
    - **Acción:** Busco en `packages/@altamedica/types` si ya existe un tipo Note o similar
    - **Si existe:** REUTILIZAR y extender si es necesario
    - **Si NO existe:** Definir en el lugar correcto:
      ```typescript
      import { z } from 'zod';
      export const NoteSchema = z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
        authorId: z.string().uuid(),
        content: z.string().min(1),
        createdAt: z.date(),
      });
      export type Note = z.infer<typeof NoteSchema>;
      ```

2.  **Construir el Endpoint del Backend:**
    - _Pensamiento:_ "Necesito una API para crear y listar estas notas. Será `POST` y `GET` en `/api/v1/patients/{patientId}/notes`."
    - **Acción:** En `apps/api-server/src/routes/v1/`, creo `notes.routes.ts`. Implemento los controladores que:
      a. Reciben el `request`.
      b. Validan el `patientId` de la URL y el `body` del `request` usando `PatientNoteSchema.omit({ id: true, createdAt: true })`.
      c. Verifican que el usuario autenticado tiene permiso para ver/editar.
      d. Realizan la operación en la base de datos.
      e. Devuelven los datos con el formato del tipo `PatientNote`.

3.  **Crear los Componentes de UI Reutilizables:**
    - _Pensamiento:_ "Necesitaré una lista para mostrar las notas y un formulario para añadirlas. La tarjeta de la nota podría ser reutilizada."
    - **Acción:** En `packages/@altamedica/ui/src/components/`, creo:
      - `NoteCard.tsx`: Un componente que recibe un prop `note: Note` y lo muestra de forma bonita.
      - `NoteForm.tsx`: Un formulario con un `Textarea` y un `Button` (importados de `@altamedica/ui`) que emite un evento `onSubmit` con el contenido.

4.  **Implementar la Lógica de Cliente:**
    - _Pensamiento:_ "Necesito hooks para interactuar con la nueva API de forma eficiente, con caché y manejo de estado."
    - **Acción:** PRIMERO busco si ya existe un hook similar. Si no, creo en `@altamedica/api-client`:
      ```typescript
      // ... imports de react-query, axios, y el tipo Note
      export const useGetNotes = (userId: string) => {
        return useQuery<Note[]>(['notes', userId], fetchNotesFn);
      };
      export const useAddNote = () => {
        const queryClient = useQueryClient();
        return useMutation(addNoteFn, {
          onSuccess: (data) => {
            queryClient.invalidateQueries(['notes', data.userId]);
          },
        });
      };
      ```

5.  **Ensamblar la Feature en la Aplicación Frontend:**
    - _Pensamiento:_ "REUTILIZAR componentes existentes, NO crear nuevos."
    - **Acción:** En la app correspondiente:
      a. Uso el hook `useGetNotes(userId)`.
      b. Mapeo los resultados y renderizo una lista de componentes `<NoteCard />`.
      c. Renderizo el componente `<NoteForm />` y conecto su `onSubmit` al hook `useAddNote`.

## Capítulo 4: Checklist de Finalización de Tarea

Antes de considerar una tarea completada, verifica que has cumplido con lo siguiente:

1.  [ ] **Tipos Centralizados:** ¿Todos los nuevos modelos de datos están definidos en `@altamedica/types` y son usados tanto por el backend como por el frontend?
2.  [ ] **Lógica en el Backend:** ¿Toda la lógica de negocio, validación y acceso a la base de datos reside en el `api-server`?
3.  [ ] **UI Reutilizable:** ¿Los nuevos componentes de UI que podrían ser usados en otro lugar están en `@altamedica/ui`?
4.  [ ] **Sin Duplicación:** ¿He revisado los `packages` existentes para evitar reinventar una función, hook o componente?
5.  [ ] **Flujo de Datos Unidireccional:** ¿El frontend llama al backend para obtener datos, y el backend es la única fuente de verdad?
6.  [ ] **Consistencia:** ¿La nueva funcionalidad se ve y se comporta de manera consistente con el resto de la plataforma?

## Documentación y guías

- Nueva política de imports para evitar imports profundos y `.d.ts` ad-hoc: `docs/IMPORTS_POLICY.md`.

## 📦 ESTÁNDARES OBLIGATORIOS PARA PAQUETES - CRÍTICO

### 🔴 TODA CONFIGURACIÓN DE PAQUETE DEBE SER EXACTAMENTE ASÍ:

```json
{
  "name": "@altamedica/[nombre]",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format=cjs,esm --dts --clean",
    "dev": "tsup src/index.ts --format=esm --watch",
    "type-check": "tsc --noEmit",
    "clean": "rimraf dist"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "tsup": "^8.0.0",
    "rimraf": "^5.0.0"
  },
  "peerDependencies": {
    "react": "^18.2.0 || ^19.0.0"
  }
}
```

### ❌ SI CLAUDE CREA PAQUETES CON ESTOS ERRORES, RECHAZAR:

1. **TypeScript diferente a `^5.8.3`** → INACEPTABLE
2. **Sin `"type": "module"`** → INACEPTABLE
3. **Exportar desde `src/`** → DEBE SER `dist/`
4. **Versión diferente a `1.0.0`** → INACEPTABLE
5. **React diferente a `^18.2.0 || ^19.0.0`** → INACEPTABLE
6. **Sin dual CJS + ESM** → INACEPTABLE
7. **Build con tsc en lugar de tsup** → INACEPTABLE

### 📊 AUDITORÍA ACTUAL:

- **30 paquetes** con 8 versiones diferentes de TypeScript → PROBLEMA
- **3 paquetes** exportando desde src/ → PROBLEMA
- **6 paquetes** sin build real → PROBLEMA
- Ver `packages/PACKAGES_AUDIT_REPORT.md` para detalles completos

## 🚫 CRITICAL: RESTRICCIONES DE HERRAMIENTAS PARA WINDOWS

Para asegurar la compatibilidad con el entorno de desarrollo nativo de Windows 11, debes seguir estas reglas:

### PROHIBICIÓN DE HERRAMIENTAS BASADAS EN BASH/UNIX

**NUNCA USES LA HERRAMIENTA `bash` O COMANDOS UNIX (`sh`, `ls`, `cp`, etc.) directamente.** Estas herramientas ejecutan en un entorno tipo Linux (como Git Bash o WSL) que es incompatible con las rutas de Windows y causa errores.

### HERRAMIENTAS REQUERIDAS PARA WINDOWS

Debes usar **EXCLUSIVAMENTE** estas herramientas para la ejecución de comandos y manipulación del sistema de archivos:

1.  **`run_in_terminal` con PowerShell**: Para cualquier comando de shell, asume que estás en una terminal de PowerShell (`pwsh.exe`).
    - **Ejemplo**: `run_in_terminal(command: "Get-ChildItem -Path .\\packages")`
2.  **Ejecución de Scripts**:
    - **Node.js**: `run_in_terminal(command: "node .\\scripts\\mi-script.js")`
    - **Python**: `run_in_terminal(command: "python .\\tools\\python\\mi-script.py")`
    - **PowerShell**: `run_in_terminal(command: "pwsh -File .\\scripts\\mi-script.ps1")`
3.  **Herramientas de Archivos Nativas**: Utiliza las herramientas `read_file`, `insert_edit_into_file`, `create_file`, etc., para todas las operaciones de archivos. Estas son compatibles con Windows.

### MANEJO DE RUTAS

- Utiliza siempre rutas absolutas cuando sea posible.
- Las herramientas internas manejan la conversión de separadores de ruta, pero cuando escribas comandos para `run_in_terminal`, usa el estilo de Windows (ej. `.\\mi\\ruta`).

Tu estricta adherencia a estos principios es lo que nos permitirá construir una plataforma de clase mundial de manera rápida y sostenible. Bienvenido al equipo.

## Cambios recientes destacados

- Web App migrada a `next.config.mjs` con puente en `next.config.js` (ESM listo para Next 15).
- Billing SaaS E2E (GAP-006 T1–T4) completado: pasarela Stripe + modelos Subscription/Invoice + UI métodos pago + generación automática facturas + webhooks firmados + auditoría estados.
  - Próximos (no bloqueantes demo): Idempotencia persistente, dunning avanzado, reconciliación contable, tax abstraction multi-región.
- Script `scripts/gemini-automation-simple.ps1` actualizado a v1.1.0: ahora detecta y prioriza `pnpm dlx` para ejecutar `@google/gemini-cli` (fallback automático a `npx`). Se añadió versión y mensaje de runner para reducir warnings de npm y alinear con el monorepo pnpm.
- Web App cuenta con `GET /api/health` para el Service Monitor.
- Middleware de rol en Web App endurecido con fallbacks de cookies (`altamedica_token` y legacy) y parseo defensivo de JWT.
- Script `pnpm dev` de Web App apunta a `next dev` (wrapper anterior retirado).
- @altamedica/hooks: entrypoints compilados corregidos para evitar `require('./src')` en `dist/index.js` y habilitar re-exports ESM por submódulo.
- @altamedica/patient-services: `tsconfig.json` ahora extiende `config/base/tsconfig.base.json` y se añadió `@types/minimatch` a devDependencies para resolver typechecks.
- **NUEVO**: QueryProvider unificado en `@altamedica/hooks/providers` con configuraciones preestablecidas (medical, standard, stable) y utilidades de caché centralizadas (QUERY_KEYS, cacheUtils).
- **FASE 2**: Añadidos tests E2E especializados:
  - `telemedicine/recovery-network.spec.ts` (simulación recuperación de red WebRTC, placeholder selectors pendientes de refinar).
  - `a11y/a11y-smoke.spec.ts` (barrido accesibilidad multi-app con `@axe-core/playwright`, filtra impactos serious/critical).
- Instalado `@axe-core/playwright` en `@altamedica/e2e-tests` y navegadores Playwright actualizados.
- Tasks VS Code nuevas: "🎭 E2E Telemedicina" (`@telemedicine`) y "♿ A11y Sweep" (`@a11y`).

### FASE 2 – Telemedicina & Accesibilidad (En progreso)

| Módulo                  | Test                           | Archivo                    | Estado                                     | Próximo Paso                                               |
| ----------------------- | ------------------------------ | -------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| WebRTC Resiliencia      | Recuperación tras caída de red | `recovery-network.spec.ts` | ✅ Creado / ⏳ No ejecutado en esta sesión | Ajustar selectores reales y ejecutar con servicios activos |
| Accesibilidad Multi-App | Smoke WCAG (serious/critical)  | `a11y-smoke.spec.ts`       | ✅ Creado / ⏳ No ejecutado en esta sesión | Ejecutar tras levantar `api-server` + frontends            |

#### Ejecución (manual / tags)

```powershell
# Instalar deps (si faltan)
pnpm install --filter @altamedica/e2e-tests

# Instalar navegadores
pnpm --filter @altamedica/e2e-tests exec playwright install

# Levantar servicios mínimos (en paralelo)
pnpm dev:medical  # patients + doctors + api-server

# Telemedicina únicamente
pnpm --filter @altamedica/e2e-tests exec playwright test -g @telemedicine

# Accesibilidad
pnpm --filter @altamedica/e2e-tests exec playwright test -g @a11y
```

#### Notas técnicas

- El test de recuperación WebRTC actualmente hace `route.abort()` para simular offline; considerar alternar a `browserContext.setOffline(true)` si se habilita contexto Chromium.
- Añadir verificación posterior de re-suscripción de tracks (audio/video) cuando existan selectores definitivos (`[data-test=doctor-video]`).
- A11y: se limita a 4 URLs base; ampliar con rutas críticas (login, dashboard, telemedicina) y generar reporte JSON futuro.

#### Métricas actuales de la sesión

- Dependencias E2E instaladas: ✅ (`@axe-core/playwright` presente)
- Navegadores Playwright instalados: ✅
- Ejecución de nuevos tests: ⏳ Pendiente (bloqueado por puertos ocupados en intento de levantar `api-server`).

#### Próximos pasos recomendados

1. Resolver conflicto de puertos (3001–3003) antes de la primera ejecución real (aplicar script de liberación robusto o reiniciar terminal limpia).
2. Ejecutar suites `@telemedicine` y `@a11y` y guardar salida en `packages/e2e-tests/test-results/` (crear `telemedicine-latest.md` y `a11y-latest.md`).
3. Refinar selectores WebRTC tras inspección DOM real en `doctors` y `patients`.
4. Ampliar checklist de accesibilidad para roles ARIA y contraste (posible integración con pa11y en etapa posterior).

### 2025-08-11: Notas de alias/SSR (Doctors) y E2E Multi-Área

- Dev SSR alias para Doctors:
  - Se añadieron alias en `apps/doctors/next.config.mjs` para resolver `@altamedica/api-client/hooks` y `@altamedica/hooks` durante dev/SSR.
  - Se ajustó `packages/hooks/src/medical/index.ts` para reexportar desde `@altamedica/api-client/dist/hooks`, evitando problemas de resolución de subpath en Next dev.
  - Tras cambios en hooks/client, compila: `pnpm -w -r build --filter @altamedica/hooks --filter @altamedica/api-client` y reinicia Doctors.

- Multi-Área MCP/Playwright:
  - Servicios mínimos: `pnpm dev:min` (api-server, patients, doctors, web-app).
  - Ejecutar tests: `cd packages/e2e-tests && npx playwright test --project=multi-area`.
  - Si companies (3004) no corre, los warnings son esperados y no críticos.

## 🧪 Sistema de Testing con IA

### **Stack Completo Implementado**

- ✅ **AI Testing Engine**: Generación de escenarios médicos automática
- ✅ **MCP Playwright**: Testing E2E multi-área (patients, doctors, companies)
- ✅ **Vitest**: Testing unitario con cobertura médica (85%+)
- ✅ **WebRTC Testing**: 5 suites especializadas para telemedicina
- ✅ **HIPAA Validator**: Validación automática de compliance (98%+)

### **Comandos Principales**

```bash
# Testing completo
pnpm test:all                   # Ejecutar todos los tipos de test
pnpm test:e2e                   # Tests E2E multi-área
pnpm test:webrtc                # Suite WebRTC telemedicina
pnpm test:hipaa                 # Validación HIPAA

# Testing con IA
pnpm test:ai:generate           # Generar escenarios médicos
pnpm multi:medical-journey      # Workflow médico completo
```

**Documentación completa**: Ver `docs/TESTING-COMPLETE.md`

## 🤖 Capítulo 6: Flujo de Trabajo IA con Pre-Check y Lint Automático

**IMPORTANTE**: Para garantizar código de calidad y evitar duplicación, el asistente de IA debe seguir este flujo de trabajo obligatorio:

### 📋 Flujo de Trabajo Estándar para IA

#### 1. **PRE-CHECK OBLIGATORIO** (Antes de cualquier operación)

Siempre ejecutar PRIMERO para visualizar el estado actual y prevenir duplicación:

```bash
# Verificación detallada del estado actual
powershell -NoProfile -File scripts/pre-operation-check.ps1 -Detailed

# O verificación rápida
powershell -NoProfile -File scripts/pre-operation-check.ps1
```

Este script muestra:

- 📁 Estructura del proyecto y archivos recientes
- 🔄 Estado actual de Git (archivos modificados/nuevos)
- 🏥 Servicios médicos en ejecución
- ⚠️ Advertencias sobre posibles duplicaciones

#### 2. **DESARROLLO** (Realizar cambios necesarios)

- Usar herramientas LS/Glob/Grep para explorar archivos
- Verificar sistemas unificados antes de crear nuevos servicios
- Seguir patrones establecidos en el proyecto

#### 3. **POST-LINT AUTOMÁTICO** (Después de cambios)

Al finalizar CUALQUIER sesión de desarrollo, ejecutar:

```bash
# Opción 1: Smart Lint con visualización de archivos
powershell -NoProfile -File scripts/ai-workflow-automation.ps1 -Operation post_development -Verbose

# Opción 2: Lint rápido con Task Master
pnpm lint:fix
```

### 🎯 Comandos Task Master para IA

Estos comandos están preconfigurados en `.vscode/task-master.json`:

| Comando                        | Shortcut     | Descripción                             |
| ------------------------------ | ------------ | --------------------------------------- |
| **PRE-Operation File Check**   | `Ctrl+Alt+B` | Verificación detallada antes de cambios |
| **Quick PRE-Check**            | `Ctrl+Alt+N` | Verificación rápida del estado          |
| **Smart File + Lint Workflow** | `Ctrl+Alt+W` | Post-desarrollo con lint automático     |
| **Quick Lint + File Check**    | `Ctrl+Alt+L` | Lint rápido con visualización           |
| **Project Health Check**       | `Ctrl+Alt+P` | Análisis completo del proyecto          |
| **Smart Package Lint**         | `Ctrl+Alt+Z` | Lint solo de paquetes modificados       |

### 🚨 Reglas Críticas para IA

1. **SIEMPRE ejecutar pre-check antes de crear/modificar archivos**
2. **SIEMPRE ejecutar lint después de cambios de código**
3. **NUNCA crear servicios sin verificar sistemas unificados**
4. **NUNCA omitir el lint al final de la sesión**

### 📊 Scripts de Automatización Disponibles

#### `pre-operation-check.ps1`

- Muestra estado completo del proyecto
- Detecta archivos modificados recientemente
- Advierte sobre posibles duplicaciones
- Verifica servicios en ejecución

#### `ai-workflow-automation.ps1`

- Automatiza workflows completos
- Detecta workspace pnpm inteligentemente
- Ejecuta lint específico por paquete
- Genera logs detallados

#### `post-code-workflow.ps1`

- Workflow simplificado post-código
- Muestra contexto del archivo cambiado
- Ejecuta lint automáticamente
- Interfaz simple para IA

### 💡 Ejemplo de Sesión IA Completa

```bash
# 1. Pre-check antes de empezar
powershell -NoProfile -File scripts/pre-operation-check.ps1 -Detailed

# 2. Desarrollo (crear/editar archivos)
# ... trabajo de desarrollo ...

# 3. Lint automático al finalizar
powershell -NoProfile -File scripts/ai-workflow-automation.ps1 -Operation post_development -Verbose
```

### ⚡ Beneficios del Flujo

- ✅ **Prevención de duplicación**: Pre-check muestra código existente
- ✅ **Calidad garantizada**: Lint automático corrige estilo
- ✅ **Visibilidad completa**: Siempre sabes el estado del proyecto
- ✅ **Conformidad**: Código siempre cumple estándares del proyecto

## 🌳 Capítulo 7: Modelo de Worktrees por Calidad

**CRÍTICO**: Implementamos un modelo de desarrollo usando Git Worktrees separados por calidad para eliminar duplicaciones y garantizar integración perfecta.

### Flujo de Trabajo Obligatorio

```
AUDIT → INTEGRATE → VALIDATE → PRODUCTION
```

### Worktrees Configurados

- `../devaltamedica-audit/` - Eliminar duplicaciones y código muerto
- `../devaltamedica-integrate/` - Conectar features existentes (NO crear nuevas)
- `../devaltamedica-validate/` - Validar que todo funciona
- `../devaltamedica/` - Código production-ready

### Reglas por Worktree

#### En AUDIT:

- SOLO eliminar duplicaciones
- Ejecutar `scripts/find-duplications.ps1` antes de cualquier cambio
- NO crear código nuevo
- Consolidar en packages compartidos

#### En INTEGRATE:

- SOLO conectar features existentes
- NO crear nuevas features
- Verificar con `scripts/map-existing-features.ps1`
- Todas las features YA EXISTEN, solo necesitan conexión

#### En VALIDATE:

- SOLO validar, no modificar
- Ejecutar `scripts/full-validation-suite.ps1`
- Generar reportes de validación
- NO pasar a producción sin 100% validación

### Comandos de Navegación

```powershell
cd ..\devaltamedica-audit      # Para auditoría
cd ..\devaltamedica-integrate  # Para integración
cd ..\devaltamedica-validate   # Para validación
cd ..\devaltamedica           # Para producción
```

### Beneficios del Modelo

1. **Prevención Total de Duplicaciones**: Scripts detectan antes de que Claude actúe
2. **Enfoque Sistemático**: Cada worktree tiene objetivo claro
3. **Calidad Garantizada**: No avanzas sin completar fase anterior
4. **Visibilidad Máxima**: Claude ve todo el proyecto en cada worktree
5. **Separación Mental**: Contexto específico por tarea

## 🐳 Docker Build Optimization

### **Optimización Implementada**

- ✅ **Contexto reducido**: >1.7GB → <150MB
- ✅ **Multi-stage builds**: pnpm + prune pattern
- ✅ **.dockerignore**: Filtrado inteligente manteniendo archivos críticos
- ✅ **Cache optimizado**: Capas estables para dependencies

### **Indicadores Logrados**

- Tiempo transferencia: <150MB vs ~1.7GB original
- Builds más rápidos y cache eficiente
- Compatibilidad con BuildKit cache mounts

## 📝 Notas de Memoria para IA

**Actitudes perfectas a memorizar:**

- ✅ Limpieza automática de scripts temporales de análisis
- ✅ Auditoría cuidadosa antes de eliminar packages/carpetas
- ✅ Verificación de no ruptura del código antes de cambios
- ✅ Enfoque conservador en eliminación de dependencias
