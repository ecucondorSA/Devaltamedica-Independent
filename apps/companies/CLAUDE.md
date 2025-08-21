# CLAUDE.md - App: Companies 🏢

## 🌳 WORKTREE PARA COMPANIES APP

- **Para auditar componentes B2B duplicados**: usar `../devaltamedica-audit/`
- **Para conectar features empresariales**: usar `../devaltamedica-integrate/`
- **Para validar funcionalidad B2B**: usar `../devaltamedica-validate/`
- **Las features empresariales YA EXISTEN** - solo necesitan integración

## ⚠️ FILOSOFÍA E2E OBLIGATORIA

**CRÍTICO**: Todas las soluciones deben ser **end-to-end (E2E)** - frontend + backend + tipos + testing completo.

### 🎯 Principios E2E

- **Frontend + Backend**: React/Next.js + API routes integrados
- **Tipos Compartidos**: Actualizar @altamedica/types
- **Sistemas Unificados**: Usar UnifiedAuthSystem, UnifiedNotificationSystem, UnifiedMarketplaceSystem

## 🎯 Resumen de la Aplicación

- **Propósito:** Portal B2B exclusivo para empresas médicas - gestión hospitalaria, marketplace de servicios, control de operaciones
- **Tecnologías:** Next.js 15, React 19, TypeScript, Tailwind CSS, Firebase v9+, Leaflet
- **Puerto:** 3004
- **Estado:** ✅ **Sistema de Control Hospitalario Activo**

### Rutas Principales

- `/`: Dashboard principal con métricas empresariales
- `/dashboard`: Centro de Control Hospitalario con redistribución
- `/operations-hub`: Centro de Operaciones Unificado (Crisis + Marketplace)
- `/marketplace`: Marketplace médico B2B
- `/billing`: Sistema de facturación empresarial

## 🚨 Sistema de Control Hospitalario

### **Centro de Control** (Torre de Control Médico)

- ✅ **Monitoreo en Tiempo Real**: Mapa interactivo con hospitales de la red
- ✅ **Redistribución Inteligente**: Detección automática de saturación (>85%)
- ✅ **Déficit de Personal**: Monitoreo ratios paciente/personal
- ✅ **Integración Multi-Canal**: WhatsApp + API + Sensores IoT

### **Operations Hub** (Crisis + Marketplace)

- ✅ **Estilo VS Code**: Tabs operativas con paneles colapsables
- ✅ **MapShell**: Contenedor común para mapas con reflow robusto
- ✅ **Tema Oscuro**: Diseño torre de control para monitoreo 24/7

## 🔌 APIs Principales

| Endpoint                         | Propósito                         | Estado             |
| -------------------------------- | --------------------------------- | ------------------ |
| `/api/v1/auth/*`                 | Login empresarial                 | ✅ **PRODUCCIÓN**  |
| `/api/v1/jobs`                   | Sistema B2B completo (696 líneas) | ✅ **EMPRESARIAL** |
| `/api/v1/marketplace`            | Gestión pacientes huérfanos       | ✅ **PRODUCCIÓN**  |
| `/api/v1/hospitals/*/status`     | Estado hospitales tiempo real     | ✅ **NUEVO**       |
| `/api/v1/payments/mercadopago/*` | Facturación empresarial           | ✅ **PRODUCCIÓN**  |

## 🚀 Funcionalidades Tiempo Real

- ✅ **Hospital Monitoring**: Monitoreo de saturación en tiempo real
- ✅ **Auto Redistribution**: Redistribución automática de pacientes
- ✅ **Staff Shortage Detection**: Detección de déficit de personal
- ✅ **WhatsApp Integration**: Reportes rápidos vía WhatsApp Business
- ✅ **IoT Sensors**: Integración con sensores hospitalarios

## ⚠️ Configuración Especial

### **Turbopack Deshabilitado**

- **Problema**: Turbopack cuelga con librerías como recharts, lucide-react
- **Solución**: package.json sin `--turbopack`

### **Firebase v9+ Modular API**

- Usar imports modulares: `import { collection, doc } from '@altamedica/firebase/client'`
- NO usar API antigua: `db.collection()` está deprecado

## 💳 Sistema de Facturación Empresarial

