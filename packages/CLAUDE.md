# 📦 Packages - Ecosistema de Componentes Compartidos AltaMedica

## 🤖 FRAGMENTOS PARA AUTOCOMPLETADO DE PACKAGES

### ✅ Script Start (Types Package)
```javascript
import { z } from 'zod';
```

### ✅ Medical Schemas Pattern
```javascript
export const PatientSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  dateOfBirth: z.string().datetime(),
  medicalRecordNumber: z.string().min(1)
});

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  startTime: z.string().datetime(),
  duration: z.number().min(15).max(180),
  type: z.enum(['consultation', 'follow-up', 'emergency'])
});
```

### ✅ API Response Schema
```javascript
export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime()
});
```

### ✅ Validate Medical Data
```javascript
const validateMedicalData = (data, schema) => {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    return { 
      valid: false, 
      errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    };
  }
};
```

---

**Directorio**: Biblioteca central de 26 paquetes compartidos  
**Propósito**: Funcionalidad reutilizable para todas las aplicaciones  
**Estado**: 🟢 PRODUCCIÓN (9.0/10)  
**Última actualización**: 20 de agosto de 2025

## 🚨 REGLAS CRÍTICAS PARA CLAUDE

### ❌ COMANDOS PROHIBIDOS - NUNCA EJECUTAR:

- `pnpm build`, `pnpm lint`, `pnpm type-check`, `tsc`, `tsup`
- `npm install` o cualquier comando de instalación
- NINGÚN comando de compilación o validación

### ✅ SOLO PERMITIDO:

- Leer archivos (Read/Grep/LS)
- Escribir/editar código (Edit/Write)
- Crear documentación y análisis

## 🌳 WORKTREE ESPECÍFICO PARA PACKAGES

- **Para auditar duplicaciones**: usar `../devaltamedica-audit/`
- **Para integrar packages**: usar `../devaltamedica-integrate/`
- **Para validar**: usar `../devaltamedica-validate/`
- **Regla de oro**: BUSCAR 5 veces antes de crear cualquier package

## 🎯 Visión General del Ecosistema

Los **26 paquetes** forman la **arquitectura base** de AltaMedica, proporcionando:

1. **Máxima reutilización** - Código escrito una vez, usado en todas las apps
2. **Consistencia absoluta** - UI, tipos y lógica unificada
3. **Mantenibilidad centralizada** - Un cambio se aplica globalmente
4. **Separación clara** - Apps consumen, packages proveen

### Estructura por Dominio

```
📦 packages/
├── 🔐 AUTENTICACIÓN (3 paquetes)
├── 🎨 UI/DISEÑO (2 paquetes)
├── 📊 DATOS/TIPOS (2 paquetes)
├── 🔗 HOOKS/ESTADO (3 paquetes)
├── 🏥 DOMINIO MÉDICO (6 paquetes)
├── 🌐 API/COMUNICACIÓN (2 paquetes)
├── 💾 DATOS/PERSISTENCIA (1 paquete)
├── 🤖 INTELIGENCIA ARTIFICIAL (2 paquetes)
└── 🔧 HERRAMIENTAS/CONFIG (5 paquetes)
```

## 🚫 ESTÁNDARES OBLIGATORIOS CRÍTICOS

### Configuración Estándar EXACTA para Nuevos Paquetes

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

### ❌ Prohibiciones Absolutas

1. **TypeScript ≠ ^5.8.3** → INACEPTABLE
2. **Sin `"type": "module"`** → INACEPTABLE
3. **Exportar desde `src/`** → DEBE SER `dist/`
4. **Solo CommonJS** → DUAL CJS + ESM obligatorio
5. **React diferente a `^18.2.0 || ^19.0.0`** → INACEPTABLE

## 📚 Paquetes por Categoría

### 🔐 Autenticación y Seguridad

| Paquete                  | Propósito                | Estado        | Líneas |
| ------------------------ | ------------------------ | ------------- | ------ |
| **@altamedica/auth**     | SSO, JWT, sesiones       | ✅ Producción | 1,200+ |
| **@altamedica/firebase** | Cliente Firebase + Admin | ✅ Producción | 850+   |

