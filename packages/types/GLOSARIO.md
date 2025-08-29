# @AltaMedica/Types - Glosario Alfabético

## 🏷️ Leyenda de Marcadores

### Estabilidad
- 📊 **Stable** - Tipo estable, no cambiará
- 🔄 **Beta** - Puede cambiar en versiones menores
- 🚧 **Experimental** - Cambios frecuentes esperados
- ⚠️ **Deprecated** - Obsoleto, migrar a alternativa

### Uso Recomendado
- ✅ **Recommended** - Usar este tipo/schema siempre
- 🔧 **Refactor Planned** - Funcionará pero será refactorizado
- ⚡ **Performance** - Optimizado para alto rendimiento
- 🔒 **HIPAA** - Contiene datos médicos sensibles

## 📚 Referencia Rápida de Tipos y Schemas

### A
- **@Address** - `import { type Address } from '@altamedica/types'`
  - 🏿️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Tipo para direcciones postales
  - Ruta: `src/company/index.ts`

- **@AddressSchema** - `import { AddressSchema } from '@altamedica/types'`
  - 🏿️ **Edge-safe** | 📊 **Stable** | ✅ **Schema**
  - Schema de validación Zod para direcciones
  - Ruta: `src/company/index.ts`

- **@ApplicationStatus** - `import { type ApplicationStatus } from '@altamedica/types'`
  - Estados de aplicaciones de trabajo
  - Ruta: `src/company/index.ts`

- **@Appointment** - `import { type Appointment } from '@altamedica/types'`
  - 🏿️ **Edge-safe** | 📊 **Stable** | 🔒 **HIPAA** | 📝 **Type**
  - Tipo para citas @médicas
  - Ruta: `src/medical/clinical/appointment.types.ts`

- **@AuthContext** - `import { type AuthContext } from '@altamedica/types'`
  - Contexto de @autenticación
  - Ruta: `src/auth/auth-token.ts`

- **@AuthResult** - `import { type AuthResult } from '@altamedica/types'`
  - Resultado de operaciones de @autenticación
  - Ruta: `src/auth/auth-token.ts`

- **@AuthToken** - `import { type AuthToken } from '@altamedica/types'`
  - 🏿️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Token de @autenticación JWT
  - Ruta: `src/auth/auth-token.ts`

### B
- **@BusinessHours** - `import { type BusinessHours } from '@altamedica/types'`
  - Horarios comerciales de @empresas
  - Ruta: `src/company/index.ts`

- **@BusinessHoursSchema** - `import { BusinessHoursSchema } from '@altamedica/types'`
  - Schema para horarios comerciales
  - Ruta: `src/company/index.ts`

### C
- **@Company** - `import { type Company } from '@altamedica/types'`
  - 🏿️ **Edge-safe** | 📊 **Stable** | 📝 **Type**
  - Tipo principal de @empresa médica
  - Ruta: `src/company/index.ts`

- **@CompanyAnalytics** - `import { type CompanyAnalytics } from '@altamedica/types'`
  - Métricas y análisis de @empresas
  - Ruta: `src/company/index.ts`

- **@CompanyDoctor** - `import { type CompanyDoctor } from '@altamedica/types'`
  - Relación @doctor-@empresa
  - Ruta: `src/company/index.ts`

- **@CompanyFilters** - `import { type CompanyFilters } from '@altamedica/types'`
  - Filtros de búsqueda para @empresas
  - Ruta: `src/company/index.ts`

- **@CompanyFormData** - `import { type CompanyFormData } from '@altamedica/types'`
  - Datos de formulario de @empresa
  - Ruta: `src/company/index.ts`

- **@CompanySchema** - `import { CompanySchema } from '@altamedica/types'`
  - Schema de validación para @empresas
  - Ruta: `src/company/index.ts`

- **@CompanySize** - `import { type CompanySize } from '@altamedica/types'`
  - Tamaños de @empresa (startup, small, medium, large)
  - Ruta: `src/company/index.ts`