### **Dashboard de Facturación** (`/billing`)

- ✅ **Métricas en Tiempo Real**: Ingresos, saldo pendiente, próximo pago
- ✅ **Gestión de Suscripciones**: Planes, cambios, renovación automática
- ✅ **Gestión de Facturas**: Tabla completa, descarga PDF, exportación
- ✅ **Reportes Contables**: AFIP compatible, IVA 21%, CAE

### **Integración Dual de Pagos**

- **Stripe**: Pagos internacionales, PCI DSS compliant
- **MercadoPago**: Argentina/LATAM, QR, efectivo

### **Compliance Argentina**

- Facturas A/B/C según condición fiscal
- CUIT/CUIL validación automática
- Exportación XML AFIP-compatible

## 🔗 Componentes Principales

### **Sistema de Redistribución**

- `HospitalNetworkDashboard.tsx`: Dashboard principal con métricas
- `HospitalRedistributionMap.tsx`: Mapa interactivo con Leaflet
- `HospitalDataIntegrationService.ts`: Integración multi-canal

### **Operations Hub**

- `OperationsTopBar.tsx`: Tabs estilo VS Code
- `MapShell.tsx`: Contenedor común con reflow
- `MarketplaceMap.tsx`: Mapa SSR-safe con clustering

## 🚧 Troubleshooting

### **Errores de Hidratación SSR**

- Usar `useEffect` para valores dinámicos (`Date.now()`, `Math.random()`)
- Crear componentes client-only con `"use client"`

### **Errores Firebase v9+**

```typescript
// ✅ Correcto
import { collection, doc } from '@altamedica/firebase/client';
const db = getFirebaseFirestore();
const colRef = = collection(db, 'hospitals');

// ❌ Incorrecto
db.collection('hospitals') // API antigua deprecada
```

### **Mapas "rotos" tras colapsar paneles**

- Verificar que `MapShell` emite evento `map:invalidate-size`
- Confirmar que el mapa escucha y llama `invalidateSize()`

**Documentación detallada**: Ver `/CHANGELOG.md` y `docs/TESTING-COMPLETE.md`

---

## 🚨 NUEVA FUNCIONALIDAD: Sistema de Control Hospitalario

### 🎮 Centro de Control (Torre de Control Aéreo)

El dashboard ahora incluye un sistema de redistribución de pacientes inspirado en torres de control de tráfico aéreo:

#### **Características Principales:**

1. **Monitoreo en Tiempo Real**
   - Vista de mapa interactivo con hospitales de la red
   - Indicadores de saturación con códigos de color
   - Actualización automática cada 30 segundos

2. **Redistribución Inteligente de Pacientes**
   - Detección automática de hospitales saturados (>85% capacidad)
   - Sugerencias de redistribución basadas en proximidad y capacidad
   - Rutas visualizadas en el mapa con animaciones

3. **Detección de Déficit de Personal**
   - Monitoreo automático de ratios paciente/personal
   - Publicación automática de vacantes en el marketplace
   - Alertas críticas cuando faltan especialistas

4. **Integración Multi-Canal**
   - WhatsApp Business API para reportes rápidos
   - API REST para sistemas hospitalarios
   - Sensores IoT para datos en tiempo real

### 🗺️ Componentes del Sistema

#### **HospitalNetworkDashboard** (`src/components/dashboard/HospitalNetworkDashboard.tsx`)

- Dashboard principal con métricas de red
- Gestión de redistribuciones y alertas
- Controles automáticos/manuales

#### **HospitalRedistributionMap** (`src/components/dashboard/HospitalRedistributionMap.tsx`)

- Mapa interactivo basado en Leaflet
- Visualización de hospitales con saturación
- Rutas de redistribución animadas
- Popups con información detallada

#### **HospitalDataIntegrationService** (`src/services/HospitalDataIntegrationService.ts`)

- Servicio de integración multi-canal
- Recolección de datos de WhatsApp, API, IoT
- Cálculo de saturación y recomendaciones

### 🎨 Nuevo Diseño UI - Torre de Control

El layout ha sido completamente rediseñado con estética de torre de control:

- **Tema Oscuro**: Fondo slate-950/900 para reducir fatiga visual
- **Header Principal**: "CENTRO DE CONTROL HOSPITALARIO" con indicadores de estado
- **Paneles de Estado**: Efectos de vidrio esmerilado con animaciones pulse
- **Notificaciones**: Sistema de alertas en tiempo real estilo militar
- **Métricas**: Cards oscuras con gradientes y efectos de transparencia

---

## 🧭 Operations Hub (Crisis + Marketplace unificado)

Unificamos la experiencia de “Centro de Control” y “Marketplace” en una sola vista operativa con estilo VS Code, sin romper mapas ni el layout al colapsar paneles.

### Componentes Clave

- `OperationsTopBar` (`src/components/operations-hub/OperationsTopBar.tsx`)
  - Tabs: network / redistribution / marketplace
  - Indicadores (crisis, perfiles), zen mode y acciones rápidas
  - Tematizado con tokens VS Code

- `MapShell` (`src/components/operations-hub/MapShell.tsx`)
  - Contenedor común para mapas con header, leyenda colapsable, fullscreen
  - Reflows robustos: emite eventos de layout y dispara re-size del mapa
  - Persistencia de UI (leyenda visible) vía localStorage

- `CrisisMapPanel` (envuelve `HospitalRedistributionMap`)
  - Depende de `CrisisDataProvider`; la página del hub ya lo provee

- `MarketplaceMap` (`src/components/MarketplaceMap.tsx`)
  - Mapa SSR-safe (dynamic import react-leaflet)
  - Markers de doctores/empresas, popups y panel lateral de candidato
  - Alineado a tema VS Code; escucha `map:invalidate-size`

### Reflow de Leaflet sin roturas

- El shell (y otros paneles) disparan `window.dispatchEvent(new Event('map:invalidate-size'))` al cambiar layout.
- Los mapas (Marketplace/Crisis) escuchan ese evento y ejecutan `invalidateSize()` con un pequeño retardo para estabilizar.
- Esto evita el “mapa roto” al plegar/expandir secciones o cambiar pestañas.

### Tema y consistencia visual

- Tokens tipo VS Code: `bg-vscode-*`, `text-vscode-*`, `border-vscode-*` en TopBar, Shell y paneles.
- El gradiente global se enmascara dentro del contenedor del hub con fondo VS Code.
- MarketplaceMap soporta overrides de UI via prop `ui` (`Button`, `Badge`) para integrar `@altamedica/ui` sin romper estilos.

### Persistencia ligera de UI

- Estado de leyenda, pestaña activa y preferencias mínimas se guardan en localStorage (namespace `ops.*`).
- No se persisten datos sensibles ni tokens; cumple flujo de seguridad (sesiones en cookies HttpOnly desde `api-server`).

### Estado actual del Hub

- ✅ Pestañas operativas: network (placeholder), redistribution (CrisisMapPanel), marketplace (MarketplaceMap)
- ✅ Hidratación estable (sin overlays SSR divergentes)
- ✅ Reflows del mapa bajo colapsables y fullscreen
- ✅ Tema VS Code aplicado en TopBar/MapShell/MarketplaceMap
- ⚠️ Pendiente: theming completo de markers/botones en popups y clustering para alta densidad

---

## 🏗️ Arquitectura Backend - AltaMedica

### 📍 **Ubicación de Servicios Backend**

```
🌐 API Server (Puerto 3001)
├── 📂 /mnt/c/Users/Eduardo/Documents/devaltamedica/apps/api-server/
├── 🔗 URL: http://localhost:3001
└── 📚 Documentación: /apps/api-server/CLAUDE.md

🔥 Firebase Services (v9+ Modular API)
├── 🗄️ Firestore: Base de datos principal
├── 🔐 Firebase Auth: Autenticación de usuarios
├── 💾 Firebase Storage: Almacenamiento de archivos empresariales
└── 📱 Cloud Messaging: Notificaciones push
```

### 🔌 **APIs Principales para Companies App**