**Exports principales**:

```typescript
// @altamedica/auth
export { useAuth, AuthProvider, ssoClient, User, AuthState };

// @altamedica/firebase
export { adminAuth, adminDb, clientAuth, firestore };
```

### 🎨 UI y Sistema de Diseño

| Paquete                         | Propósito                 | Estado        | Líneas |
| ------------------------------- | ------------------------- | ------------- | ------ |
| **@altamedica/ui**              | Componentes React + Radix | ✅ Producción | 2,500+ |
| **@altamedica/tailwind-config** | Configuración Tailwind    | ✅ Producción | 200+   |

**Componentes destacados**:

```typescript
// Médicos especializados
export { PatientCard, AppointmentCard, HealthMetricCard, VitalSignsChart };

// UI Core
export { Button, Card, Input, Badge, Progress, Separator };

// Formularios médicos
export { MedicalIntakeForm, SearchFilter, FormError };

// AI Médica
export { MedicalAIAssistant, PredictiveHealthAnalytics };
```

### 📊 Tipos y Validación

| Paquete                           | Propósito                  | Estado        | Líneas |
| --------------------------------- | -------------------------- | ------------- | ------ |
| **@altamedica/types**             | Contratos TypeScript + Zod | ✅ Producción | 1,800+ |
| **@altamedica/typescript-config** | Config TS base             | ✅ Producción | 100+   |

**El contrato central**:

```typescript
// Imports modulares optimizados
import { Patient, PatientSchema } from '@altamedica/types/medical/patient';
import { Doctor } from '@altamedica/types/medical/doctor';
import { Appointment } from '@altamedica/types/medical/clinical';
import { APIResponse } from '@altamedica/types/api';
import { HIPAACompliance } from '@altamedica/types/security';
```

### 🔗 Hooks y Estado

| Paquete                    | Propósito            | Estado        | Líneas |
| -------------------------- | -------------------- | ------------- | ------ |
| **@altamedica/hooks**      | 80+ React hooks      | ✅ Producción | 3,000+ |
| **@altamedica/api-client** | TanStack Query + API | ✅ Producción | 1,500+ |

**Hook categories**:

```typescript
// Dominio médico
export { usePatients, useMedicalAI, useHealthMetrics, usePrescriptions };

// Autenticación
export { useAuth, usePermissions };

// Real-time
export { useWebSocket, useNotifications, useRealTimeUpdates };

// UI/UX
export { useTheme, useToast, useModal, useAccessibility };

// Utilidades
export { useDebounce, useLocalStorage, useMediaQuery, useAsync };
```

### 🏥 Dominio Médico

| Paquete                           | Propósito                   | Estado        | Líneas |
| --------------------------------- | --------------------------- | ------------- | ------ |
| **@altamedica/medical**           | Utilidades médicas          | ✅ Producción | 800+   |
| **@altamedica/patient-services**  | Servicios pacientes         | ✅ Producción | 600+   |
| **@altamedica/telemedicine-core** | WebRTC videollamadas        | ✅ Producción | 1,200+ |
| **@altamedica/anamnesis**         | Historia clínica gamificada | ✅ Producción | 900+   |

**Funcionalidad médica**:

```typescript
// Cálculos médicos
export { calculateBMI, validateVitalSigns, formatMedicalDate };

// Telemedicina
export { useTelemedicineUnified, videoCallClient, webrtcService };

// Anamnesis interactiva
export { UnifiedAnamnesis, useAnamnesis, anamnesisService };
```

### 🤖 Inteligencia Artificial

| Paquete                    | Propósito              | Estado        | Líneas |
| -------------------------- | ---------------------- | ------------- | ------ |
| **@altamedica/ai-agents**  | Agentes IA diagnóstico | ✅ Producción | 400+   |
| **@altamedica/alta-agent** | Agente conversacional  | ✅ Producción | 1,000+ |

**AI Services**:

```typescript
export { aiAgentsService, diagnosticAgent, AltaAgent, AltaAgentWithAI };
```

