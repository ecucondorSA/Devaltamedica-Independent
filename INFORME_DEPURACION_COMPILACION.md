# Informe de Depuración: Fallo de Compilación de la Aplicación `doctors`

## 1. Resumen del Problema

El objetivo inicial era compilar la aplicación `@altamedica/doctors` usando el comando `turbo build --filter=doctors`. La compilación falló consistentemente, presentando una serie de errores complejos relacionados con la resolución de módulos, dependencias del espacio de trabajo (workspace) y la transpilación de paquetes.

Este documento detalla de forma exhaustiva el proceso de investigación, las hipótesis, las acciones tomadas y los resultados de cada intento para solucionar el problema.

---

## 2. Proceso de Depuración Cronológico

### Intento 1: Compilación Inicial y Análisis del Error

- **Acción:** Ejecuté el comando `turbo build --filter=doctors`.
- **Resultado:** La compilación falló.
- **Análisis del Error:** Los mensajes de error iniciales fueron:
  - `export 'UserRole' (reexported as 'UserRole') was not found in '@altamedica/types' (module has no exports)`
  - `Attempted import error: 'getFirebaseAuth' is not exported from '@altamedica/firebase'`
  - `Attempted import error: 'getFirebaseFirestore' is not exported from '@altamedica/firebase'`

  Estos errores indicaban que el paquete `@altamedica/auth`, una dependencia de `doctors`, no podía importar correctamente desde los paquetes `@altamedica/types` y `@altamedica/firebase`.

### Intento 2: Verificación de Paquetes Fuente (`@altamedica/types` y `@altamedica/firebase`)

- **Hipótesis:** Los paquetes `@altamedica/types` o `@altamedica/firebase` podrían no estar exportando los módulos correctamente.
- **Acciones:**
  1.  Listé el contenido de los directorios `src` de ambos paquetes.
  2.  Leí los archivos `index.ts` de ambos paquetes para confirmar que `UserRole`, `getFirebaseAuth` y `getFirebaseFirestore` estaban siendo exportados.
  3.  Leí los archivos `package.json` de ambos paquetes para revisar la configuración de los puntos de entrada (`main`, `module`, `exports`).
- **Resultado:**
  - El código fuente parecía correcto; las exportaciones estaban presentes.
  - El `package.json` de `@altamedica/types` era correcto.
  - **Se encontró un error:** El `package.json` de `@altamedica/firebase` tenía una configuración incorrecta en los campos `main`, `module` y `exports`, apuntando a archivos (`.mjs`) que no coincidían con la salida de la compilación (`.js` y `.cjs`).

### Intento 3: Corrección de `package.json` de `@altamedica/firebase`

- **Hipótesis:** Corregir la configuración de los puntos de entrada en `@altamedica/firebase` resolvería los errores de importación.
- **Acción:** Modifiqué `/packages/firebase/package.json` para que los campos `main`, `module` y `exports` apuntaran a los archivos correctos generados por `tsup` (`dist/index.cjs` y `dist/index.js`).
- **Resultado:** La compilación volvió a fallar con los mismos errores. Esto indicó que el problema era más profundo que una simple configuración incorrecta en `package.json`.

### Intento 4: Limpieza de Caché de Turborepo

- **Hipótesis:** Turborepo podría estar utilizando una versión en caché y rota de las dependencias.
- **Acción:** Ejecuté `turbo clean` para limpiar la caché de todos los paquetes del monorepo.
- **Resultado:** La compilación falló de nuevo con los mismos errores, descartando un problema de caché.

### Intento 5: Investigación de la Configuración de TypeScript (`tsconfig.json`)

- **Hipótesis:** Podría haber un problema con la resolución de rutas de TypeScript en la aplicación `doctors`.
- **Acción:**
  1.  Leí el archivo `/apps/doctors/tsconfig.json`.
  2.  Descubrí que se estaban utilizando alias de ruta (`paths`) para todos los paquetes del workspace, apuntando a un único archivo: `/apps/doctors/src/aliases.ts`.
  3.  Leí el archivo `aliases.ts` y confirmé que reexportaba todo desde los paquetes del workspace, creando una **dependencia circular** que probablemente era la causa raíz del problema.