- **@CompanyStatus** - `import { type CompanyStatus } from '@altamedica/types'`
  - Estados de @empresa (active, pending, suspended)
  - Ruta: `src/company/index.ts`

- **@CompanyType** - `import { type CompanyType } from '@altamedica/types'`
  - Tipos de @empresa médica
  - Ruta: `src/company/index.ts`

- **@ContactInfo** - `import { type ContactInfo } from '@altamedica/types'`
  - Información de contacto
  - Ruta: `src/company/index.ts`

- **@ContactInfoSchema** - `import { ContactInfoSchema } from '@altamedica/types'`
  - Schema para información de contacto
  - Ruta: `src/company/index.ts`

- **@CreateCompanyData** - `import { type CreateCompanyData } from '@altamedica/types'`
  - Datos para crear @empresa nueva
  - Ruta: `src/company/index.ts`

- **@CreateJobOfferData** - `import { type CreateJobOfferData } from '@altamedica/types'`
  - Datos para crear oferta laboral
  - Ruta: `src/company/index.ts`

- **@CreateMedicationSchema** - `import { CreateMedicationSchema } from '@altamedica/types'`
  - Schema para crear @medicamentos
  - Ruta: `src/medical/medication.types.ts`

### D
- **@DataSource** - `import { type DataSource } from '@altamedica/types'`
  - Fuente de datos para @monitoreo
  - Ruta: `src/monitoring.types.ts`

- **@DoctorStatus** - `import { type DoctorStatus } from '@altamedica/types'`
  - 🏿️ **Edge-safe** | 📊 **Stable** | 📶 **Enum**
  - Estados de @doctores en @empresas
  - Ruta: `src/company/index.ts`

- **@DosageForm** - `import { type DosageForm } from '@altamedica/types'`
  - Formas de dosificación de @medicamentos
  - Ruta: `src/medical/medication.types.ts`

### E
- **@EmploymentType** - `import { type EmploymentType } from '@altamedica/types'`
  - Tipos de empleo (full-time, part-time, contract)
  - Ruta: `src/company/index.ts`

- **@ExperienceLevel** - `import { type ExperienceLevel } from '@altamedica/types'`
  - Niveles de experiencia profesional
  - Ruta: `src/company/index.ts`

### H
- **@Hospital** - `import { type Hospital } from '@altamedica/types'`
  - Tipo básico de @hospital
  - Ruta: `src/index.ts`

### I
- **@isAdminRole** - `import { isAdminRole } from '@altamedica/types'`
  - Función para verificar @rol de administrador
  - Ruta: `src/auth/roles.ts`

- **@isBusinessRole** - `import { isBusinessRole } from '@altamedica/types'`
  - Función para verificar @rol de negocio
  - Ruta: `src/auth/roles.ts`

- **@isClinicalRole** - `import { isClinicalRole } from '@altamedica/types'`
  - Función para verificar @rol clínico
  - Ruta: `src/auth/roles.ts`

- **@isCompanyRole** - `import { isCompanyRole } from '@altamedica/types'`
  - Función para verificar @rol de @empresa
  - Ruta: `src/auth/roles.ts`

- **@isDoctorRole** - `import { isDoctorRole } from '@altamedica/types'`
  - Función para verificar @rol de @doctor
  - Ruta: `src/auth/roles.ts`

- **@isPatientRole** - `import { isPatientRole } from '@altamedica/types'`
  - Función para verificar @rol de @paciente
  - Ruta: `src/auth/roles.ts`

### J
- **@JobApplication** - `import { type JobApplication } from '@altamedica/types'`
  - Aplicación a oferta laboral
  - Ruta: `src/company/index.ts`

- **@JobFilters** - `import { type JobFilters } from '@altamedica/types'`
  - Filtros de búsqueda para trabajos
  - Ruta: `src/company/index.ts`

- **@JobOffer** - `import { type JobOffer } from '@altamedica/types'`
  - Oferta laboral médica
  - Ruta: `src/company/index.ts`

