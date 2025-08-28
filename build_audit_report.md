# Informe de Auditoría del Proceso de Build - Altamedica Monorepo

**Fecha de Auditoría:** 2025-08-27

## Resumen Ejecutivo

El proceso de `turbo build` se completa exitosamente después de varias correcciones críticas. Sin embargo, una revisión detallada de la configuración del monorepo y los logs de compilación revela varios problemas latentes y oportunidades de mejora. Esta auditoría identifica inconsistencias, advertencias suprimidas y patrones de configuración subóptimos que podrían llevar a errores futuros, dificultar el mantenimiento y ralentizar el desarrollo.

Se recomienda abordar estos puntos para mejorar la robustez, velocidad y mantenibilidad del sistema de compilación.

---

## 1. Problemas Críticos

### 1.1. Uso de APIs de Node.js en el Edge Runtime

- **Paquete Afectado:** `@altamedica/web-app`
- **Descripción:** El log de build muestra múltiples advertencias indicando que APIs específicas de Node.js (como `process.nextTick`, `crypto`, `setImmediate`) están siendo importadas por código que se ejecuta en el Edge Runtime de Next.js. Esto ocurre porque el archivo `src/middleware.ts` importa utilidades (`rate-limiter`) que dependen de la librería `ioredis`, la cual está diseñada para el backend de Node.js.
- **Impacto:** **Crítico.** El middleware fallará en producción cuando se despliegue en Vercel o un entorno similar, ya que el Edge Runtime no soporta estas APIs. Esto puede causar que toda la aplicación o partes críticas de ella (como la seguridad) no funcionen.
- **Recomendación:**
  1.  Refactorizar la lógica que depende de `ioredis` (como el `rate-limiter`) fuera del middleware.
  2.  Mover esta lógica a un endpoint de API dedicado (un "API Route Handler") que se ejecute en el entorno de Node.js.
  3.  El middleware puede entonces hacer una llamada `fetch` a este nuevo endpoint si es necesario, o se puede usar una solución de rate limiting compatible con el Edge, como `@upstash/redis`.

---

## 2. Problemas de Configuración

### 2.1. Orden Incorrecto en `package.json exports`

- **Paquetes Afectados:** Múltiples, incluyendo `@altamedica/supabase`, `@altamedica/interfaces`, `@altamedica/services`, etc.
- **Descripción:** El log de build está lleno de advertencias: `The condition "types" here will never be used as it comes after both "import" and "require"`. Esto se debe a que en la sección `exports` de los `package.json`, la clave `"types"` está definida después de `"import"` y `"require"`. La resolución de módulos de Node.js se detiene en la primera condición que coincide, por lo que las herramientas que buscan la clave `"types"` (como TypeScript) nunca la encuentran si una de las otras claves ya ha coincidido.
- **Impacto:** Medio. Aunque el build no falla, esto puede confundir al IntelliSense de los editores de código y a ciertas herramientas de análisis, llevando a una experiencia de desarrollo degradada y posibles errores de tipado no detectados.
- **Recomendación:**
  - En todos los archivos `package.json` que usen la sección `exports`, mover la clave `"types"` para que sea la **primera** condición.
  - **Ejemplo de Corrección:**

    ```json
    // Antes (Incorrecto)
    "exports": {
      ".": {
        "import": "./dist/index.mjs",
        "require": "./dist/index.js",
        "types": "./dist/index.d.ts"
      }
    }

    // Después (Correcto)
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.mjs",
        "require": "./dist/index.js"
      }
    }
    ```

### 2.2. Scripts `predev` y `prebuild` Redundantes