- **Acción Correctiva 1:** Modifiqué `tsconfig.json` para eliminar por completo estos alias.
- **Resultado 1:** La compilación falló con nuevos errores: `Module not found`. Esto demostró que, aunque los alias causaban un problema, el proyecto dependía de ellos para la resolución de módulos.
- **Acción Correctiva 2:** Restauré el `tsconfig.json` original.

### Intento 6: Investigación Web y Configuración de Next.js (`next.config.mjs`)

- **Hipótesis:** El problema estaba relacionado con la forma en que Next.js transpila (o no transpila) los paquetes del monorepo.
- **Acción:**
  1.  Investigué en la web sobre "Next.js monorepo module not found pnpm".
  2.  La solución recomendada es usar la opción `transpilePackages` en `next.config.js` para forzar a Next.js a procesar los paquetes del workspace.
  3.  Localicé y leí el archivo `/apps/doctors/next.config.mjs`.
  4.  Observé que la opción `transpilePackages` ya estaba en uso, pero la lista de paquetes estaba incompleta.
  5.  Modifiqué `next.config.mjs` para añadir los paquetes que faltaban: `@altamedica/medical`, `@altamedica/auth`, `@altamedica/types`, `@altamedica/firebase` y `@altamedica/shared`.
- **Resultado:** ¡Progreso! Los errores originales desaparecieron, pero surgieron otros nuevos:
  - `Module not found: Can't resolve '@altamedica/utils/rate-limiter'`
  - Errores indicando que componentes de cliente (que usan hooks de React como `useRouter`) se estaban importando en un entorno de servidor.

### Intento 7: Corrección de Importaciones y Dependencias

- **Hipótesis:** Los nuevos errores se debían a una ruta de importación incorrecta y a la falta de dependencias explícitas.
- **Acciones:**
  1.  Corregí la importación en `/apps/doctors/src/middleware.ts` de `@altamedica/utils/rate-limiter` a `@altamedica/utils`, ya que `rate-limiter` se exporta desde el `index` principal del paquete.
  2.  Añadí `@altamedica/firebase` a las dependencias en el `package.json` de `apps/doctors`.
  3.  Ejecuté `pnpm install` para asegurar que todas las dependencias del espacio de trabajo estuvieran correctamente enlazadas.
- **Resultado:** La compilación volvió a fallar, pero los errores de `Module not found` se resolvieron, validando las correcciones. El error persistente estaba relacionado con la directiva `"use client"` en el paquete `@altamedica/auth`.

---

## 3. Estado Final y Conclusión

El problema final y más persistente radica en cómo Next.js maneja los paquetes del espacio de trabajo que contienen componentes y hooks de React.

- **Error Final:** `You're importing a component that needs useRouter. This React hook only works in a client component. To fix, mark the file (or its parent) with the "use client" directive.`

- **Análisis Final:** A pesar de que los archivos fuente en el paquete `@altamedica/auth` (como `useAuth.tsx`) tienen la directiva `"use client"`, el proceso de compilación de Next.js no parece respetarla cuando el código se importa desde un paquete transpuesto en `node_modules`. La transpilación está ocurriendo, pero el contexto de cliente/servidor se está perdiendo en el proceso.

He agotado las soluciones que se pueden implementar de forma segura modificando la configuración. El problema parece estar profundamente arraigado en la interacción entre Next.js, Turborepo, `pnpm` y la forma en que los paquetes de la UI se han estructurado.

**Recomendación:**
La solución a largo plazo probablemente requiera una de las siguientes acciones:

1.  **Refactorizar el paquete `@altamedica/auth`:** Separar estrictamente los componentes y hooks del lado del cliente de la lógica del lado del servidor en diferentes puntos de entrada (por ejemplo, `@altamedica/auth/client`).
2.  **Revisar la configuración de `tsup`:** Investigar opciones avanzadas en la configuración de `tsup` para asegurar que la directiva `"use client"` se conserve de una manera que el compilador de Next.js pueda interpretar correctamente.
3.  **Simplificar la estructura de alias:** Eliminar por completo el sistema de alias y depender únicamente de `transpilePackages` y una instalación correcta de `pnpm`, aunque esto ya se intentó sin éxito y causó otros problemas de resolución.

Debido a la complejidad y al riesgo de introducir cambios disruptivos en la arquitectura del proyecto, no es posible continuar sin un análisis más profundo de la configuración de la compilación.