- **@JobOfferFormData** - `import { type JobOfferFormData } from '@altamedica/types'`
  - Datos de formulario para ofertas
  - Ruta: `src/company/index.ts`

- **@JobOfferSchema** - `import { JobOfferSchema } from '@altamedica/types'`
  - Schema de validación para ofertas
  - Ruta: `src/company/index.ts`

- **@JobStatus** - `import { type JobStatus } from '@altamedica/types'`
  - Estados de ofertas laborales
  - Ruta: `src/company/index.ts`

- **@JobType** - `import { type JobType } from '@altamedica/types'`
  - Tipos de trabajo médico
  - Ruta: `src/company/index.ts`

### L
- **@LabResult** - `import { type LabResult } from '@altamedica/types'`
  - Resultados de laboratorio @médico
  - Ruta: `src/medical/clinical/lab-result.types.ts`

- **@Location** - `import { type Location } from '@altamedica/types'`
  - Ubicación geográfica
  - Ruta: `src/common/index.ts`

### M
- **@MarketplaceCompanyType** - `import { type MarketplaceCompanyType } from '@altamedica/types'`
  - Tipos de @empresa en @marketplace
  - Ruta: `src/marketplace/index.ts`

- **@MarketplaceDoctor** - `import { type MarketplaceDoctor } from '@altamedica/types'`
  - @Doctor en @marketplace
  - Ruta: `src/marketplace/index.ts`

- **@MarketplaceDoctorService** - `import { type MarketplaceDoctorService } from '@altamedica/types'`
  - Servicios de @doctor en @marketplace
  - Ruta: `src/marketplace/index.ts`

- **@MarketplaceDoctorVerificationStatus** - `import { type MarketplaceDoctorVerificationStatus } from '@altamedica/types'`
  - Estado de verificación en @marketplace
  - Ruta: `src/marketplace/index.ts`

- **@MarketplaceJobOffer** - `import { type MarketplaceJobOffer } from '@altamedica/types'`
  - Oferta laboral en @marketplace
  - Ruta: `src/marketplace/index.ts`

- **@MarketplaceWorkArrangement** - `import { type MarketplaceWorkArrangement } from '@altamedica/types'`
  - Arreglos de trabajo en @marketplace
  - Ruta: `src/marketplace/index.ts`

- **@MedicalHistory** - `import { type MedicalHistory } from '@altamedica/types'`
  - 🏿️ **Edge-safe** | 📊 **Stable** | 🔒 **HIPAA** | 📝 **Type**
  - Historia clínica del @paciente
  - Ruta: `src/medical/clinical/medical-history.types.ts`

- **@Medication** - `import { type Medication } from '@altamedica/types'`
  - @Medicamento con ID obligatorio
  - Ruta: `src/medical/medication.types.ts`

- **@MedicationCategory** - `import { type MedicationCategory } from '@altamedica/types'`
  - Categorías de @medicamentos
  - Ruta: `src/medical/medication.types.ts`

- **@MedicationProfile** - `import { type MedicationProfile } from '@altamedica/types'`
  - Perfil completo de @medicamento
  - Ruta: `src/medical/medication.types.ts`

- **@MedicationSchema** - `import { MedicationSchema } from '@altamedica/types'`
  - Schema base de @medicamentos
  - Ruta: `src/medical/medication.types.ts`

- **@MedicationSearch** - `import { type MedicationSearch } from '@altamedica/types'`
  - Parámetros de búsqueda de @medicamentos
  - Ruta: `src/medical/medication.types.ts`

- **@MedicationSearchSchema** - `import { MedicationSearchSchema } from '@altamedica/types'`
  - Schema para búsqueda de @medicamentos
  - Ruta: `src/medical/medication.types.ts`

- **@MonitoringValidationResult** - `import { type MonitoringValidationResult } from '@altamedica/types'`
  - Resultado de validación de @monitoreo
  - Ruta: `src/monitoring.types.ts`