### 🌐 API y Comunicación

| Paquete                     | Propósito             | Estado        | Líneas |
| --------------------------- | --------------------- | ------------- | ------ |
| **@altamedica/api-client**  | Cliente API unificado | ✅ Producción | 1,500+ |
| **@altamedica/api-helpers** | Utilidades respuestas | ✅ Producción | 200+   |

### 💾 Datos y Persistencia

| Paquete                  | Propósito             | Estado        | Líneas |
| ------------------------ | --------------------- | ------------- | ------ |
| **@altamedica/database** | Prisma ORM + repos    | ✅ Producción | 2,000+ |
| **@altamedica/shared**   | Servicios compartidos | ✅ Producción | 1,200+ |

**Repositorios disponibles**:

```typescript
export {
  PatientRepository,
  MedicalRecordRepository,
  BaseRepository,
  CompanyService,
  B2CCommunicationService,
  DatabaseConnection,
};
```

## 🔄 Flujo de Dependencias

### Jerarquía Optimizada

```
Nivel 0: typescript-config, eslint-config, utils
Nivel 1: types, shared
Nivel 2: firebase, auth, database
Nivel 3: ui, hooks, api-client, medical
Nivel 4: patient-services, telemedicine-core
Nivel 5: ai-agents, alta-agent
```

### Reglas de Dependencia

1. **No dependencias circulares** - Flujo unidireccional estricto
2. **Workspace protocol** - `workspace:*` para dependencias internas
3. **Peer dependencies** - React y React-DOM como peers
4. **Type safety** - TypeScript estricto en todos los paquetes

## 🧪 Testing y Calidad

### Coverage por Tipo

- **Utilidades**: 80% mínimo
- **Paquetes médicos**: 95% requerido
- **UI components**: 90% + tests accesibilidad
- **Hooks**: 85% + edge cases

### Comandos Testing

```bash
# Por paquete específico
pnpm --filter @altamedica/[package-name] test

# Testing global
pnpm test                    # Todos los paquetes
pnpm test:medical           # Solo paquetes médicos
pnpm test:integration       # Tests integración
```

## 🧭 Referencias Críticas para Análisis Replicable

- Documentación de calidad por worktrees: `docs/GUIA-DEFINITIVA-WORKTREE-QUALITY.md`
- Validación técnica independiente (score y evidencia): `docs/VALIDACION_TECNICA_ALTAMEDICA.md`

Regla: Antes de auditar/integrar/validar, leer ambas referencias y seguir el playbook y quality gates.

## 🔒 Seguridad y Compliance HIPAA

### Paquetes Críticos HIPAA

- **@altamedica/auth** - Autenticación y autorización
- **@altamedica/database** - Persistencia datos PHI
- **@altamedica/telemedicine-core** - Comunicación segura
- **@altamedica/medical** - Procesamiento datos médicos

### Requisitos de Seguridad

- **Encriptación AES-256-GCM** para PHI
- **Audit logging** en operaciones médicas
- **Access control** basado en roles
- **Data retention** policies implementadas

## 📊 Métricas del Ecosistema

### Estadísticas Actuales

- **Total paquetes**: 26
- **Líneas de código**: ~75,000
- **Componentes React**: 150+
- **Hooks personalizados**: 80+
- **Tipos TypeScript**: 200+
- **Coverage promedio**: 82%

### Bundle Sizes (optimizado)

| Paquete                | Size (min) | Size (gzip) |
| ---------------------- | ---------- | ----------- |
| @altamedica/ui         | 145 KB     | 42 KB       |
| @altamedica/hooks      | 89 KB      | 28 KB       |
| @altamedica/medical    | 112 KB     | 36 KB       |
| @altamedica/api-client | 78 KB      | 24 KB       |

## 🚀 Comandos de Desarrollo

### Comandos Globales

```bash
# Build todos los paquetes
pnpm build

# Build específico
pnpm --filter @altamedica/[package] build

# Linting global
pnpm lint

# Type checking global
pnpm type-check
```

### Comandos por Paquete

