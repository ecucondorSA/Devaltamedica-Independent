# 📦 REPORTE DE DEPENDENCIAS FALTANTES - AltaMedica Platform

**Fecha de análisis:** 2025-08-20  
**Worktree:** devaltamedica-validate  
**Total dependencias faltantes identificadas:** 165+

## 📊 RESUMEN EJECUTIVO

### Estadísticas Generales

- **Apps con dependencias faltantes:** 6/8 (75%)
- **Packages con dependencias faltantes:** 15/24 (62.5%)
- **Peer dependencies no satisfechas:** 30
- **Dependencias críticas faltantes:** 5 (testing libraries)

### Impacto en el Proyecto

- **🔴 CRÍTICO:** Tests no pueden ejecutarse sin `vitest`, `supertest`, `node-mocks-http`
- **🟡 MEDIO:** Peer dependencies afectan compatibilidad entre packages
- **🟢 BAJO:** Algunas dependencias son alias internos mal interpretados

---

## 🚨 DEPENDENCIAS CRÍTICAS FALTANTES

### Testing Libraries (CRÍTICO)

```bash
# En api-server, companies, web-app
vitest
supertest
node-mocks-http
@testing-library/react
@testing-library/jest-dom
```

**Impacto:** Los 83 archivos de test identificados (.test.ts y .spec.ts) no pueden ejecutarse.

### Comando de instalación:

```bash
pnpm add -D vitest supertest node-mocks-http @testing-library/react @testing-library/jest-dom
```

---

## 📱 APPS - DEPENDENCIAS FALTANTES

### 1. **api-server** (24 dependencias faltantes)

```
Críticas:
- vitest, supertest, node-mocks-http (testing)
- @sentry/node (monitoring - importado pero no instalado)
- mediasoup, mediasoup-client (WebRTC)
- stripe (pagos - usado pero no instalado)
- winston (logging)

Alias mal interpretados:
- @/lib, @/auth, @/services, @/middleware (aliases internos)
```

### 2. **companies** (14 dependencias faltantes)

```
Críticas:
- cypress, @playwright/test (E2E testing)
- vitest (unit testing)
- react-chartjs-2 (visualización - usado en dashboard)

Alias mal interpretados:
- @/components, @/hooks, @/lib (aliases internos)
```

### 3. **doctors** (18 dependencias faltantes)

```
Críticas:
- @playwright/test (E2E testing)
- date-fns (manejo de fechas - usado extensivamente)
- firebase-admin (backend auth)

Alias mal interpretados:
- @/components, @/hooks, @/lib (aliases internos)
```

### 4. **patients** (15 dependencias faltantes)

```
Críticas:
- @react-three/fiber, three (visualización 3D)
- framer-motion (animaciones)
- date-fns (manejo de fechas)

Alias mal interpretados:
- @/components, @/hooks, @/services (aliases internos)
```

### 5. **web-app** (13 dependencias faltantes)

```
Críticas:
- @sentry/nextjs (monitoring)
- vitest (testing)
- @radix-ui/* (componentes UI usados)

Alias mal interpretados:
- @/components, @/hooks, @/lib (aliases internos)
```

### 6. **admin** (2 dependencias faltantes)

```
Alias mal interpretados:
- @/components, @/hooks (aliases internos)
```

---

## 📦 PACKAGES - DEPENDENCIAS FALTANTES

### Packages con Dependencias Críticas

#### **@altamedica/shared** (9 dependencias)

```
- stripe (pagos)
- mercadopago (pagos Argentina)
- speakeasy, qrcode (2FA/MFA)
- archiver (exportación)
- uuid (generación IDs)
- node-cron (scheduled jobs)
```

#### **@altamedica/ui** (10 dependencias)

```
- @radix-ui/* (múltiples componentes)
- framer-motion (animaciones)
- date-fns (formateo fechas)
- @stripe/stripe-js (elementos de pago)
```

