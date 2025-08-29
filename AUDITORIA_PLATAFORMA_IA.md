
# Auditoría de Plataforma de Alto Nivel para IA

Este documento proporciona un análisis estructural y arquitectónico de la plataforma Altamedica. Está diseñado para ser utilizado por modelos de IA y desarrolladores para obtener una comprensión rápida y profunda del ecosistema del proyecto, con enlaces directos a los artefactos clave.

## Tabla de Contenidos
1. [Resumen Arquitectónico](#1-resumen-arquitectónico)
2. [Estructura del Monorepo](#2-estructura-del-monorepo)
    - [2.1. Aplicaciones (`apps`)](#21-aplicaciones-apps)
    - [2.2. Paquetes Compartidos (`packages`)](#22-paquetes-compartidos-packages)
3. [Infraestructura, CI/CD y DevOps](#3-infraestructura-cicd-y-devops)
    - [3.1. Contenerización](#31-contenerización)
    - [3.2. Orquestación y IaC](#32-orquestación-y-iac)
    - [3.3. Integración y Despliegue Continuo (CI/CD)](#33-integración-y-despliegue-continuo-cicd)
4. [Base de Datos y Plataforma de Backend](#4-base-de-datos-y-plataforma-de-backend)
5. [Calidad de Código y Pruebas](#5-calidad-de-código-y-pruebas)
    - [5.1. Linting y Formateo](#51-linting-y-formateo)
    - [5.2. Estrategia de Pruebas](#52-estrategia-de-pruebas)

---

## 1. Resumen Arquitectónico

La plataforma Altamedica está construida como un **monorepo** gestionado por **pnpm workspaces** y orquestado con **Turborepo**. Esta estructura favorece la compartición de código y la gestión centralizada de dependencias.

- **Framework Principal:** Las aplicaciones de frontend parecen estar construidas con **Next.js**, dada la estructura de archivos y las dependencias comunes.
- **Backend:** El backend se compone de un servidor API principal (`api-server`) y servicios de soporte como un servidor de señalización WebRTC (`signaling-server`).
- **Infraestructura:** El proyecto está completamente contenedorizado con **Docker** y gestiona su infraestructura como código (IaC) a través de **Terraform**.
- **CI/CD:** Los flujos de trabajo de integración y despliegue continuo están automatizados mediante **GitHub Actions**, con una suite extensa de validaciones.
- **Plataforma de Servicios:** **Firebase** se utiliza prominentemente para servicios de backend, incluyendo autenticación y base de datos (Firestore).

**Archivos de Configuración Clave:**
- **Turborepo:** [`turbo.json`](./turbo.json)
- **pnpm Workspaces:** [`pnpm-workspace.yaml`](./pnpm-workspace.yaml)

---

## 2. Estructura del Monorepo

El código está organizado en dos directorios principales: `apps` para aplicaciones desplegables y `packages` para librerías y código compartido.

### 2.1. Aplicaciones (`apps`)

Contiene los puntos de entrada y aplicaciones finales de la plataforma.

- **[admin](./apps/admin/):** Dashboard de administración.
- **[api-server](./apps/api-server/):** El servidor API principal que centraliza la lógica de negocio.
- **[companies](./apps/companies/):** Portal para empresas.
- **[doctors](./apps/doctors/):** Aplicación para el personal médico.
- **[patients](./apps/patients/):** Portal para pacientes.
- **[signaling-server](./apps/signaling-server/):** Servidor de señalización para WebRTC/telemedicina.
- **[web-app](./apps/web-app/):** Aplicación web pública o de marketing.

### 2.2. Paquetes Compartidos (`packages`)

Librerías y utilidades reutilizables a través de las diferentes aplicaciones.

- **UI y Componentes:**
    - **[ui](./packages/ui/):** Componentes de React compartidos.
    - **[tailwind-config](./packages/tailwind-config/):** Configuración centralizada de Tailwind CSS.
    - **[hooks](./packages/hooks/):** Hooks de React reutilizables.
- **Lógica de Negocio y Tipos:**
    - **[types](./packages/types/):** Definiciones de tipos de TypeScript compartidas.
    - **[medical](./packages/medical/):** Lógica y utilidades relacionadas con el dominio médico.
    - **[patient-services](./packages/patient-services/):** Lógica de negocio específica para pacientes.
    - **[diagnostic-engine](./packages/diagnostic-engine/):** Motor de diagnóstico.
- **Comunicación y Datos:**
    - **[api-client](./packages/api-client/):** Cliente para consumir la API interna.
    - **[database](./packages/database/):** Abstracciones y configuraciones para la base de datos.
    - **[firebase](./packages/firebase/):** Clientes y configuración para interactuar con Firebase.
    - **[supabase](./packages/supabase/):** Clientes y configuración para Supabase.
- **Autenticación y Seguridad:**
    - **[auth](./packages/auth/):** Lógica de autenticación compartida.
- **Configuración y Tooling:**
    - **[eslint-config](./packages/eslint-config/):** Configuración de ESLint compartida.
    - **[typescript-config](./packages/typescript-config/):** Configuraciones base de TypeScript.
    - **[e2e-tests](./packages/e2e-tests/):** Pruebas End-to-End centralizadas.

---

## 3. Infraestructura, CI/CD y DevOps

El proyecto demuestra una madurez significativa en sus prácticas de DevOps.

### 3.1. Contenerización

Todas las aplicaciones principales tienen su propio [`Dockerfile`](./apps/admin/Dockerfile) para construir imágenes de contenedor. La orquestación local y de desarrollo se gestiona con [`docker-compose.yml`](./docker-compose.yml).

- **Ejemplo de Dockerfile:** [`apps/api-server/Dockerfile`](./apps/api-server/Dockerfile)
- **Docker Compose Raíz:** [`docker-compose.yml`](./docker-compose.yml)

### 3.2. Orquestación y IaC

La infraestructura está definida como código utilizando **Terraform**.

- **Terraform Principal:** [`terraform/main.tf`](./terraform/main.tf)
- **Variables de Terraform:** [`terraform/variables.tf`](./terraform/variables.tf)

### 3.3. Integración y Despliegue Continuo (CI/CD)

Se utiliza un sistema robusto de **GitHub Actions** para automatizar el ciclo de vida del desarrollo.

- **Directorio de Workflows:** [`./.github/workflows/`](./.github/workflows/)
- **Workflow Principal de CI:** [`main.yml`](./.github/workflows/main.yml)
- **Workflow de CI Optimizado:** [`ci-optimized.yml`](./.github/workflows/ci-optimized.yml)
- **Revisiones de código con IA:** [`ai-code-review.yml`](./.github/workflows/ai-code-review.yml)
- **Escaneo de Seguridad:** [`security-scan.yml`](./.github/workflows/security-scan.yml)

---

## 4. Base de Datos y Plataforma de Backend

**Firebase** es el principal proveedor de servicios de backend.

- **Configuración General de Firebase:** [`firebase.json`](./firebase.json)
- **Reglas de Seguridad de Firestore:** [`firestore.rules`](./firestore.rules)
- **Paquete de Abstracción de Firebase:** [`packages/firebase/`](./packages/firebase/)

También existe integración con **Supabase**, probablemente para funcionalidades específicas o como una migración progresiva.
- **Paquete de Abstracción de Supabase:** [`packages/supabase/`](./packages/supabase/)

---

## 5. Calidad de Código y Pruebas

El proyecto pone un fuerte énfasis en la calidad y la fiabilidad a través de herramientas de linting y una estrategia de pruebas multinivel.

### 5.1. Linting y Formateo

Se utilizan **ESLint** y **Prettier** para mantener un estilo de código consistente y detectar errores de forma temprana.

- **Configuración de ESLint:** [`.eslintrc.cjs`](./.eslintrc.cjs)
- **Configuración de Prettier:** [`.prettierrc.cjs`](./.prettierrc.cjs)
- **Configuración de ESLint Compartida:** [`packages/eslint-config/`](./packages/eslint-config/)

### 5.2. Estrategia de Pruebas

El proyecto cuenta con una cobertura de pruebas exhaustiva.

- **Pruebas Unitarias y de Integración:** Se encuentran en directorios `__tests__` o `test` dentro de cada aplicación y paquete.
    - **Ejemplo:** [`apps/api-server/src/__tests__/appointments.test.ts`](./apps/api-server/src/__tests__/appointments.test.ts)
- **Pruebas End-to-End (E2E):** Centralizadas en un paquete dedicado y también a nivel de aplicación.
    - **Paquete de E2E:** [`packages/e2e-tests/`](./packages/e2e-tests/)
    - **Configuración de Playwright:** [`e2e/playwright.config.ts`](./e2e/playwright.config.ts)
    - **Ejemplo de prueba E2E:** [`packages/e2e-tests/tests/patients-appointments.spec.ts`](./packages/e2e-tests/tests/patients-appointments.spec.ts)
