# Auditoría Integral y Plan de Acción para la Plataforma Altamedica

**Fecha de Auditoría:** 2025-08-27

## 1. Resumen Ejecutivo

La plataforma Altamedica posee una base de código considerable y una arquitectura de monorepo moderna. Sin embargo, el proceso de build y desarrollo sufre de inestabilidad crítica debido a una serie de problemas de configuración, inconsistencias y antipatrones. Estos problemas han llevado a fallos de compilación en cascada, errores de linting difíciles de diagnosticar y un entorno de desarrollo poco fiable.

Esta auditoría identifica las causas raíz de estos fallos, que se encuentran en la configuración del orquestador del monorepo (Turborepo), en los scripts de los paquetes individuales y en errores de código latentes. Se presenta un plan de acción detallado y por pasos para remediar estos problemas, con el objetivo de crear un sistema de build robusto, rápido y mantenible.

## 2. Metodología de la Investigación

La auditoría se realizó a través de un proceso iterativo de diagnóstico y corrección:

1.  **Ejecución de Tareas:** Se ejecutaron los comandos `turbo build`, `turbo lint` y `turbo dev` para identificar los puntos de fallo.
2.  **Análisis de Errores:** Se analizaron en detalle los logs de error para formular hipótesis sobre la causa raíz (ej. "Módulo no encontrado", "Error de sintaxis JSON", "Error de configuración de linter").
3.  **Ejecución Aislada:** Los scripts de los paquetes que fallaban se ejecutaron de forma aislada (`pnpm --filter <package> <script>`) para diferenciar entre problemas del paquete y problemas de la orquestación de Turbo.
4.  **Inspección de Configuración:** Se revisaron sistemáticamente los archivos de configuración clave en todo el monorepo, incluyendo:
    - `turbo.json` (configuración del pipeline)
    - `package.json` (scripts, dependencias, y `exports`)
    - `tsconfig.json` (configuración de TypeScript)
    - `.eslintrc.js`/`.json` (configuración de linting)
5.  **Análisis de Código Fuente:** Se inspeccionó el código fuente de los paquetes y aplicaciones implicados para validar las hipótesis (ej. verificar rutas de importación, exportaciones de módulos, etc.).

## 3. Auditoría de Problemas Identificados

Los problemas se clasifican en tres categorías, de mayor a menor criticidad.

### 3.1. Problemas Fundamentales de Build y Monorepo (Causa Raíz Principal)

Estos problemas afectan la base de cómo se construye el monorepo y son la causa principal de los fallos en cascada.

#### 3.1.1. Falta de Orden de Dependencias en el Build de Turbo

- **Problema:** El pipeline `build` en `turbo.json` carecía de la directiva `"dependsOn": ["^build"]`.
- **Investigación:** Se observó que las aplicaciones (`doctors`, `companies`) fallaban porque no encontraban los módulos de sus dependencias (`types`, `shared`). Esto indicaba que Turbo estaba intentando construir todo en paralelo, sin esperar a que las dependencias estuvieran listas.
- **Impacto:** **Crítico.** Esto hace que el build no sea determinista y falle la mayor parte del tiempo. Anula el propósito principal de usar Turbo para gestionar el grafo de dependencias.

#### 3.1.2. Antipatrón de Scripts `prebuild` y `predev`

- **Problema:** Las aplicaciones Next.js (`doctors`, `admin`, `patients`, `companies`) contenían scripts `prebuild` y `predev` que ejecutaban manualmente el build de sus dependencias (ej. `pnpm --dir ../../packages/types run build && ...`).
- **Investigación:** Incluso después de corregir `turbo.json`, los fallos persistían. Se descubrió que estos scripts se ejecutaban _antes_ de que Turbo pudiera aplicar su lógica de dependencias, creando una condición de carrera y eludiendo el sistema de cacheo de Turbo.
- **Impacto:** **Crítico.** Hace que la corrección en `turbo.json` sea ineficaz y es la causa directa de los errores de "módulo no encontrado". Ralentiza drásticamente el proceso de build y desarrollo.

### 3.2. Errores Críticos y Latentes en el Código

Estos son errores en el código o en la configuración de los paquetes que, aunque a veces no detienen el build, causarán fallos en producción o problemas de mantenimiento.

#### 3.2.1. Uso de APIs de Node.js en el Edge Runtime de Next.js

- **Problema:** El build de `@altamedica/web-app` generó advertencias sobre el uso de módulos de Node.js (`process.nextTick`, `crypto`) en el Edge Runtime.
- **Investigación:** El análisis de la traza de importación reveló que `src/middleware.ts` importa un `rate-limiter` desde el paquete `@altamedica/utils`, que a su vez depende de `ioredis`, una librería de backend.
- **Impacto:** **Crítico.** El middleware se ejecuta en un entorno restringido (Edge). El código que usa `ioredis` fallará catastróficamente en un entorno de producción como Vercel, rompiendo la funcionalidad del middleware.

#### 3.2.2. Inconsistencia en la Importación de Módulos

- **Problema:** La aplicación `@altamedica/patients` importaba un hook usando una ruta profunda (`@altamedica/hooks/medical/usePrescriptions`) en lugar de la ruta del punto de entrada del paquete (`@altamedica/hooks`).
- **Investigación:** Se confirmó que el hook estaba correctamente exportado desde el `index.ts` principal del paquete `hooks`, pero el sistema de build no estaba configurado para resolver importaciones profundas.
- **Impacto:** Alto. Viola el contrato del paquete y hace que el código sea frágil. Si la estructura interna del paquete `hooks` cambia, la importación se romperá.

