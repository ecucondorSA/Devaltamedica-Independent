# @AltaMedica/Shared - Glosario Alfabético

## 📚 Referencia Rápida de Servicios y Utilidades Compartidas

### A
- **@AdminService** - `import { AdminService } from '@altamedica/shared/services/admin-service'`
  - Servicios de administración del sistema
  - 🏷️ **Server-only** | 📊 **Stable**
  - Ruta: `src/services/admin-service.ts`

- **@AuditService** - `import { AuditService } from '@altamedica/shared/services/audit.service'`
  - Servicios de @auditoría y logs
  - 🏷️ **Server-only** | 📊 **Stable**
  - Ruta: `src/services/audit.service.ts`

### B
- **@BackupPolicies** - `import { BackupPolicies } from '@altamedica/shared/services/backup-policies'`
  - Políticas de @respaldo de datos
  - 🏷️ **Server-only** | 📊 **Stable**
  - Ruta: `src/services/backup-policies.ts`

- **@BackupService** - `import { BackupService } from '@altamedica/shared/services/backup.service'`
  - Servicios de @respaldo automático
  - 🏷️ **Server-only** | 📊 **Stable**
  - Ruta: `src/services/backup.service.ts`

- **@BAAService** - `import { BAAService } from '@altamedica/shared/services/baa.service'`
  - Business Associate Agreement para @HIPAA
  - 🏷️ **Server-only** | 📊 **Stable**
  - Ruta: `src/services/baa.service.ts`

- **@BaseAPIClient** - `import { BaseAPIClient } from '@altamedica/shared'`
  - Cliente base para @APIs REST
  - 🏷️ **Edge-safe** | 📊 **Stable**
  - Ruta: `src/api-client.ts`

- **@BaseService** - `import { BaseService } from '@altamedica/shared/services'`
  - Clase base para servicios
  - 🏷️ **Universal** | 📊 **Stable**
  - Ruta: `src/services.ts`

- **@buildQueryParams** - `import { buildQueryParams } from '@altamedica/shared'`
  - Constructor de parámetros de consulta URL
  - 🏷️ **Edge-safe** | 📊 **Stable**
  - Ruta: `src/api-client.ts`

### C
- **@Constants** - `import { Constants } from '@altamedica/shared/constants'`
  - Constantes globales del sistema
  - Ruta: `src/constants.ts`

### E
- **@EncryptionService** - `import { EncryptionService } from '@altamedica/shared/services/encryption.service'`
  - Servicios de @encriptación @HIPAA
  - Ruta: `src/services/encryption.service.ts`

- **@Environment** - `import { Environment } from '@altamedica/shared/config/environment'`
  - Configuración de @entornos
  - Ruta: `src/config/environment.ts`

### F
- **@FirebaseAdapter** - `import { FirebaseAdapter } from '@altamedica/shared/adapters/firebase'`
  - Adaptador para @Firebase services
  - Ruta: `src/adapters/firebase.ts`

### I
- **@InvoiceGenerationService** - `import { InvoiceGenerationService } from '@altamedica/shared/services/invoice-generation.service'`
  - Generación de @facturas médicas
  - Ruta: `src/services/invoice-generation.service.ts`

### J
- **@JWTService** - `import { JWTService } from '@altamedica/shared/services/jwt-service'`
  - Servicios de @tokens JWT
  - Ruta: `src/services/jwt-service.ts`

### L
- **@LoggerService** - `import { LoggerService } from '@altamedica/shared'`
  - Servicios centralizados de @logging
  - 🏷️ **Edge-safe** | 📊 **Stable** | ⚡ **USAR EN LUGAR DE console**
  - Ruta: `src/services/logger.service.ts`
  
  ```typescript
  // ✅ CORRECTO - Usar LoggerService
  import { LoggerService } from '@altamedica/shared';
  LoggerService.info('Usuario autenticado', { userId });
  
  // ❌ INCORRECTO - No usar console
  console.log('Usuario autenticado', userId);
  ```

### M
- **@MedicationCatalogService** - `import { MedicationCatalogService } from '@altamedica/shared/services/medication-catalog.service'`
  - Catálogo de @medicamentos
  - Ruta: `src/services/medication-catalog.service.ts`

- **@MercadoPagoService** - `import { MercadoPagoService } from '@altamedica/shared/services/mercadopago.service'`
  - Integración con @MercadoPago
  - Ruta: `src/services/mercadopago.service.ts`

- **@MFAService** - `import { MFAService } from '@altamedica/shared/services/mfa.service'`
  - Multi-Factor Authentication
  - Ruta: `src/services/mfa.service.ts`

### N
- **@NotificationService** - `import { NotificationService } from '@altamedica/shared/services/notification-service'`
  - Servicios de @notificaciones push
  - Ruta: `src/services/notification-service.ts`

### P
- **@PatientDataAggregatorService** - `import { PatientDataAggregatorService } from '@altamedica/shared/services/patient-data-aggregator.service'`
  - Agregador de datos de @pacientes
  - Ruta: `src/services/patient-data-aggregator.service.ts`