### N
- **@normalizeUser** - `import { normalizeUser } from '@altamedica/types'`
  - Función para normalizar datos de @usuario
  - Ruta: `src/types/base.ts`

- **@normalizeUserRole** - `import { normalizeUserRole } from '@altamedica/types'`
  - Función para normalizar @roles de usuario
  - Ruta: `src/auth/roles.ts`

### P
- **@Patient** - `import { type Patient } from '@altamedica/types'`
  - 🏿️ **Edge-safe** | 📊 **Stable** | 🔒 **HIPAA** | 📝 **Type**
  - Alias para PatientProfile
  - Ruta: `src/medical/patient/patient.types.ts`

- **@PatientProfile** - `import { type PatientProfile } from '@altamedica/types'`
  - 🏿️ **Edge-safe** | 📊 **Stable** | 🔒 **HIPAA** | 📝 **Type**
  - Perfil completo de @paciente
  - Ruta: `src/medical/patient/patient.types.ts`

### R
- **@Roles** - `import { Roles } from '@altamedica/types'`
  - Enum de @roles del sistema
  - Ruta: `src/auth/roles.ts`

### S
- **@SaturationLevel** - `import { type SaturationLevel } from '@altamedica/types'`
  - Niveles de saturación en @monitoreo
  - Ruta: `src/monitoring.types.ts`

- **@SpecialtySchema** - `import { SpecialtySchema } from '@altamedica/types'`
  - Schema de especialidades @médicas (deprecated)
  - Ruta: `src/index.ts`

- **@SSOLoginRequest** - `import { type SSOLoginRequest } from '@altamedica/types'`
  - Request de @login SSO
  - Ruta: `src/auth/auth-token.ts`

- **@SSOLoginResponse** - `import { type SSOLoginResponse } from '@altamedica/types'`
  - Response de @login SSO
  - Ruta: `src/auth/auth-token.ts`

### T
- **@TYPES_VERSION** - `import { TYPES_VERSION } from '@altamedica/types'`
  - Versión actual del paquete de tipos
  - Ruta: `src/index.ts`

- **@TYPES_COMPATIBILITY** - `import { TYPES_COMPATIBILITY } from '@altamedica/types'`
  - Información de compatibilidad de versiones
  - Ruta: `src/index.ts`

### U
- **@UpdateCompanyData** - `import { type UpdateCompanyData } from '@altamedica/types'`
  - Datos para actualizar @empresa
  - Ruta: `src/company/index.ts`

- **@UpdateJobOfferData** - `import { type UpdateJobOfferData } from '@altamedica/types'`
  - Datos para actualizar oferta laboral
  - Ruta: `src/company/index.ts`

- **@UpdateMedicationSchema** - `import { UpdateMedicationSchema } from '@altamedica/types'`
  - Schema para actualizar @medicamentos
  - Ruta: `src/medical/medication.types.ts`

- **@User** - `import { type User } from '@altamedica/types'`
  - Tipo base de @usuario
  - Ruta: `src/types/base.ts`

- **@UserRole** - `import { UserRole } from '@altamedica/types'`
  - 🏷️ **Edge-safe** | 📊 **Stable** | ✅ **Recommended** | 📦 **Enum**
  - Enum de @roles de usuario (PATIENT, DOCTOR, ADMIN, COMPANY)
  - Ruta: `src/auth/roles.ts`

- **@UserRoleSchema** - `import { UserRoleSchema } from '@altamedica/types'`
  - Schema de @roles (deprecated)
  - Ruta: `src/index.ts`

- **@UserWithName** - `import { type UserWithName } from '@altamedica/types'`
  - @Usuario con nombre formateado
  - Ruta: `src/types/base.ts`

- **@userToNameFormat** - `import { userToNameFormat } from '@altamedica/types'`
  - Función para formatear nombre de @usuario
  - Ruta: `src/types/base.ts`

### V
- **@VitalSigns** - `import { type VitalSigns } from '@altamedica/types'`
  - Signos vitales @médicos
  - Ruta: `src/medical/clinical/appointment.types.ts`