```bash
cd packages/[package-name]

# Desarrollo con watch
pnpm dev

# Testing
pnpm test
pnpm test:watch

# Limpieza
pnpm clean
```

## 🔄 Actualizaciones Recientes

### Estandarización Build (2025-08-17)

- **Unified TypeScript**: `^5.8.3` en todos los paquetes
- **Dual CJS/ESM**: Build estándar con tsup
- **React unificado**: `^18.2.0 || ^19.0.0` como peerDependency
- **Exports estandarizados**: Estructura consistente

### Middleware Unificado (2025-08-13)

- **@altamedica/auth/middleware**: Subpath exports disponibles
- **authGuard, createAuthMiddleware**: Listos para migración

### QueryProvider Unificado (2025-08-12)

```typescript
// Nuevas configuraciones disponibles
import { MedicalQueryProvider, QUERY_KEYS, cacheUtils } from '@altamedica/hooks/providers';
```

## 🛡️ Mejores Prácticas

### Desarrollo de Nuevos Paquetes

1. **Naming**: `@altamedica/[domain]-[function]`
2. **Verificar duplicación**: Buscar 5 veces funcionalidad existente
3. **Seguir estándar**: Usar configuración exacta obligatoria
4. **Tests mínimos**: 80% coverage general, 95% médico
5. **Documentación**: README con ejemplos claros

### Patrones de Importación Optimizados

```typescript
// ✅ CORRECTO - Importación principal
import { Button, Card } from '@altamedica/ui';

// ✅ CORRECTO - Modular (tree-shaking)
import { usePatients } from '@altamedica/hooks/medical';
import { PatientSchema } from '@altamedica/types/medical/patient';

// ❌ INCORRECTO - Rutas internas
import { Patient } from '@altamedica/types/src/medical/patient';
```

### Estructura Estándar de Package

```
packages/[package-name]/
├── src/
│   ├── index.ts              # Export principal
│   ├── components/           # Componentes (si aplica)
│   ├── hooks/               # Hooks (si aplica)
│   ├── services/            # Lógica de negocio
│   ├── utils/               # Utilidades
│   ├── types/               # Tipos específicos
│   └── constants/           # Constantes
├── dist/                    # Build output
├── package.json             # Config estándar
├── tsconfig.json           # TypeScript config
└── README.md               # Documentación
```

## 🐛 Troubleshooting Común

### Build Failures

```bash
# Limpiar y reconstruir
pnpm clean && pnpm install && pnpm build
```

### Type Errors entre Paquetes

```bash
# Verificar versión TypeScript
pnpm why typescript

# Reconstruir tipos
pnpm --filter @altamedica/types build
```

### Import Resolution Issues

```bash
# Verificar exports en package.json
# Verificar que dist/ existe con archivos .js y .d.ts
ls packages/[package-name]/dist/
```

## 🎯 Hoja de Ruta

### Corto Plazo (Q1 2025)

- [ ] Migración completa a React 19
- [ ] Optimización adicional de bundle sizes
- [ ] Tests E2E automatizados por paquete

### Medio Plazo (Q2 2025)

- [ ] Package registry privado
- [ ] Versionado automático con changesets
- [ ] Performance budgets automáticos

### Largo Plazo (Q3-Q4 2025)

- [ ] Micro-frontends con module federation
- [ ] Package analytics avanzado
- [ ] AI-powered package suggestions

## 📚 Recursos Adicionales

### Documentación Especializada

- **TYPES_ARCHITECTURE_MAP.md** - Mapa completo de tipos
- **HOOKS_ARCHITECTURE_MAP.md** - Arquitectura de hooks
- **PACKAGES_AUDIT_REPORT.md** - Reporte de auditoría

### Tools y Scripts

- **AI Test Generator** - Generación automática de tests
- **Bundle Analyzer** - Análisis de tamaño de bundles
- **Dependency Graph** - Visualización de dependencias

**El ecosistema de packages es el corazón técnico de AltaMedica, proporcionando una base sólida, escalable y mantenible para construir la plataforma médica del futuro.**