- **@PatientDataExportService** - `import { PatientDataExportService } from '@altamedica/shared/services/patient-data-export.service'`
  - @Exportación de datos de @pacientes
  - Ruta: `src/services/patient-data-export.service.ts`

- **@PatientDataPDFService** - `import { PatientDataPDFService } from '@altamedica/shared/services/patient-data-pdf.service'`
  - Generación de @PDFs de datos médicos
  - Ruta: `src/services/patient-data-pdf.service.ts`

- **@PatientExportCollectors** - `import { * } from '@altamedica/shared/services/patient-export/collectors'`
  - Recolectores de datos para @exportación
  - Ruta: `src/services/patient-export/collectors/`

- **@PatientExportGenerators** - `import { * } from '@altamedica/shared/services/patient-export/generators'`
  - Generadores de @archivos de @exportación
  - Ruta: `src/services/patient-export/generators/`

- **@PaymentGatewayService** - `import { PaymentGatewayService } from '@altamedica/shared/services/payment-gateway.service'`
  - Gateway de @pagos unificado
  - Ruta: `src/services/payment-gateway.service.ts`

- **@PaymentService** - `import { PaymentService } from '@altamedica/shared/services/payment-service'`
  - Servicios de @pagos médicos
  - Ruta: `src/services/payment-service.ts`

- **@PaymentUtils** - `import { PaymentUtils } from '@altamedica/shared/payments'`
  - Utilidades de @pagos
  - Ruta: `src/payments.ts`

### S
- **@SharedUtils** - `import { SharedUtils } from '@altamedica/shared/utils'`
  - Utilidades compartidas generales
  - Ruta: `src/utils.ts`

### Export por Categorías

## 🏥 Servicios Médicos
```typescript
// Gestión de @pacientes
import { 
  PatientDataAggregatorService,
  PatientDataExportService,
  PatientDataPDFService 
} from '@altamedica/shared/services/...';

// @Medicamentos
import { MedicationCatalogService } from '@altamedica/shared/services/medication-catalog.service';
```

## 💳 Servicios de Pago
```typescript
// @Pagos
import { 
  PaymentService,
  PaymentGatewayService,
  MercadoPagoService 
} from '@altamedica/shared/services/...';

// @Facturación
import { InvoiceGenerationService } from '@altamedica/shared/services/invoice-generation.service';
```

## 🔐 Servicios de Seguridad
```typescript
// @Autenticación
import { JWTService, MFAService } from '@altamedica/shared/services/...';

// @Encriptación @HIPAA
import { EncryptionService } from '@altamedica/shared/services/encryption.service';

// @Auditoría
import { AuditService } from '@altamedica/shared/services/audit.service';

// @BAA Compliance
import { BAAService } from '@altamedica/shared/services/baa.service';
```

## 💾 Servicios de Datos
```typescript
// @Respaldo
import { 
  BackupService, 
  BackupPolicies 
} from '@altamedica/shared/services/...';

// @Logging
import { LoggerService } from '@altamedica/shared';
```

## 🔧 Servicios de Sistema
```typescript
// Administración
import { AdminService } from '@altamedica/shared/services/admin-service';

// @Notificaciones
import { NotificationService } from '@altamedica/shared/services/notification-service';

// @API Cliente
import { BaseAPIClient, buildQueryParams } from '@altamedica/shared';
```

## 📤 Sistema de Exportación de Datos (@HIPAA Compliant)

### Colectores de Datos
```typescript
import {
  AppointmentsCollector,
  LabResultsCollector,
  MedicalRecordsCollector,
  VitalSignsCollector,
  BaseCollector
} from '@altamedica/shared/services/patient-export/collectors';
```

### Generadores de Archivos
```typescript
import {
  CSVGenerator,
  JSONGenerator,
  BaseGenerator
} from '@altamedica/shared/services/patient-export/generators';
```

### Estrategias de Exportación
```typescript
import {
  CsvExportStrategy,
  JsonExportStrategy,
  PdfExportStrategy
} from '@altamedica/shared/services/patient-export/strategies';
```

### Servicios de Seguridad de Exportación
```typescript
import {
  AccessControlService,
  AuditLoggerService,
  EncryptionService
} from '@altamedica/shared/services/patient-export/security';
```

### Gestión de Requests
```typescript
import {
  NotificationService,
  RequestLifecycleService,
  RequestManagerService
} from '@altamedica/shared/services/patient-export/request';
```

### Orquestador
```typescript
import { ExportOrchestratorService } from '@altamedica/shared/services/patient-export/orchestrator';
```

### Compatibilidad Legacy
```typescript
import { CompatibilityLayerService } from '@altamedica/shared/services/patient-export/legacy';
```

## 🎯 Patrones de Import Recomendados