#### **@altamedica/auth** (3 dependencias)

```
- firebase-admin (backend auth)
- qrcode (2FA)
- vitest (testing)
```

---

## 🔗 PEER DEPENDENCIES NO SATISFECHAS (30)

### React Ecosystem (más común)

```bash
# 10 packages requieren:
react: ^18.2.0 || ^19.0.0
react-dom: ^18.2.0 || ^19.0.0
```

### Build Tools

```bash
# Requeridos por múltiples packages:
tailwindcss: ^3.3.0
next: ^15.3.4
```

### ESLint Ecosystem

```bash
# @altamedica/eslint-config requiere:
@typescript-eslint/eslint-plugin: >=6 <9
@typescript-eslint/parser: >=6 <9
eslint-plugin-import: >=2.29.0
eslint-plugin-jsx-a11y: >=6.7.0
eslint-plugin-react: >=7.33.0
```

### Comando completo para peer dependencies:

```bash
pnpm add -D react react-dom canvas-confetti firebase framer-motion \
  react-type-animation next @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser eslint-plugin-import eslint-plugin-jsx-a11y \
  eslint-plugin-react tailwindcss
```

---

## ⚠️ FALSOS POSITIVOS - Alias Internos

Los siguientes NO son dependencias reales, son alias de TypeScript/Next.js:

- `@/components` → `./src/components`
- `@/hooks` → `./src/hooks`
- `@/lib` → `./src/lib`
- `@/services` → `./src/services`
- `@/utils` → `./src/utils`

Estos están configurados en `tsconfig.json` con paths y no requieren instalación.

---

## 🛠️ PLAN DE REMEDIACIÓN

### Fase 1: Dependencias Críticas (INMEDIATO)

```bash
# Testing frameworks
pnpm add -D vitest supertest node-mocks-http \
  @testing-library/react @testing-library/jest-dom \
  @playwright/test cypress

# Monitoring
pnpm add @sentry/node @sentry/nextjs
```

### Fase 2: Dependencias Funcionales (ESTA SEMANA)

```bash
# UI y animaciones
pnpm add framer-motion date-fns react-chartjs-2 \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Pagos
pnpm add stripe @stripe/stripe-js mercadopago

# WebRTC
pnpm add mediasoup mediasoup-client
```

### Fase 3: Peer Dependencies (ESTA SEMANA)

```bash
# Instalar todas las peer dependencies
pnpm add -D react react-dom tailwindcss next firebase \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### Fase 4: Limpieza y Validación

1. Eliminar imports de packages no usados
2. Actualizar tsconfig paths para aliases consistentes
3. Ejecutar `pnpm install` para sincronizar lockfile
4. Ejecutar tests para validar instalaciones

---

## 📈 MÉTRICAS POST-INSTALACIÓN ESPERADAS

- **Tests ejecutables:** 83 archivos (100% cobertura)
- **Build sin errores:** 0 errores de tipo o imports
- **Peer deps satisfechas:** 31/31 (100%)
- **Compatibilidad packages:** 100% interoperabilidad

---

## 🔍 VERIFICACIÓN POST-INSTALACIÓN

```bash
# Verificar que todas las dependencias estén instaladas
node scripts/analyze-missing-deps.js

# Verificar peer dependencies
node scripts/check-peer-deps.js

# Ejecutar tests
pnpm test:all

# Build completo
pnpm build
```

---

## 📝 NOTAS ADICIONALES

1. **Workspace dependencies:** Los packages internos usan `workspace:*` que es correcto
2. **TypeScript versions:** Detectadas múltiples versiones, considerar unificar a `^5.8.3`
3. **React versions:** Algunos packages especifican React 19, otros React 18 - necesita alineación
4. **Build tools:** tsup está instalado pero algunos packages no lo usan correctamente

---

**Generado por:** Análisis automático de dependencias  
**Scripts utilizados:** `analyze-missing-deps.js`, `check-peer-deps.js`