| Endpoint                         | Propósito                             | Estado                   |
| -------------------------------- | ------------------------------------- | ------------------------ |
| `/api/v1/auth/*`                 | Login empresarial                     | ✅ **PRODUCCIÓN**        |
| `/api/v1/jobs`                   | **Sistema B2B completo** (696 líneas) | ✅ **NIVEL EMPRESARIAL** |
| `/api/v1/marketplace`            | Gestión pacientes huérfanos           | ✅ **PRODUCCIÓN**        |
| `/api/v1/users`                  | Gestión de empleados médicos          | ✅ **PRODUCCIÓN**        |
| `/api/v1/hospitals/*/status`     | Estado de hospitales en tiempo real   | ✅ **NUEVO**             |
| `/api/v1/hospitals/*/metrics`    | Métricas históricas                   | ✅ **NUEVO**             |
| `/api/v1/payments/mercadopago/*` | Facturación empresarial               | ✅ **PRODUCCIÓN**        |
| `/api/v1/finops/cost-estimation` | Sistema FinOps empresarial            | ✅ **NIVEL EMPRESARIAL** |

### 🚀 **Funcionalidades Tiempo Real**

- ✅ **Hospital Monitoring:** Monitoreo de saturación en tiempo real
- ✅ **Auto Redistribution:** Redistribución automática de pacientes
- ✅ **Staff Shortage Detection:** Detección de déficit de personal
- ✅ **Job Auto-Publishing:** Publicación automática de vacantes
- ✅ **WhatsApp Integration:** Reportes rápidos vía WhatsApp
- ✅ **IoT Sensors:** Integración con sensores hospitalarios
- ✅ **Firestore Listeners:** Dashboard en tiempo real
- ✅ **Marketplace Events:** Eventos del marketplace médico

### 🔐 **Express + Middleware Stack**

- ✅ **UnifiedAuth:** Middleware de autenticación centralizado
- ✅ **Rate Limiting:** Protección contra spam
- ✅ **HIPAA Compliance:** Auditoría automática de acciones médicas
- ✅ **Service Pattern:** Lógica de negocio en servicios especializados

---

## ⚠️ **Configuración Especial**

### **Turbopack Deshabilitado**

Esta aplicación NO debe usar Turbopack debido a problemas de compilación:

- **Problema:** Turbopack cuelga indefinidamente con ciertas librerías
- **Solución:** package.json modificado sin `--turbopack`
- **Librerías problemáticas:** recharts, lucide-react

### **Firebase v9+ Modular API**

- Usar imports modulares: `import { collection, doc, query } from '@altamedica/firebase/client'`
- NO usar API antigua: `db.collection()` está deprecado
- Siempre obtener Firestore con: `const db = getFirebaseFirestore()`

---

## 🔗 Integraciones Técnicas

### APIs Backend

- **API Principal:** Consume datos del `api-server` (Puerto 3001) especializado en funciones B2B
- **Autenticación:** Firebase Auth con roles de `company-admin`
- **Base de datos:** Firebase Firestore para datos empresariales en tiempo real
- **WhatsApp Business:** Integración para reportes hospitalarios rápidos
- **Sensores IoT:** Protocolo MQTT para datos de sensores

### Estado Actual del Dashboard

- **Vista General:** ✅ Implementada con métricas principales
- **Centro de Control:** ✅ Sistema de redistribución completo
- **Mapa Interactivo:** ✅ Visualización geográfica de hospitales
- **Operations Hub (Crisis + Marketplace):** ✅ Primera versión funcional integrada
- **Personal Médico:** 🚧 En desarrollo
- **Pacientes:** 🚧 En desarrollo
- **Citas:** 🚧 En desarrollo
- **Analíticas:** 🚧 En desarrollo
- **Marketplace:** ✅ Integrado con detección de déficit

## 3. Estructura de Archivos

```
src/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx    # Layout estilo torre de control
│   │   └── page.tsx      # Dashboard con HospitalNetworkDashboard
│   ├── page.tsx          # Página principal
│   └── layout.tsx        # Layout raíz
├── components/
│   ├── dashboard/
│   │   ├── HospitalNetworkDashboard.tsx  # Dashboard principal
│   │   └── HospitalRedistributionMap.tsx # Mapa interactivo
│   ├── navigation/
│   │   ├── CompanyNavigation.tsx
│   │   └── Breadcrumbs.tsx
│   └── layout/
│       └── CompanyLayoutProvider.tsx
├── services/
│   ├── HospitalDataIntegrationService.ts # Integración multi-canal
│   └── integrations/
│       ├── WhatsAppService.ts    # Cliente WhatsApp Business
│       ├── HospitalAPIService.ts # Cliente API REST
│       └── IoTSensorService.ts   # Cliente sensores IoT
└── types/
    └── hospital.types.ts
```

