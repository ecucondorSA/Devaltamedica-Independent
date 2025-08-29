# @AltaMedica - Glosario Maestro de Packages

## 🚀 Índice de Soluciones Rápidas

### 🔥 Errores Frecuentes - Acceso Directo
- [Error: LoggerService requires data parameter](#error-loggerservice-requires-data)
- [Error: UserRole debe usarse como enum](#error-userrole-enum)
- [Error: Edge Runtime - Node APIs no permitidas](#error-edge-runtime-node-apis)
- [Error: Deep imports no permitidos](#error-deep-imports)
- [Error: Font loading en Next.js](#error-font-loading)
- [Error: createSSOMiddleware not exported](#error-middleware-renamed)

### ⚙️ Configuración Rápida
- [ESLint Flat Config para Monorepo](#eslint-flat-config)
- [Script de Validación de Exports](#script-validacion)
- [GitHub Actions CI/CD](#github-actions-job)

### 📊 Matrices de Referencia
- [Runtime Compatibility Matrix](#runtime-compatibility-matrix)
- [Estabilidad de APIs](#api-stability)
- [Badges y Leyenda](#badges-legend)

### ✅ Best Practices
- [HIPAA Data Validation](#hipaa-validation)
- [Import Patterns Correctos](#import-patterns)
- [Estructura de Packages](#package-structure)

---

## 📚 Referencia Completa Alfabética - Todos los @Packages

> **🎯 Propósito**: Búsqueda rápida de cualquier tipo, función o componente en el @ecosistema @AltaMedica sin navegar subcarpetas.

### A

#### @AltaMedica/Auth
- **@AUTH_COOKIES** - `import { AUTH_COOKIES } from '@altamedica/auth'`
- **@AuthContext** - `import { AuthContext } from '@altamedica/auth'` 
- **@AuthGuard** - `import { AuthGuard } from '@altamedica/auth'`
- **@AuthProvider** - `import { AuthProvider } from '@altamedica/auth'`
- **@AuthService** - `import { AuthService } from '@altamedica/auth'`
- **@AuthState** - `import { type AuthState } from '@altamedica/auth'`
- **@authGuard** - `import { authGuard } from '@altamedica/auth'`

#### @AltaMedica/Types  
- **@Address** - `import { type Address } from '@altamedica/types'`
- **@AddressSchema** - `import { AddressSchema } from '@altamedica/types'`
- **@ApplicationStatus** - `import { type ApplicationStatus } from '@altamedica/types'`
- **@Appointment** - `import { type Appointment } from '@altamedica/types'`
- **@AuthResult** - `import { type AuthResult } from '@altamedica/types'`
- **@AuthToken** - `import { type AuthToken } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@AdminService** - `import { AdminService } from '@altamedica/shared/services/admin-service'`
- **@AuditService** - `import { AuditService } from '@altamedica/shared/services/audit.service'`

### B

#### @AltaMedica/Types
- **@BusinessHours** - `import { type BusinessHours } from '@altamedica/types'`
- **@BusinessHoursSchema** - `import { BusinessHoursSchema } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@BackupPolicies** - `import { BackupPolicies } from '@altamedica/shared/services/backup-policies'`
- **@BackupService** - `import { BackupService } from '@altamedica/shared/services/backup.service'`
- **@BAAService** - `import { BAAService } from '@altamedica/shared/services/baa.service'`
- **@BaseAPIClient** - `import { BaseAPIClient } from '@altamedica/shared'`
- **@BaseService** - `import { BaseService } from '@altamedica/shared/services'`
- **@buildQueryParams** - `import { buildQueryParams } from '@altamedica/shared'`

### C

#### @AltaMedica/Auth
- **@createAuthMiddleware** - `import { createAuthMiddleware } from '@altamedica/auth'`

#### @AltaMedica/Types
- **@Company** - `import { type Company } from '@altamedica/types'`
- **@CompanyAnalytics** - `import { type CompanyAnalytics } from '@altamedica/types'`
- **@CompanyDoctor** - `import { type CompanyDoctor } from '@altamedica/types'`
- **@CompanySchema** - `import { CompanySchema } from '@altamedica/types'`
- **@CompanySize** - `import { type CompanySize } from '@altamedica/types'`
- **@CompanyStatus** - `import { type CompanyStatus } from '@altamedica/types'`
- **@CompanyType** - `import { type CompanyType } from '@altamedica/types'`
- **@CreateMedicationSchema** - `import { CreateMedicationSchema } from '@altamedica/types'`

#### @AltaMedica/Shared  
- **@Constants** - `import { Constants } from '@altamedica/shared/constants'`

### D

#### @AltaMedica/Types
- **@DataSource** - `import { type DataSource } from '@altamedica/types'`
- **@DoctorStatus** - `import { type DoctorStatus } from '@altamedica/types'`
- **@DosageForm** - `import { type DosageForm } from '@altamedica/types'`

### E

#### @AltaMedica/Types
- **@EmploymentType** - `import { type EmploymentType } from '@altamedica/types'`
- **@ExperienceLevel** - `import { type ExperienceLevel } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@EncryptionService** - `import { EncryptionService } from '@altamedica/shared/services/encryption.service'`
- **@Environment** - `import { Environment } from '@altamedica/shared/config/environment'`

### F

#### @AltaMedica/Shared
- **@FirebaseAdapter** - `import { FirebaseAdapter } from '@altamedica/shared/adapters/firebase'`

### G

#### @AltaMedica/Auth
- **@getAuthService** - `import { getAuthService } from '@altamedica/auth'`

### H

#### @AltaMedica/Types
- **@Hospital** - `import { type Hospital } from '@altamedica/types'`

### I

#### @AltaMedica/Types
- **@isAdminRole** - `import { isAdminRole } from '@altamedica/types'`
- **@isBusinessRole** - `import { isBusinessRole } from '@altamedica/types'`
- **@isClinicalRole** - `import { isClinicalRole } from '@altamedica/types'`
- **@isCompanyRole** - `import { isCompanyRole } from '@altamedica/types'`
- **@isDoctorRole** - `import { isDoctorRole } from '@altamedica/types'`
- **@isPatientRole** - `import { isPatientRole } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@InvoiceGenerationService** - `import { InvoiceGenerationService } from '@altamedica/shared/services/invoice-generation.service'`

### J

#### @AltaMedica/Types
- **@JobApplication** - `import { type JobApplication } from '@altamedica/types'`
- **@JobFilters** - `import { type JobFilters } from '@altamedica/types'`
- **@JobOffer** - `import { type JobOffer } from '@altamedica/types'`
- **@JobOfferSchema** - `import { JobOfferSchema } from '@altamedica/types'`
- **@JobStatus** - `import { type JobStatus } from '@altamedica/types'`
- **@JobType** - `import { type JobType } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@JWTService** - `import { JWTService } from '@altamedica/shared/services/jwt-service'`

### L

#### @AltaMedica/Auth
- **@LEGACY_AUTH_COOKIES** - `import { LEGACY_AUTH_COOKIES } from '@altamedica/auth'`
- **@LoginCredentials** - `import { type LoginCredentials } from '@altamedica/auth'`

#### @AltaMedica/Types
- **@LabResult** - `import { type LabResult } from '@altamedica/types'`
- **@Location** - `import { type Location } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@LoggerService** - `import { LoggerService } from '@altamedica/shared'`

### M

#### @AltaMedica/Types
- **@MarketplaceDoctor** - `import { type MarketplaceDoctor } from '@altamedica/types'`
- **@MarketplaceJobOffer** - `import { type MarketplaceJobOffer } from '@altamedica/types'`
- **@MedicalHistory** - `import { type MedicalHistory } from '@altamedica/types'`
- **@Medication** - `import { type Medication } from '@altamedica/types'`
- **@MedicationCategory** - `import { type MedicationCategory } from '@altamedica/types'`
- **@MedicationSchema** - `import { MedicationSchema } from '@altamedica/types'`
- **@MonitoringValidationResult** - `import { type MonitoringValidationResult } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@MedicationCatalogService** - `import { MedicationCatalogService } from '@altamedica/shared/services/medication-catalog.service'`
- **@MercadoPagoService** - `import { MercadoPagoService } from '@altamedica/shared/services/mercadopago.service'`
- **@MFAService** - `import { MFAService } from '@altamedica/shared/services/mfa.service'`

### N

#### @AltaMedica/Types
- **@normalizeUser** - `import { normalizeUser } from '@altamedica/types'`
- **@normalizeUserRole** - `import { normalizeUserRole } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@NotificationService** - `import { NotificationService } from '@altamedica/shared/services/notification-service'`

### P

#### @AltaMedica/Auth
- **@ProtectedRoute** - `import { ProtectedRoute } from '@altamedica/auth'`
- **@PublicRoute** - `import { PublicRoute } from '@altamedica/auth'`
- **@PublicUserRole** - `import { PublicUserRole } from '@altamedica/auth'`

#### @AltaMedica/Types
- **@Patient** - `import { type Patient } from '@altamedica/types'`
- **@PatientProfile** - `import { type PatientProfile } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@PatientDataAggregatorService** - `import { PatientDataAggregatorService } from '@altamedica/shared/services/patient-data-aggregator.service'`
- **@PatientDataExportService** - `import { PatientDataExportService } from '@altamedica/shared/services/patient-data-export.service'`
- **@PatientDataPDFService** - `import { PatientDataPDFService } from '@altamedica/shared/services/patient-data-pdf.service'`
- **@PaymentGatewayService** - `import { PaymentGatewayService } from '@altamedica/shared/services/payment-gateway.service'`
- **@PaymentService** - `import { PaymentService } from '@altamedica/shared/services/payment-service'`

### R

#### @AltaMedica/Auth
- **@RegisterData** - `import { type RegisterData } from '@altamedica/auth'`
- **@RouteGuard** - `import { RouteGuard } from '@altamedica/auth'`

#### @AltaMedica/Types
- **@Roles** - `import { Roles } from '@altamedica/types'`

### S

#### @AltaMedica/Types
- **@SaturationLevel** - `import { type SaturationLevel } from '@altamedica/types'`
- **@SSOLoginRequest** - `import { type SSOLoginRequest } from '@altamedica/types'`
- **@SSOLoginResponse** - `import { type SSOLoginResponse } from '@altamedica/types'`

#### @AltaMedica/Shared
- **@SharedUtils** - `import { SharedUtils } from '@altamedica/shared/utils'`

### T

#### @AltaMedica/Types
- **@TYPES_VERSION** - `import { TYPES_VERSION } from '@altamedica/types'`
- **@TYPES_COMPATIBILITY** - `import { TYPES_COMPATIBILITY } from '@altamedica/types'`

### U

#### @AltaMedica/Auth
- **@User** - `import { type User } from '@altamedica/auth'`
- **@UserRole** - `import { UserRole } from '@altamedica/auth'`
- **@useAuth** - `import { useAuth } from '@altamedica/auth'`
- **@useProtectedRoute** - `import { useProtectedRoute } from '@altamedica/auth'`
- **@useRequireAuth** - `import { useRequireAuth } from '@altamedica/auth'`
- **@useRole** - `import { useRole } from '@altamedica/auth'`

#### @AltaMedica/Types
- **@UpdateCompanyData** - `import { type UpdateCompanyData } from '@altamedica/types'`
- **@UpdateMedicationSchema** - `import { UpdateMedicationSchema } from '@altamedica/types'`
- **@UserWithName** - `import { type UserWithName } from '@altamedica/types'`
- **@userToNameFormat** - `import { userToNameFormat } from '@altamedica/types'`

### V

#### @AltaMedica/Types
- **@VitalSigns** - `import { type VitalSigns } from '@altamedica/types'`

---

## 🔍 Búsqueda Rápida por Funcionalidad

### 🔐 Autenticación y Autorización
```typescript
// @Components y @Providers
import { AuthProvider, AuthGuard, ProtectedRoute } from '@altamedica/auth';

// @Hooks
import { useAuth, useProtectedRoute, useRole } from '@altamedica/auth';

// @Services  
import { AuthService, JWTService, MFAService } from '@altamedica/auth | @altamedica/shared';

// @Middleware
import { authGuard, createAuthMiddleware } from '@altamedica/auth';

// @Types
import { type AuthState, type AuthToken, type UserRole } from '@altamedica/auth | @altamedica/types';
```

### 🏥 Dominio Médico
```typescript
// @Pacientes
import { type Patient, type PatientProfile, type MedicalHistory } from '@altamedica/types';

// @Citas y @Vitales
import { type Appointment, type VitalSigns } from '@altamedica/types';

// @Laboratorio
import { type LabResult } from '@altamedica/types';

// @Medicamentos
import { type Medication, MedicationSchema, MedicationCatalogService } from '@altamedica/types | @altamedica/shared';

// @Servicios de Datos
import { PatientDataExportService, PatientDataAggregatorService } from '@altamedica/shared';
```

### 🏢 Empresas y Trabajos
```typescript
// @Empresas
import { type Company, CompanySchema, type CompanyAnalytics } from '@altamedica/types';

// @Ofertas Laborales
import { type JobOffer, JobOfferSchema, type JobApplication } from '@altamedica/types';

// @Marketplace
import { type MarketplaceDoctor, type MarketplaceJobOffer } from '@altamedica/types';
```

### 💳 Pagos y Facturación
```typescript
// @Servicios de Pago
import { PaymentService, PaymentGatewayService, MercadoPagoService } from '@altamedica/shared';

// @Facturación
import { InvoiceGenerationService } from '@altamedica/shared';
```

### 🔒 Seguridad y Compliance @HIPAA
```typescript
// @Encriptación
import { EncryptionService } from '@altamedica/shared';

// @Auditoría
import { AuditService } from '@altamedica/shared';

// @BAA Compliance
import { BAAService } from '@altamedica/shared';

// @Logging Seguro
import { LoggerService } from '@altamedica/shared';
```

### 📤 Exportación de Datos (@HIPAA)
```typescript
// @Servicios de Exportación
import { PatientDataExportService, PatientDataPDFService } from '@altamedica/shared';

// @Sistema Modular
import { /* collectors, generators, strategies */ } from '@altamedica/shared/services/patient-export/...';
```

### 🔧 Utilidades del Sistema
```typescript
// @API Clients
import { BaseAPIClient, buildQueryParams } from '@altamedica/shared';

// @Notificaciones
import { NotificationService } from '@altamedica/shared';

// @Administración
import { AdminService } from '@altamedica/shared';

// @Respaldo
import { BackupService, BackupPolicies } from '@altamedica/shared';
```

## 🎯 Shortcuts por Package

### @altamedica/auth → 🔐
- Autenticación, autorización, @middleware, @componentes de protección

### @altamedica/types → 📋  
- Todos los tipos @TypeScript, @schemas @Zod, @enums, utilidades de validación

### @altamedica/shared → 🔧
- Servicios compartidos, @APIs, @utilidades, @logging, @seguridad @HIPAA

## 💡 Tips de Uso

1. **🔍 Búsqueda alfabética**: Usa Ctrl+F en este documento
2. **📦 Import directo**: Copia el import exacto desde aquí
3. **🎯 Por funcionalidad**: Usa las secciones temáticas
4. **📝 Documentación detallada**: Ve a `/GLOSARIO.md` específico de cada @package

## 🚨 Errores Frecuentes y Playbooks

### 🔍 **Índice de Solución Rápida**
- [Edge Runtime](#edge-runtime-node-apis-no-permitidas)
- [Fuentes Locales](#google-fonts-en-build)
- [ESLint Plugins](#eslint-plugin-faltante)
- [Deep Imports](#deep-imports-fuera-de-altamedica)
- [LoggerService Arguments](#loggerservice-argumentos-incorrectos)
- [UserRole Enums](#userole-enums-incorrectos)
- [Missing Exports](#missing-exports)

### <a id="error-edge-runtime-node-apis"></a>🔥 Edge Runtime: Node APIs no permitidas

**❌ Error típico:**
```
Error: The edge runtime does not support Node.js APIs
```

**🔧 Soluciones:**

#### 1. Marcar ruta como Server-only
```typescript
// pages/api/heavy-processing.ts
export const runtime = 'nodejs'; // Force Node.js runtime
import Redis from 'ioredis'; // Ahora permitido ✅
```

#### 2. Lazy import condicional
```typescript
// Solo importar en servidor
if (typeof window === 'undefined') {
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256');
}
```

#### 3. Usar servicios @Edge-safe
```typescript
// ❌ PROBLEMA: ioredis en Edge
import Redis from 'ioredis'; 

// ✅ SOLUCIÓN: Usar BaseAPIClient (Edge-safe)
import { BaseAPIClient } from '@altamedica/shared';
```

### <a id="error-font-loading"></a>🔤 Google Fonts en build

**❌ Error típico:**
```
Error: Failed to download font from Google Fonts
```

**🔧 Solución con estructura de archivos:**
```
src/
  assets/
    fonts/
      Inter-Variable.woff2
      Inter-Regular.woff2
      Inter-Bold.woff2
```

```typescript
// ❌ PROBLEMA: Google Fonts requiere red
import { Inter } from 'next/font/google';

// ✅ SOLUCIÓN: Usar fuentes locales
import localFont from 'next/font/local';

const inter = localFont({
  src: [
    {
      path: './assets/fonts/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './assets/fonts/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
  display: 'swap',
});

// En CSS/Tailwind
// font-family: var(--font-inter);
```

### 🔧 ESLint plugin faltante

**❌ Error típico:**
```
Error: Plugin "@altamedica/eslint-config" was not found
```

**<a id="eslint-flat-config"></a>🔧 Solución Flat Config del Monorepo:**
```javascript
// eslint.config.js - Configuración real del monorepo
import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import': importPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/order': 'error',
    },
  },
  {
    // Overrides para archivos especiales
    files: ['**/*.mjs', '**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Ignorar archivos de definición
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // Exclusión de tests en hooks
    files: ['packages/hooks/**/*.test.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
```

### 🏷️ Runtime vs Import Mismatch

**❌ Error típico:**
```
Warning: Component uses Node API in client bundle
```

**🔧 Identificación rápida:**
```typescript
// ❌ Server-only usado en cliente
import { EncryptionService } from '@altamedica/shared'; // Server-only ❌

// ✅ Edge-safe para cliente
import { LoggerService } from '@altamedica/shared'; // Edge-safe ✅
```

**📍 Dónde colocar `export const runtime`:**
```typescript
// app/api/heavy/route.ts
export const runtime = 'nodejs'; // Para App Router

// pages/api/process.ts  
export const config = {
  runtime: 'nodejs', // Para Pages Router
};
```

### <a id="error-loggerservice-requires-data"></a>📝 LoggerService: Argumentos Incorrectos

**❌ Error TypeScript:**
```
error TS2554: Expected 2 arguments, but got 1.
```

**🔧 Solución:**
```typescript
// ❌ INCORRECTO - Solo mensaje
LoggerService.info('Usuario autenticado');

// ✅ CORRECTO - Mensaje + data object
LoggerService.info('Usuario autenticado', { userId: user.id });
LoggerService.error('Error en login', { error: err.message });
```

### <a id="error-userrole-enum"></a>🔐 UserRole Enums Incorrectos

**❌ Error TypeScript:**
```
error TS2820: Type '"ADMIN"' is not assignable to type 'UserRole'. 
Did you mean 'UserRole.ADMIN'?
```

**🔧 Solución:**
```typescript
// ❌ INCORRECTO - String literal
const role: UserRole = 'ADMIN';

// ✅ CORRECTO - Enum value
import { UserRole } from '@altamedica/types';
const role: UserRole = UserRole.ADMIN;

// También disponible
UserRole.DOCTOR
UserRole.PATIENT  
UserRole.STAFF
```

### <a id="error-middleware-renamed"></a>🚫 Missing Exports

**❌ Error TypeScript:**
```
error TS2724: has no exported member named 'createSSOMiddleware'
```

**🔧 Solución:**
```typescript
// ❌ INCORRECTO - Export que no existe
import { createSSOMiddleware } from '@altamedica/auth/middleware';

// ✅ CORRECTO - Export real disponible
import { createAuthMiddleware } from '@altamedica/auth';

// Verificar exports disponibles en GLOSARIO del package
```

### <a id="error-deep-imports"></a>🔗 Deep Imports Fuera de @AltaMedica

**❌ Error típico:**
```
Cannot find module '@altamedica/shared/config/environment'
```

**🔧 Solución:**
```typescript
// ❌ PROBLEMA: Deep import no exportado
import { Environment } from '@altamedica/shared/config/environment';

// ✅ SOLUCIÓN: Import desde index oficial
import { LoggerService } from '@altamedica/shared';
// O verificar si el módulo está exportado en el package
```

## <a id="runtime-compatibility-matrix"></a>🏷️ Matriz de Compatibilidad Global

### @altamedica/auth
| Export | Edge | Node | Client | Estabilidad |
|--------|------|------|---------|-------------|
| `useAuth` | ✅ | ✅ | ✅ | 📊 Stable |
| `AuthProvider` | ✅ | ✅ | ✅ | 📊 Stable |
| `authGuard` | ❌ | ✅ | ❌ | 📊 Stable |
| `AuthService` | ❌ | ✅ | ❌ | 📊 Stable |

### @altamedica/types  
| Export | Edge | Node | Client | Estabilidad |
|--------|------|------|---------|-------------|
| `User` | ✅ | ✅ | ✅ | 📊 Stable |
| `UserRole` | ✅ | ✅ | ✅ | 📊 Stable |
| `Company` | ✅ | ✅ | ✅ | 📊 Stable |
| `Medication` | ✅ | ✅ | ✅ | 🧪 Experimental |

### @altamedica/shared
| Export | Edge | Node | Client | Estabilidad |
|--------|------|------|---------|-------------|
| `LoggerService` | ✅ | ✅ | ✅ | 📊 Stable |
| `BaseAPIClient` | ✅ | ✅ | ✅ | 📊 Stable |
| `EncryptionService` | ❌ | ✅ | ❌ | 📊 Stable |
| `PaymentService` | ❌ | ✅ | ❌ | 📊 Stable |

## <a id="hipaa-validation"></a>🔒 HIPAA Data Validation

Para datos médicos sensibles, SIEMPRE:
```typescript
import { PatientSchema, MedicalRecordSchema } from '@altamedica/types';

// ✅ Validar antes de persistir
const validateAndSave = async (data: unknown) => {
  const validatedPatient = PatientSchema.parse(data);
  await saveToDatabase(validatedPatient);
};

// ✅ Sanitizar para logs
const logPatientAccess = (patient: Patient) => {
  const sanitized = {
    id: patient.id,
    // NO incluir: SSN, dateOfBirth, medicalHistory
  };
  LoggerService.info('Patient accessed', sanitized);
};
```

## <a id="package-structure"></a>📦 Estructura Estándar de Packages

```
packages/[package-name]/
├── src/
│   ├── index.ts              # Export principal
│   ├── components/           # Componentes React
│   ├── hooks/               # React Hooks
│   ├── services/            # Lógica de negocio
│   ├── utils/               # Utilidades
│   ├── types/               # Tipos específicos
│   └── constants/           # Constantes
├── dist/                    # Build output (generado)
├── package.json             # Config estándar
├── tsconfig.json           # TypeScript config
└── README.md               # Documentación
```

## <a id="badges-legend"></a>🏷️ Leyenda de Badges

### Runtime
- 🏷️ **Edge-safe** - Compatible con Edge Runtime
- 🔒 **Server-only** - Solo Node.js server
- 💻 **Client-only** - Solo browser

### Estabilidad
- 📊 **Stable** - API estable
- 🔄 **Beta** - Puede cambiar
- 🚧 **Experimental** - Cambios frecuentes
- ⚠️ **Deprecated** - Obsoleto

### Tipo
- 📝 **Type** - TypeScript type
- 📦 **Enum/Constants** - Enumeración o constantes
- ⚛️ **React** - Componente React
- 🪝 **Hook** - React Hook
- 🔧 **Service** - Clase de servicio
- 🛡️ **Middleware** - Función middleware

## <a id="api-stability"></a>📊 Estabilidad de APIs por Package

### @altamedica/auth
- Core exports: **Stable** ✅
- MFA utilities: **Experimental** 🚧

### @altamedica/types
- Medical types: **Stable** ✅
- AI types: **Experimental** 🚧

### @altamedica/shared
- Services: **Stable** ✅
- Patient export: **Beta** 🔄

## ⚡ Reglas de Oro @AltaMedica

### <a id="import-patterns"></a>✅ DO (Patrones Recomendados)
```typescript
// ✅ Usar LoggerService en lugar de console
import { LoggerService } from '@altamedica/shared';

// ✅ Imports oficiales desde @altamedica
import { User, UserRole } from '@altamedica/types';

// ✅ Edge-safe para middleware y API routes
import { BaseAPIClient } from '@altamedica/shared';

// ✅ Especificar runtime cuando sea necesario
export const runtime = 'nodejs';
```

### ❌ DON'T (Antipatrones)
```typescript
// ❌ No usar console en producción
console.log('Debug info');

// ❌ No hacer deep imports
import { utils } from '@altamedica/shared/src/utils';

// ❌ No usar Node APIs en Edge sin runtime
import crypto from 'crypto'; // Sin export const runtime = 'nodejs'

// ❌ No importar Server-only en cliente
import { EncryptionService } from '@altamedica/shared'; // En component ❌
```

## 🔍 Quick Reference por Caso de Uso

### 🔐 Autenticación
```typescript
// Client-side auth
import { useAuth, AuthProvider } from '@altamedica/auth'; // Edge-safe ✅

// Server-side auth  
export const runtime = 'nodejs';
import { AuthService } from '@altamedica/auth'; // Server-only
```

### 📊 Logging
```typescript
// ✅ Structured logging (Edge-safe)
import { LoggerService } from '@altamedica/shared';
LoggerService.info('User logged in', { userId });

// ❌ Console (antipatrón)
console.log('User logged in');
```

### 🏥 Datos Médicos
```typescript
// Types (Universal)
import { Patient, Medication, type VitalSigns } from '@altamedica/types';

// Data services (Server-only)
export const runtime = 'nodejs';
import { PatientDataExportService } from '@altamedica/shared';
```

### 💳 Pagos
```typescript
// Server-only
export const runtime = 'nodejs';
import { PaymentService, EncryptionService } from '@altamedica/shared';
```

## 🛡️ CI Checks y Validaciones

### 🔍 Detectar Node APIs en Client/Edge

**ESLint Rule para prevenir Node APIs:**
```javascript
// .eslintrc.js o eslint.config.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['node:*', 'fs', 'path', 'crypto', 'stream'],
          message: 'Node APIs no permitidas en client/edge. Usa runtime="nodejs" o servicios Edge-safe.'
        }
      ]
    }]
  }
}
```

**<a id="github-actions-job"></a>GitHub Actions Job actualizado con script real:**
```yaml
# .github/workflows/validate-exports.yml
name: Validate Exports and Glosario

on: [push, pull_request]

jobs:
  check-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
          
      - name: Validate Package Exports
        run: node scripts/validate-package-exports.mjs
          
      - name: Check Node APIs in client
        run: |
          npx eslint 'apps/*/src/**/*.{ts,tsx}' \
            --rule 'no-restricted-imports: error'
            
      - name: Upload validation report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: validation-report
          path: validation-report.json
```

## <a id="script-validacion"></a>✅ Script de Validación IMPLEMENTADO

**Ubicación**: `scripts/validate-package-exports.mjs`

**Características**:
- 🔍 Compara glosarios vs exports reales automáticamente
- 📊 Genera reportes JSON detallados
- ❌ Detecta exports faltantes o incorrectos
- ⚠️ Identifica exports no documentados
- 🎯 Exit code apropiado para CI/CD
- 🌈 Output con colores para mejor legibilidad

**Uso**:
```bash
# Ejecutar validación manual
node scripts/validate-package-exports.mjs

# Ver reporte generado
cat validation-report.json

# Última validación exitosa: 2025-08-29
# ✅ 3/3 paquetes válidos
# 📚 169 exports documentados
# 🔧 69 exports reales (diferencia esperada por star exports)
```

---

## 🚀 Comandos Útiles de Desarrollo

```bash
# Validar todos los exports
node scripts/validate-package-exports.mjs

# Buscar errores específicos de TypeScript
npx tsc --noEmit 2>&1 | grep "TS2554"  # LoggerService errors
npx tsc --noEmit 2>&1 | grep "TS2820"  # UserRole enum errors
npx tsc --noEmit 2>&1 | grep "TS2724"  # Export not found

# Auditar uso incorrecto de console
rg "console\.(log|warn|error)" --type ts --type tsx

# Detectar imports profundos incorrectos
rg "@altamedica/\w+/src/" --type ts --type tsx

# Verificar compatibilidad Edge Runtime
rg "import.*'(fs|path|crypto|stream)'" apps/*/src/app/api
```



## 📊 Estadísticas de Sincronización (2025-08-29T09:17:28.583Z)

- **Total exports analizados**: 83
- **Nuevos exports documentados**: 36
- **Packages actualizados**: auth, types, hooks
- **Estado**: 🔄 Glosarios actualizados