- **Paquetes Afectados:** Aplicaciones Next.js como `@altamedica/companies`, `@altamedica/doctors`, `@altamedica/admin`, etc.
- **Descripción:** Estas aplicaciones tienen scripts `predev` o `build:with-deps` que ejecutan manualmente el build de sus dependencias del workspace (ej. `pnpm --dir ../../packages/types run build && ...`). Este enfoque es un antipatrón en un monorepo gestionado por Turborepo.
- **Impacto:** Bajo a Medio. Estos scripts anulan el propósito de Turborepo. Ralentizan los tiempos de inicio y build, ya que fuerzan la reconstrucción de las dependencias en cada ejecución en lugar de aprovechar el cacheo inteligente de Turbo.
- **Recomendación:**
  1.  Eliminar todos los scripts `predev`, `prebuild` y `build:with-deps` de los `package.json` de las aplicaciones.
  2.  Confiar únicamente en el comando `turbo dev` y `turbo build` ejecutado desde la raíz, junto con la directiva `"dependsOn": ["^build"]` en `turbo.json`, para gestionar el orden de construcción.

---

## 3. Advertencias y Errores Latentes

### 3.1. Componentes de UI No Exportados

- **Paquetes Afectados:** `@altamedica/ui`, `@altamedica/companies`.
- **Descripción:** El build de `@altamedica/companies` mostró la advertencia `Attempted import error: 'Label' is not exported from '@altamedica/ui'`. Aunque no fue un error fatal que detuviera el build, indica que la aplicación `companies` está intentando usar un componente `Label` que el paquete `@altamedica/ui` no está exportando desde su punto de entrada (`src/index.tsx`).
- **Impacto:** Medio. Esto es un error latente. Puede que funcione en desarrollo debido a cómo el bundler resuelve los módulos, pero es muy probable que falle en producción o que cause comportamientos inesperados.
- **Recomendación:**
  1.  Auditar el paquete `@altamedica/ui` para identificar qué componentes se están utilizando en otras aplicaciones.
  2.  Asegurarse de que todos los componentes compartidos, incluyendo `Label`, se exporten explícitamente desde `packages/ui/src/index.tsx`.

### 3.2. Inconsistencia en Herramientas de Build

- **Paquetes Afectados:** Varios.
- **Descripción:** Existe una mezcla de herramientas para compilar los paquetes:
  - `tsup` es usado en la mayoría de los paquetes.
  - `tsc` se usa en `@altamedica/utils`, `@altamedica/types`, `api-server`, etc.
  - `next build` se usa para las aplicaciones.
- **Impacto:** Bajo. Si bien esto no es un error, puede llevar a inconsistencias en la salida generada (ej. formato de módulos, target de ECMAScript, manejo de `source maps`). Estandarizar en una sola herramienta (`tsup` para todos los paquetes de librería) simplifica la configuración y el mantenimiento.
- **Recomendación:**
  - Considerar migrar todos los paquetes de librería (no las aplicaciones) para que usen `tsup` para la compilación, compartiendo una configuración base de `tsup.config.ts` para mantener la consistencia.

### 3.3. Re-exportaciones Conflictivas

- **Paquete Afectado:** `@altamedica/medical`.
- **Descripción:** El log muestra la advertencia: `Conflicting namespaces: "src/utils/index.ts" re-exports "MedicationProfile" from one of the modules "src/utils/dosage-calculator.ts" and "src/utils/drug-interactions.ts"`. Esto significa que dos archivos diferentes están exportando un tipo con el mismo nombre (`MedicationProfile`), y el archivo `index.ts` está intentando re-exportar ambos, creando una ambigüedad.
- **Impacto:** Bajo a Medio. Esto puede llevar a que los consumidores del paquete importen el tipo incorrecto, causando errores de TypeScript difíciles de depurar.
- **Recomendación:**
  1.  Revisar los archivos `dosage-calculator.ts` y `drug-interactions.ts` dentro del paquete `@altamedica/medical`.
  2.  Renombrar uno de los tipos `MedicationProfile` para que sea único, o consolidarlos en un único archivo si representan lo mismo.
  3.  Actualizar el archivo `index.ts` para exportar los tipos de forma no ambigua.