## 4. Componentes y Librerías

### Componentes UI Principales

- **Torre de Control UI**: Tema oscuro con efectos de transparencia
- **Mapa Interactivo**: Leaflet + react-leaflet para visualización
- **Cards de Métricas**: Con gradientes y animaciones
- **Sistema de Alertas**: Notificaciones en tiempo real

### MarketplaceMap (contrato y uso)

- Props principales:
  - `doctors`, `companies`, `center?`, `filters?`, `showDoctors?`, `showCompanies?`
  - Nuevas: `theme = 'vscode'`, `enableControls = false`, `includeDefaultHospital = true`, `ui?` (overrides de `Button`/`Badge`)
- Callbacks: `onDoctorSelect`, `onCompanySelect`
- SSR-safe: dynamic imports de react-leaflet + placeholder tematizado
- Reflow: suscripción a `map:invalidate-size` y `invalidateSize()`
- Controles opcionales (zoom/reset/filtros/región/foco): se pueden integrar al TopBar/MapShell
- Pendiente: clustering para >500 marcadores y consolidar estilos de markers (divIcon)

### Servicios de Integración

```typescript
// Configuración de integración
const hospitalConfig = {
  whatsapp: {
    enabled: true,
    phoneNumber: '+57 310 123-4567',
    apiKey: 'demo-whatsapp-key',
  },
  api: {
    enabled: true,
    endpoint: 'https://api.hospital-demo.com',
    apiKey: 'demo-api-key',
  },
  iot: {
    enabled: true,
    devices: ['sensor-001', 'camera-002', 'beacon-003'],
  },
};
```

## 5. Comandos de Desarrollo

```bash
# Desarrollo (SIN Turbopack)
npm run dev

# Build de producción
npm run build

# Limpiar caché si hay problemas
rm -rf .next

# Testing
npm run test
npm run test:watch

# Linting y Type Check
npm run lint
npm run type-check

Nota: Este proyecto convive en monorepo pnpm. En esta app específica, `npm run dev` funciona de forma aislada; para orquestar todo el monorepo usar los scripts raíz con pnpm.
```

## 5.1. Reglas Operativas (IA y equipo)

Estas reglas son obligatorias para mantener estabilidad y calidad. Usa tono imperativo (DEBES/PROHIBIDO) y aplícalas antes de abrir PR.

### A) Cuándo correr Lint/Typecheck

- DEBES ejecutar lint y type-check:
  - Antes de cada commit significativo (>20 líneas o refactors).
  - Antes de cada push y antes de abrir PR.
  - Tras cambiar tipos compartidos (`@altamedica/types`) o contratos públicos.
  - Tras modificar `.tsx`, `.ts`, `.css`, `.md` o configuración (`next.config`, `tsconfig`).

Comandos sugeridos:

```powershell
# En la raíz del monorepo (preferido)
pnpm -w lint:fix
pnpm -w type-check

# Solo para esta app (aislado)
npm run lint
npm run type-check
```

También puedes usar las tareas de VS Code: “🧹 Lint Fix” y “🧪 Run Tests”.

### B) Regla de Lectura (lee antes de escribir)

- DEBES identificar contrato y dependencias ANTES de editar:
  - Tipos en `@altamedica/types` y utilidades en `packages/`.
  - Providers/contexts (ej.: `CrisisDataProvider`, `OperationsUIProvider`).
  - Archivos hermano (tests, docs, índices) para coherencia.
- PROHIBIDO duplicar lógica existente en `packages/` si puede reutilizarse.
- Para mapas, verifica SSR-safety (imports dinámicos) y reflow (`map:invalidate-size`).

Checklist mínimo de lectura:

- [ ] Componente/servicio a tocar
- [ ] Tipos/contratos vinculados
- [ ] Contexto/provider y usos
- [ ] Docs (este CLAUDE.md) / notas de arquitectura

### C) Regla de Edición (cambios mínimos y seguros)