---

## lint ANÁLISIS Y SOLUCIÓN DE ERRORES DE LINTING (Iteración del 2025-08-28)

Adicional a los problemas de build, se realizó una sesión intensiva para corregir errores de `linting` que impedían la validación de calidad de código. A continuación se documentan los problemas y soluciones aplicadas.

### **1. 🚨 ERROR GRAVE: ESLint Flat Config Linting `dist` a Pesar de `.eslintignore`**

#### **📊 ANÁLISIS TÉCNICO**

**Package Afectado:** `@altamedica/database` y otros.
**Error:** Múltiples errores `no-undef` para `process` y `console`, y otros errores de código, aparecían en los archivos compilados dentro del directorio `dist/`, a pesar de que `dist/` estaba correctamente listado en el archivo `.eslintignore` del paquete.

**🔍 CAUSA RAÍZ:**
El proyecto utiliza una configuración moderna de ESLint "flat config" (`eslint.config.js`) en la raíz del monorepo. A diferencia de las configuraciones legadas (`.eslintrc.js`), la configuración flat **no respeta automáticamente los archivos `.eslintignore`**. La propiedad `ignores` debe ser definida directamente dentro del archivo `eslint.config.js`. El `lint script` se ejecutaba desde el directorio del paquete, pero usaba la configuración global que no tenía una regla específica para ignorar el subdirectorio `dist/` de ese paquete en particular.

**💡 SOLUCIÓN IMPLEMENTADA:**
Se creó un archivo `eslint.config.js` local en la raíz del paquete `@altamedica/database` con el siguiente contenido:

```javascript
// packages/database/eslint.config.js
import rootConfig from '../../eslint.config.js';

export default [
  ...rootConfig,
  {
    ignores: ['dist/**'],
  },
];
```

Esta configuración local hereda todas las reglas del `rootConfig` y añade una regla `ignores` específica para su contexto, solucionando el problema al excluir explícitamente el directorio `dist/` del `linting`.

### **2. 🟠 ERROR DE CONFIGURACIÓN: `process` no definido en `next.config.mjs`**

#### **📊 ANÁLISIS TÉCNICO**

**Package Afectado:** `@altamedica/patients`.
**Error:** `error 'process' is not defined no-undef`.

**🔍 CAUSA RAÍZ:**
El archivo `next.config.mjs` es un módulo ES, y a diferencia de los archivos CommonJS, no tiene acceso automático a globales de Node.js como `process`.

**💡 SOLUCIÓN IMPLEMENTADA:**
Se añadió la importación explícita de `process` al inicio del archivo `next.config.mjs`:

```javascript
// apps/patients/next.config.mjs
import process from 'process';

/** @type {import('next').NextConfig} */
const config = {
  // ... resto de la configuración
};
```

### **3. 🟡 ERRORES MENORES Y ADVERTENCIAS DE CALIDAD DE CÓDIGO**

Se corrigieron sistemáticamente más de 30 errores y advertencias en los paquetes `@altamedica/companies` y `@altamedica/patients`. Las soluciones incluyeron:

- **`no-useless-catch`**: Se eliminaron bloques `try...catch` que simplemente relanzaban el error, limpiando el código.
- **`no-case-declarations`**: Se envolvieron las declaraciones léxicas (`let`, `const`) dentro de los bloques `case` de un `switch` con llaves `{}` para crear un nuevo ámbito de bloque.
- **`no-redeclare`**: Se renombraron interfaces o componentes que tenían nombres duplicados dentro del mismo ámbito (e.g., `FooterLink` y `IFooterLink`).
- **`no-extra-semi`**: Se eliminaron puntos y comas dobles o innecesarios.
- **`no-console`**: Se reemplazaron todos los `console.log`, `console.error`, etc., por el `logger` centralizado del paquete `@altamedica/shared/services/logger.service`, asegurando un logging consistente.
- **`no-empty`**: Se añadieron comentarios explicativos a bloques `catch {}` vacíos que eran intencionales para suprimir errores esperados (e.g., acceso a `localStorage`).

**✅ RESULTADO:** El comando `pnpm lint` ahora se ejecuta sin errores en todos los paquetes, desbloqueando los pipelines de CI/CD y asegurando una base de código limpia y consistente.