```typescript
// ✅ Servicios principales
import { LoggerService, BaseAPIClient } from '@altamedica/shared';

// ✅ Servicios específicos
import { PatientDataExportService } from '@altamedica/shared/services/patient-data-export.service';
import { EncryptionService } from '@altamedica/shared/services/encryption.service';

// ✅ Utilidades
import { buildQueryParams } from '@altamedica/shared';
import { SharedUtils } from '@altamedica/shared/utils';
```

## 🏗️ Arquitectura de @Exportación de Datos

El sistema de @exportación sigue una arquitectura modular:

1. **@Collectors** → Recopilan datos específicos
2. **@Generators** → Convierten datos a formatos
3. **@Strategies** → Definen flujos de @exportación  
4. **@Security** → Garantizan compliance @HIPAA
5. **@Orchestrator** → Coordina todo el proceso

### Flujo Típico
```typescript
Request → Security → Collector → Generator → Strategy → Export → Audit
```

## 🚨 ERRORES CRÍTICOS Y SOLUCIONES

### ⚠️ Error TS2554: LoggerService siempre requiere data parameter
```typescript
// ❌ INCORRECTO - Falta el segundo parámetro
LoggerService.info('Export completed');
LoggerService.error('Export failed');
LoggerService.warn('Low memory');

// ✅ CORRECTO - Siempre pasar un objeto como segundo parámetro
LoggerService.info('Export completed', { userId, exportId });
LoggerService.error('Export failed', { error: error.message, userId });
LoggerService.warn('Low memory', { available: memAvailable });

// 📍 Archivos con este error frecuente:
// - src/services/patient-export/request/notification.service.ts (líneas 82, 112, 146)
// - src/services/patient-data-aggregator.service.ts
// - src/services/baa.service.ts
```

### ⚠️ Error: Edge Runtime - Node APIs no permitidas
```typescript
// ❌ PROBLEMA: ioredis/crypto/fs en Edge Runtime
import Redis from 'ioredis';
import crypto from 'crypto';
import fs from 'fs';

// ✅ SOLUCIÓN 1: Marcar route como Server-only
export const runtime = 'nodejs'; // En app/api/route.ts

// ✅ SOLUCIÓN 2: Lazy import condicional  
if (typeof window === 'undefined') {
  const redis = await import('ioredis').then(m => m.default);
}

// ✅ SOLUCIÓN 3: Usar servicios Edge-safe
import { BaseAPIClient } from '@altamedica/shared'; // Edge-safe ✅
import { LoggerService } from '@altamedica/shared'; // Edge-safe ✅
```

### ⚠️ Error: Usar console en lugar de LoggerService
```typescript
// ❌ PROBLEMA: console.log/warn/error en producción
console.log('Debug info', data);
console.warn('Warning message');
console.error('Error occurred');

// ✅ SOLUCIÓN: SIEMPRE usar LoggerService (Edge-safe + structured)
import { LoggerService } from '@altamedica/shared';
LoggerService.info('Debug info', { data, userId });
LoggerService.warn('Warning message', { context });
LoggerService.error('Error occurred', { error: error.message });
```

### ⚠️ Error: Deep imports fuera de @altamedica
```typescript
// ❌ PROBLEMA: Deep import rompible
import { utils } from '@altamedica/shared/src/utils/internal';
import { Environment } from '@altamedica/shared/config/environment';

// ✅ SOLUCIÓN: Import desde index oficial
import { SharedUtils } from '@altamedica/shared/utils';
import { Environment } from '@altamedica/shared'; // Si está exportado
// O usar process.env directamente si no está exportado
```

### ⚠️ Error: Imports circulares entre servicios
```typescript
// ❌ PROBLEMA: ServiceA importa ServiceB que importa ServiceA
// services/a.service.ts
import { ServiceB } from './b.service';

// services/b.service.ts
import { ServiceA } from './a.service';

// ✅ SOLUCIÓN: Usar inyección de dependencias o interfaces
// services/interfaces.ts
export interface IServiceA { /* métodos */ }
export interface IServiceB { /* métodos */ }

// services/a.service.ts
import type { IServiceB } from './interfaces';
```

## 🏷️ Matriz de Compatibilidad Runtime

| Servicio | Edge Runtime | Node.js | Cliente | Notas |
|----------|-------------|---------|---------|-------|
| **@BaseAPIClient** | ✅ | ✅ | ✅ | Fetch-based |
| **@LoggerService** | ✅ | ✅ | ✅ | Structured logging |
| **@buildQueryParams** | ✅ | ✅ | ✅ | Pure JS |
| **@EncryptionService** | ❌ | ✅ | ❌ | Node crypto required |
| **@BackupService** | ❌ | ✅ | ❌ | File system access |
| **@PaymentService** | ❌ | ✅ | ❌ | External APIs |
| **@MFAService** | ❌ | ✅ | ❌ | Crypto dependencies |

## 🔒 Compliance @HIPAA

Todos los servicios incluyen:
- ✅ @Encriptación AES-256-GCM
- ✅ @Audit logging automático
- ✅ Control de @acceso granular
- ✅ Sanitización de @datos
- ✅ Retention policies