- DEBES introducir cambios mínimos; PROHIBIDO re-formatear archivos completos sin necesidad.
- Mantén estilo y no rompas APIs públicas sin actualizar tipos, docs y usos.
- React/Next.js:
  - Evita `window`/`document` en server; usa `dynamic(..., { ssr:false })` cuando aplique.
  - Leaflet: llama `invalidateSize()` tras cambios de layout.
- Actualiza pruebas y docs en el mismo PR cuando cambie el comportamiento.
- Usa Conventional Commits con ámbito claro (ej.: `fix(companies): reflow robusto en mapa`).

### D) Regla de Razonamiento (antes de codear)

- Define un micro-contrato en el PR o descripción técnica:
  - Inputs/outputs y formas (enlaza a tipos Zod/TS si existen).
  - 3–5 casos borde (SSR/hidratación, vacíos, errores red, timeouts, permisos).
  - Criterios de éxito y validación (lint/tests/smoke).
- Para mapas/UI sensibles al layout, documenta estrategia de reflow y eventos escuchados/emitidos.

### E) Regla en Archivos Paralelos (mantén coherencia)

Cuando edites/crees uno, DEBES revisar/actualizar sus pares:

- Componente React (`src/components/**/Nombre.tsx`)
  - Test (`src/components/**/Nombre.test.tsx` o en paquete de tests)
  - `index.ts` de exportación si existe
  - Tipos (`src/types/*.ts` o `@altamedica/types`)
  - Docs (este `CLAUDE.md` o README de la feature)
- Página App Router (`src/app/**/page.tsx`)
  - `loading.tsx` / `error.tsx` si la ruta los requiere
  - Provider/navegación si introduce estado/contexto
- Servicio (`src/services/**/NombreService.ts`)
  - Tipos de request/response y validaciones
  - Puntos de consumo (componentes/contexts)
- Mapas (Leaflet)
  - Emisor `map:invalidate-size` (p. ej., `MapShell`)
  - Listener `map:invalidate-size` en el mapa afectado

### F) Patrón de Archivos en Paralelo (globs sugeridos)

- Componentes:
  - `src/components/**/[A-Z]*.tsx`
  - `src/components/**/[A-Z]*.test.tsx`
  - `src/components/**/index.ts`
- Tipos/contratos:
  - `src/types/**/*.ts`
  - `packages/@altamedica/types/src/**/*.ts`
- Servicios:
  - `src/services/**/[A-Z]*Service.ts`
- Rutas App Router:
  - `src/app/**/page.tsx`
  - `src/app/**/loading.tsx`
  - `src/app/**/error.tsx`
- Mapas y shell:
  - `src/components/operations-hub/MapShell.tsx`
  - `src/components/**/Map*.tsx`

## 6. Solución de Problemas

### Errores de Hidratación SSR

- **Problema**: `Hydration failed because the server rendered text didn't match`
- **Causa**: Uso de `Date.now()` o `Math.random()` en render inicial
- **Solución**: Usar `useEffect` para valores dinámicos o crear componentes client-only

### Errores de Firebase

- **Problema**: `db.collection is not a function`
- **Causa**: Usando API antigua de Firebase
- **Solución**: Usar imports modulares v9+:
  ```typescript
  import { collection, doc, query } from '@altamedica/firebase/client';
  const db = getFirebaseFirestore();
  const colRef = collection(db, 'hospitals');
  ```

### Si la compilación se cuelga:

1. Asegúrate de NO estar usando Turbopack
2. Limpia el caché: `rm -rf .next`
3. Verifica que no haya imports circulares
4. Revisa el script check-circular-deps.js

### Si los mapas se “rompen” tras colapsar paneles:

1. Verifica que `MapShell` emite el evento `map:invalidate-size`
2. Confirma que el mapa escucha el evento y llama `invalidateSize()`
3. Asegúrate de no renderizar contenido condicional SSR-only que cambie en hidratación

### Si hay errores de módulos no encontrados:

1. Verifica que las dependencias estén instaladas: `npm install`
2. Revisa que los imports sean correctos
3. Considera usar imports directos en lugar de barrel exports

## 7. Arquitectura de Redistribución de Pacientes

### Flujo de Decisión