## 🔗 Exports por Módulo con Marcadores de Estabilidad

### Módulos Core
```typescript
// 📊 Stable | ✅ Recommended
export * from './core';         // BaseEntity, Timestamps, Metadata

// 📊 Stable | ✅ Recommended  
export * from './auth';         // UserRole, AuthToken, LoginCredentials

// 📊 Stable | 🔒 HIPAA | ✅ Recommended
export * from './medical';      // Patient, Doctor, MedicalRecord

// 📊 Stable | ⚡ Performance
export * from './api';          // APIResponse, PaginatedResponse

// 📊 Stable | 🔒 HIPAA | ✅ Recommended
export * from './security';     // HIPAACompliance, EncryptionConfig
```

### Módulos de Negocio
```typescript
// 📊 Stable | ✅ Recommended
export * from './company';      // Company, JobOffer, CompanyAnalytics

// 🔄 Beta | 🔧 Refactor Planned
export * from './marketplace';  // MarketplaceListing, DoctorProfile

// 🔄 Beta | ✅ Recommended
export * from './b2c';         // B2CMessage, CommunicationChannel

// 🚧 Experimental | 🔧 Refactor Planned
export * from './ai';          // AIAgent, DiagnosticPrediction
```

### Módulos Especializados
```typescript
// 🔄 Beta | ⚡ Performance
export * from './signaling';    // SignalingMessage, ICECandidate

// 🔄 Beta | 🔒 HIPAA | ⚡ Performance
export * from './telemedicine'; // TelemedicineSession, QoSMetrics

// 📊 Stable | 🔒 HIPAA | ✅ Recommended
export * from './audit';        // AuditLog, ComplianceReport

// 📊 Stable | ✅ Recommended
export * from './billing';      // Invoice, Payment, InsuranceClaim

// 📊 Stable | 🔒 HIPAA | ✅ Recommended
export * from './baa';         // BusinessAssociateAgreement

// 📊 Stable | 🔒 HIPAA | ✅ Recommended
export * from './prescription'; // Prescription, Medication, Dosage
```

### 📋 Guía para Refactors

#### Prioridad Alta (Stable + HIPAA)
- ✅ Mantener sin cambios: `medical`, `audit`, `baa`, `prescription`
- ✅ Usar siempre schemas Zod para validación

#### Prioridad Media (Beta)
- 🔧 `marketplace` - Consolidar con `company` module
- 🔧 `telemedicine` - Optimizar tipos QoS

#### Prioridad Baja (Experimental)
- 🚧 `ai` - Esperar estabilización de APIs AI

## 🎯 Patrones de Import Recomendados

```typescript
// ✅ Imports específicos
import { type User, type UserRole, UserRole } from '@altamedica/types';
import { type Company, CompanySchema } from '@altamedica/types';
import { type Medication, MedicationSchema } from '@altamedica/types';

// ✅ Import de utilidades
import { normalizeUser, isAdminRole } from '@altamedica/types';

// ✅ Import de constantes
import { TYPES_VERSION } from '@altamedica/types';
```

## 🚨 ERRORES CRÍTICOS Y SOLUCIONES

### ⚠️ Error TS2820: UserRole debe usarse como enum, no string
```typescript
// ❌ INCORRECTO - No usar strings literales
const role = 'ADMIN';
if (user.role === 'DOCTOR') { }
const adminRole: UserRole = "ADMIN"; // Error TS2820

// ✅ CORRECTO - Siempre usar el enum UserRole
import { UserRole } from '@altamedica/types';
const role = UserRole.ADMIN;
if (user.role === UserRole.DOCTOR) { }
const adminRole: UserRole = UserRole.ADMIN;

// 📍 Archivos con este error frecuente:
// - Cualquier archivo que maneje roles de usuario
// - Middleware de autenticación
// - Guards de rutas
```