### 3.3. Inconsistencias y Deuda Técnica de Configuración

Estos problemas contribuyen a un build más lento, una peor experiencia de desarrollo y un mayor riesgo de errores futuros.

#### 3.3.1. Orden Incorrecto en el Campo `exports` de `package.json`

- **Problema:** Múltiples paquetes tienen la clave `"types"` al final de la sección `exports`.
- **Investigación:** El log de build mostró numerosas advertencias: `The condition "types" here will never be used`. Esto se debe a que la resolución de módulos de Node.js se detiene en la primera clave que coincide (`import` o `require`), por lo que TypeScript y los IDEs no pueden encontrar la información de tipos correctamente.
- **Impacto:** Medio. Degrada el autocompletado y la verificación de tipos en el IDE.

#### 3.3.2. Falla Silenciosa del Script de Build en `@altamedica/shared`

- **Problema:** El script de build para `@altamedica/shared` usaba la bandera `--silent`, que ocultaba un error en `tsup` que causaba que el proceso terminara exitosamente pero sin generar ningún archivo.
- **Investigación:** Se descubrió que el directorio `dist` de `shared` estaba vacío a pesar de que su build reportaba éxito. Al eliminar la bandera `--silent`, el build funcionó correctamente y generó los archivos.
- **Impacto:** Alto. Un fallo silencioso es extremadamente difícil de depurar y fue una de las causas de los errores en cascada.

## 4. Plan de Acción Paso a Paso para la Solución

Este plan solucionará los problemas identificados en orden de prioridad. Se recomienda ejecutar estos pasos en una rama limpia.

### Paso 1: Corregir la Configuración Fundamental del Monorepo

1.  **Asegurar el Orden de Build en Turbo:**
    - **Acción:** Edita el archivo `turbo.json` en la raíz del proyecto.
    - **Cambio:** Asegúrate de que el pipeline `build` contenga `"dependsOn": ["^build"]`.

    ```json
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      // ... resto de la configuración
    },
    ```

2.  **Eliminar Scripts `pre*` Antipatrón:**
    - **Acción:** Elimina las líneas `prebuild` y `predev` de los `package.json` de todas las aplicaciones.
    - **Archivos a Modificar:**
      - `apps/admin/package.json`
      - `apps/companies/package.json`
      - `apps/doctors/package.json`
      - `apps/patients/package.json`
    - **Ejemplo de Cambio (para `apps/doctors/package.json`):**
      ```diff
      - "predev": "pnpm --dir ../../packages/types run build && ...",
        "dev": "next dev --port 3002",
      - "prebuild": "pnpm --dir ../../packages/types run build && ...",
        "build": "npx next build",
      ```

### Paso 2: Solucionar Errores Críticos de Runtime

1.  **Refactorizar Lógica del Edge Middleware:**
    - **Acción:** Este es el cambio de código más complejo requerido.
    1.  Identifica la lógica en `apps/web-app/src/middleware.ts` que depende de `ioredis`.
    2.  Crea un nuevo API Route Handler en `apps/web-app/src/app/api/rate-limit/route.ts`.
    3.  Mueve la lógica de `ioredis` a este nuevo handler.
    4.  Desde el middleware, en lugar de importar el código directamente, haz una llamada `fetch` a `/api/rate-limit`. **Importante:** El middleware no puede llamar a su propio host directamente; debe usar una URL absoluta o una función auxiliar para determinar la URL base.

### Paso 3: Estandarizar y Corregir Módulos

1.  **Corregir el Orden del Campo `exports`:**
    - **Acción:** En cada `package.json` dentro del directorio `packages/` que tenga una sección `exports`, mueve la clave `"types"` para que sea la primera.
    - **Ejemplo de Cambio:**
      ```json
      "exports": {
        ".": {
          "types": "./dist/index.d.ts",
          "import": "./dist/index.mjs",
          "require": "./dist/index.js"
        }
      }
      ```

2.  **Corregir el Build Silencioso de `@altamedica/shared`:**
    - **Acción:** Edita `packages/shared/package.json`.
    - **Cambio:** Elimina la bandera `--silent` del script `build`.
      ```diff
      - "build": "tsup src/index.ts ... --silent",
      + "build": "tsup src/index.ts ...",
      ```

### Paso 4: Limpieza y Verificación Final

1.  **Limpiar Artefactos de Build:**
    - **Acción:** Ejecuta el siguiente comando desde la raíz del proyecto para eliminar todos los directorios `dist`, `.next` y la caché de Turbo.

    ```bash
    turbo clean
    ```

2.  **Ejecutar el Build Completo:**
    - **Acción:** Ejecuta el build para todo el monorepo. Con las correcciones aplicadas, este comando debería completarse sin errores.

    ```bash
    turbo build
    ```

3.  **Verificar el Modo de Desarrollo:**
    - **Acción:** Inicia el entorno de desarrollo.
    ```bash
    turbo dev --concurrency=40
    ```

## 5. Conclusión

Al completar este plan de acción, la plataforma Altamedica tendrá un sistema de build y desarrollo:

- **Robusto y Fiable:** Los builds serán deterministas y no fallarán debido a condiciones de carrera.
- **Rápido:** Se aprovechará al máximo el sistema de cacheo de Turborepo.
- **Mantenible:** La estandarización de la configuración y la eliminación de antipatrones facilitarán la incorporación de nuevos paquetes y desarrolladores.
- **Correcto en Producción:** Se eliminarán errores críticos de runtime que impedirían el despliegue exitoso de la aplicación.