```
1. MONITOREO CONTINUO
   └─> Recolección de datos cada 30s
       ├─> WhatsApp: Reportes manuales
       ├─> API: Sistemas hospitalarios
       └─> IoT: Sensores en tiempo real

2. DETECCIÓN DE SATURACIÓN
   └─> Cálculo de score (0-100)
       ├─> Ocupación de camas (30%)
       ├─> Tiempo de espera (25%)
       ├─> Ratio paciente/personal (25%)
       └─> Pacientes críticos (20%)

3. GENERACIÓN DE SUGERENCIAS
   └─> Si saturación > 85%
       ├─> Buscar hospitales cercanos
       ├─> Verificar capacidad disponible
       └─> Calcular rutas óptimas

4. EJECUCIÓN DE REDISTRIBUCIÓN
   └─> Manual o automática
       ├─> Notificar hospitales
       ├─> Coordinar transporte
       └─> Actualizar sistemas
```

### Criterios de Redistribución

- **Proximidad**: Máximo 50km de distancia
- **Capacidad**: Hospital receptor <70% ocupación
- **Especialidad**: Matching de especialidades requeridas
- **Criticidad**: Prioridad a pacientes estables

## 8. Notas de Desarrollo

- La app está optimizada para hospitales y clínicas medianas/grandes
- El diseño de torre de control reduce fatiga visual en monitoreo 24/7
- Sistema preparado para escalar a redes de 100+ hospitales
- Integración WhatsApp permite reportes desde zonas con conectividad limitada
- Arquitectura preparada para ML/AI predictivo de saturación

## 9. Próximos Pasos

1. **Implementar ML para predicción** de saturación hospitalaria
2. **Integrar con sistemas de ambulancias** para transporte automatizado
3. **Dashboard móvil** para directores médicos
4. **API GraphQL** para consultas más eficientes
5. **Blockchain** para trazabilidad de redistribuciones
6. **Integración con wearables** para monitoreo de pacientes

---

## 💳 Sistema de Facturación Empresarial

### 🎯 **Dashboard de Facturación** (`/billing`)

Implementación completa del sistema de facturación con integración dual de pasarelas de pago:

#### **Características Implementadas**:

1. **Métricas en Tiempo Real**
   - Ingresos del mes actual con comparación mes anterior
   - Saldo pendiente de facturas abiertas
   - Próximo pago programado
   - Total pagado en el año

2. **Gestión de Suscripciones**
   - Visualización del plan actual
   - Cambio de planes disponible
   - Cancelación programada
   - Renovación automática

3. **Gestión de Facturas**
   - Tabla completa de facturas con estados
   - Descarga individual en PDF
   - Exportación masiva
   - Modal de detalle de factura

4. **Reportes Contables**
   - Libro IVA Ventas (AFIP compatible)
   - Resumen mensual de ingresos/gastos
   - Estado de cuenta detallado
   - Facturas electrónicas XML para AFIP
   - Reportes personalizados bajo demanda

#### **Integración con Pasarelas de Pago**:

```typescript
// MercadoPago Service
packages/shared/src/services/mercadopago.service.ts
- Pagos con tarjeta y efectivo
- Suscripciones recurrentes
- Point of Sale (QR)
- Webhooks seguros

// Stripe Service
packages/shared/src/services/payment-gateway.service.ts
- Pagos internacionales
- Gestión de métodos de pago
- Subscriptions management
- PCI DSS compliant
```

#### **Compliance Argentina**:

- Facturas tipo A/B/C según condición fiscal
- IVA 21% calculado automáticamente
- CAE (Código de Autorización Electrónico)
- CUIT/CUIL validación
- Exportación AFIP-compatible

### 📝 Changelog

- **14 de agosto 2025**: Sistema de Facturación Completo
  - Dashboard de facturación implementado en `/billing`
  - Integración dual Stripe + MercadoPago
  - Reportes contables AFIP-compatibles
  - Generación automática de facturas con cron jobs
  - PCI DSS compliance implementado

- **12 de agosto 2025**: E2E Marketplace reforzado
  - Se añadieron data-testids estables en `/marketplace` (marketplace-root/header/title/tabs, tab-_, toggle-left/right-panel, left/right-panel, offers-_, professionals-\*, marketplace-map-container, create-new-job, job-form-modal/close-job-form-modal).
  - Se actualizó `packages/e2e-tests/tests/companies-home-and-marketplace.spec.ts` para usar testids, togglear paneles y abrir/cerrar el modal de “Nueva Oferta”.