### ⚠️ Error: Importar tipos sin 'type' keyword
```typescript
// ⚠️ PROBLEMÁTICO - Puede aumentar bundle size
import { User, Company, Patient } from '@altamedica/types';

// ✅ MEJOR - Usar 'type' para imports de solo tipos
import { type User, type Company, type Patient } from '@altamedica/types';

// ✅ EXCEPCIÓN - Enums y Schemas SÍ se importan sin 'type'
import { UserRole, CompanySchema, PatientSchema } from '@altamedica/types';
```

### ⚠️ Error: Usar any en lugar de tipos específicos
```typescript
// ❌ INCORRECTO - Pérdida de type safety
const processData = (data: any) => { }
const userInfo: any = getUserData();

// ✅ CORRECTO - Usar tipos específicos
import { type User, type Patient } from '@altamedica/types';
const processData = (data: User | Patient) => { }
const userInfo: User = getUserData();
```

### ⚠️ Error: Schemas Zod mal utilizados
```typescript
// ❌ INCORRECTO - No validar datos externos
const user = apiResponse.data as User;

// ✅ CORRECTO - Validar con schemas Zod
import { UserSchema } from '@altamedica/types';
const validatedUser = UserSchema.parse(apiResponse.data);

// ✅ Con manejo de errores
try {
  const validatedUser = UserSchema.parse(apiResponse.data);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors);
  }
}
```

### ⚠️ Error: Tipos opcionales mal manejados
```typescript
// ❌ INCORRECTO - No verificar undefined/null
const userName = user.profile.firstName.toUpperCase();

// ✅ CORRECTO - Usar optional chaining y nullish coalescing
const userName = user?.profile?.firstName?.toUpperCase() ?? 'Unknown';
```

## 🏷️ COMPATIBILIDAD DE RUNTIME

### Tipos Pure TypeScript ✅ (Universal)
Todos los tipos e interfaces son compatibles con cualquier runtime:
- **Edge Runtime**: ✅ Compatible
- **Node.js**: ✅ Compatible  
- **Browser**: ✅ Compatible

### Schemas Zod 🔄 (Requiere Runtime)
Los schemas requieren la librería Zod en runtime:
```typescript
// ✅ Edge Runtime: Compatible (Zod es Edge-safe)
// ✅ Node.js: Compatible
// ✅ Browser: Compatible (aumenta bundle ~12KB gzipped)
```

### Enums TypeScript ⚡
Los enums se compilan a objetos JavaScript:
```typescript
// UserRole se convierte en:
const UserRole = {
  PATIENT: 'PATIENT',
  DOCTOR: 'DOCTOR',
  ADMIN: 'ADMIN',
  COMPANY: 'COMPANY'
};
```

## 📊 ESTABILIDAD DE APIs

### Tipos Core (Stable v1.0+)
- **@User** - 📊 **Stable**
- **@UserRole** - 📊 **Stable**
- **@Patient** - 📊 **Stable**
- **@Doctor** - 📊 **Stable**
- **@Company** - 📊 **Stable**
- **@Appointment** - 📊 **Stable**

### Tipos Beta (Pueden cambiar)
- **@TelemedicineQoSData** - 🔄 **Beta**
- **@SignalingMessage** - 🔄 **Beta**
- **@AIAgent** - 🔄 **Beta**

### Tipos Experimental
- **@PredictiveHealthData** - 🚧 **Experimental**
- **@QuantumEncryption** - 🚧 **Experimental**

## 🔒 VALIDACIÓN HIPAA

Para datos médicos sensibles, SIEMPRE validar:
```typescript
import { PatientSchema, MedicalRecordSchema } from '@altamedica/types';

// ✅ Validación antes de persistir
const validateAndSave = async (data: unknown) => {
  const validatedPatient = PatientSchema.parse(data);
  // Solo después de validar, guardar en DB
  await saveToDatabase(validatedPatient);
};

// ✅ Sanitización de datos para logs
const logPatientAccess = (patient: Patient) => {
  const sanitized = {
    id: patient.id,
    // NO incluir: SSN, dateOfBirth, medicalHistory
  };
  LoggerService.info('Patient accessed', sanitized);
};
```