- **9 de agosto 2025**: Reglas operativas añadidas
  - Reglas de Lint/Typecheck obligatorias y momentos de ejecución
  - Reglas de lectura previa, edición mínima, razonamiento y archivos paralelos
  - Patrones de archivos en paralelo para coherencia del código

- **9 de agosto 2025**: Operations Hub + mejoras de mapa
  - Nueva ruta `/operations-hub` con TopBar + MapShell
  - Integración de CrisisMapPanel y MarketplaceMap en pestañas
  - Estrategia de reflow del mapa vía `map:invalidate-size`
  - Theming VS Code aplicado; eliminación de gradientes problemáticos
  - Fix de hidratación: se removieron overlays SSR-only en shells
  - `CrisisDataProvider` envuelve el Hub para evitar errores de contexto

- **9 de agosto 2025**: Implementación completa del Sistema de Control Hospitalario
  - Nuevo diseño UI estilo torre de control
  - Mapa interactivo con redistribución de pacientes
  - Integración multi-canal (WhatsApp, API, IoT)
  - Detección automática de déficit de personal
  - Corrección de errores Firebase v9+
  - Solución de problemas de hidratación SSR

- **28 de enero 2025**: Versión inicial del portal B2B

ejemplo de como crear una pagina: hagamos una cosa, ayudame a crear marketplace en una pagina. con todas las funciones que esta en el archivo components

Referencia de 1 usada
Buscaré los componentes del Marketplace y el árbol de app para crear una página marketplace que los use con imports SSR-safe y los providers apropiados; luego generaré la página con el shell y funcionalidades integradas.

Se buscaron archivos que coinciden con **/apps/companies/**/MarketplaceMap.tsx, no hay coincidencias

Haré una búsqueda amplia en el repositorio para ubicar MarketplaceMap u otros componentes del marketplace y confirmar sus rutas reales antes de crear la nueva página.

Texto buscado para MarketplaceMap|marketplace map|MarketplaceProvider|marketplace, resultados 200
Para crear/confirmar la página Marketplace, revisaré si ya existe page.tsx y, si falta, la crearé con Providers y el componente MarketplaceMap SSR-safe, reutilizando funciones desde components. Luego validaré imports y tipos.

---

## 🔁 Recarga segura de chunks en desarrollo

Para evitar pantallas en blanco por `ChunkLoadError` durante HMR, el layout raíz inyecta un pequeño handler en cliente que hace reload con `?nocache` cuando detecta el error en `console.error`.

- No existe ningún componente `ChunkReload` en el proyecto. Si aparece `ReferenceError: ChunkReload is not defined`, elimina su uso del layout y conserva el handler inline:
  - Archivo: `src/app/layout.tsx`
  - Mantén solo: `<script dangerouslySetInnerHTML={{ __html: handlerScript }} />`

Buenas prácticas:

- Evita side-effects en el server (App Router). Cualquier lógica dependiente de `window` debe vivir en componentes `"use client"` o scripts inline controlados.
- Limpia `.next` si persisten errores tras cambios de dependencias.

## 🗺️ Mapa SSR-safe y reflows robustos

- `MarketplaceMap` y mapas de Crisis usan imports dinámicos de `react-leaflet` con `ssr: false`.
- Al cambiar el layout (colapsar paneles, fullscreen), emite `window.dispatchEvent(new Event('map:invalidate-size'))`.
- Los mapas escuchan ese evento y llaman `invalidateSize()` con un pequeño `setTimeout`.
- Asegúrate de que el contenedor tenga `h-full w-full` y que el wrapper del mapa haga un `invalidateSize()` inicial tras montar.

## 🧭 Operations Hub (Crisis + Marketplace)

- Ruta: `/marketplace` u `/operations-hub` según despliegue actual.
- Shell estilo VS Code con paneles colapsables y tabs; el mapa está al centro.
- Onboarding de demo de crisis: activa modo demo (ruta y ambulancia) y dispara reflow al avanzar pasos.
