# 📋 Plan de Migración de Hooks - @altamedica/hooks

## 🎯 Objetivo
Migrar todos los hooks específicos de las aplicaciones al package centralizado `@altamedica/hooks` y actualizar los imports en todas las apps.

## 📊 Análisis de Hooks Existentes

### 🏥 Hooks Médicos (Ya implementados en el package)
- ✅ `usePatients` - Ya centralizado
- ✅ `useMedicalRecords` - Ya centralizado  
- ✅ `useAppointments` - Ya centralizado
- ✅ `usePrescriptions` - Ya centralizado
- ✅ `useVitalSigns` - Ya centralizado

### 🔐 Hooks de Auth (Ya implementados)
- ✅ `useAuth` - Ya centralizado
- ✅ `usePermissions` - Ya centralizado
- ✅ `useRole` - Ya centralizado

### 🌐 Hooks de API (Necesitan migración)
- 🔄 `useAltamedicaAPI` (patients) - Hook maestro con 55+ endpoints
- 🔄 `useAPIRequest` (patients) - Request genérico con retry
- 🔄 `useConnectionTest` (patients) - Testing de conexión

### 🏢 Hooks de Companies (Específicos - mantener en app)
- 🏢 `useCompanies` - Específico de companies app
- 🏢 `useMarketplace` (doctors) - Específico de marketplace médico
- 🏢 `useMatching` (companies) - Específico de matching empresarial

### ⚡ Hooks de Tiempo Real (Algunos migrados)
- ✅ `useWebSocket` - Ya centralizado
- ✅ `useRealTimeUpdates` - Ya centralizado
- 🔄 `useTelemedicineSession` - Duplicado en múltiples apps
- 🔄 `useWebRTC` - Duplicado en múltiples apps

### 🛠️ Hooks Utilitarios (Algunos migrados)
- ✅ `useDebounce` - Ya centralizado
- ✅ `useLocalStorage` - Ya centralizado
- ✅ `useMediaQuery` - Ya centralizado
- 🔄 `useHydrationSafe` - Duplicado en web-app y companies
- 🔄 `useOptimizedPerformance` (patients) - Performance específico
- 🔄 `useAccessibility` (patients) - Accesibilidad específico

### 🎨 Hooks de UI (Necesitan migración)
- 🔄 `useToast` (admin) - Sistema de notificaciones
- 🔄 `useDashboardData` - Duplicado en múltiples apps
- 🔄 `useLoginForm` - Duplicado en múltiples apps

## 📝 Plan de Migración por Fases

### Fase 1: Hooks de API Centrales
**Prioridad: Alta** - Estos hooks son usados en múltiples apps

#### 1.1 Migrar useAltamedicaAPI
- **Desde:** `apps/patients/src/hooks/useAltamedicaAPI.ts`
- **Hacia:** `packages/hooks/src/api/useAltamedicaAPI.ts`
- **Impacto:** Patients, Doctors, Admin apps

#### 1.2 Migrar hooks de API genéricos
- `useAPIRequest` - Request genérico con retry
- `useConnectionTest` - Testing de conexión
- `useOptimisticUpdate` - Updates optimistas

### Fase 2: Hooks de Telemedicina
**Prioridad: Alta** - Críticos para funcionalidad médica

#### 2.1 Consolidar useWebRTC
- **Apps afectadas:** patients, doctors
- **Variantes:** useWebRTCHybrid, useWebRTCDoctorHybrid
- **Destino:** `packages/hooks/src/realtime/useWebRTC.ts`

#### 2.2 Consolidar useTelemedicineSession
- **Apps afectadas:** patients, doctors
- **Variantes:** useTelemedicineSessionHybrid, useTelemedicineDoctorHybrid
- **Destino:** `packages/hooks/src/realtime/useTelemedicineSession.ts`

### Fase 3: Hooks Utilitarios Faltantes
**Prioridad: Media**

#### 3.1 Migrar hooks de hidratación y performance
- `useHydrationSafe` (web-app, companies)
- `useOptimizedPerformance` (patients)
- `useAccessibility` (patients)

#### 3.2 Migrar hooks de UI
- `useToast` (admin)
- `useDashboardData` - Consolidar variantes
- `useLoginForm` - Centralizar formularios de auth

### Fase 4: Hooks Específicos por App
**Prioridad: Baja** - Mantener en apps específicas

#### 4.1 Companies App (mantener específicos)
- `useCompanies` - Gestión empresarial
- `useJobOffers` - Ofertas laborales
- `useCompanyAnalytics` - Analytics empresariales

#### 4.2 Doctors App (mantener específicos)
- `useMarketplace` - Marketplace médico
- `useDashboard` - Dashboard específico de doctores

#### 4.3 Patients App (mantener específicos)
- `usePatientData` - Datos específicos del paciente actual
- `useIntegratedServices` - Servicios integrados de pacientes

## 🔄 Proceso de Migración

### 1. Para cada hook a migrar:

#### A. Crear en package centralizado
```typescript
// packages/hooks/src/[category]/[hookName].ts
export function useHookName(config?: HookConfig) {
  // Implementación centralizada
}
```

#### B. Actualizar index.ts del package
```typescript
// packages/hooks/src/index.ts
export { useHookName } from './[category]/[hookName]';
```

#### C. Actualizar index.ts de categoría
```typescript
// packages/hooks/src/[category]/index.ts
export { useHookName } from './[hookName]';
```

### 2. Para cada app afectada:

#### A. Actualizar imports
```typescript
// Antes
import { useHookName } from '../hooks/useHookName';

// Después
import { useHookName } from '@altamedica/hooks/[category]';
```

#### B. Crear archivo de re-export temporal (si es necesario)
```typescript
// apps/[app]/src/hooks/useHookName.ts
export { useHookName } from '@altamedica/hooks/[category]';
```

#### C. Eliminar implementación original después de verificar funcionalidad

### 3. Testing y Validación
- Ejecutar tests de cada app después de la migración
- Verificar que no hay imports rotos
- Validar que la funcionalidad se mantiene

## 📋 Checklist de Migración

### Fase 1: API Hooks ✅
- [ ] Migrar `useAltamedicaAPI` desde patients
- [ ] Migrar `useAPIRequest` genérico  
- [ ] Migrar `useConnectionTest`
- [ ] Actualizar imports en patients app
- [ ] Actualizar imports en doctors app
- [ ] Actualizar imports en admin app
- [ ] Ejecutar tests de integración

### Fase 2: Telemedicina Hooks
- [ ] Consolidar `useWebRTC` variants
- [ ] Consolidar `useTelemedicineSession` variants
- [ ] Actualizar imports en patients app
- [ ] Actualizar imports en doctors app
- [ ] Testing de videollamadas

### Fase 3: Utility Hooks
- [ ] Migrar `useHydrationSafe`
- [ ] Migrar `useOptimizedPerformance`
- [ ] Migrar `useAccessibility`
- [ ] Migrar `useToast`
- [ ] Consolidar `useDashboardData` variants
- [ ] Actualizar imports en todas las apps

### Fase 4: Validación Final
- [ ] Ejecutar `npm run build` en todas las apps
- [ ] Ejecutar `npm run test` en todas las apps
- [ ] Verificar que no hay imports rotos
- [ ] Documentar hooks migrados en Storybook
- [ ] Actualizar documentación de cada app

## 🚫 Hooks que NO se migran

### Específicos por dominio de negocio:
- `useCompanies` (companies) - Lógica específica de gestión empresarial
- `useMarketplace` (doctors) - Marketplace médico específico
- `useJobOffers` (companies) - Ofertas laborales específicas
- `useCompanyAnalytics` (companies) - Analytics empresariales
- `usePatientData` (patients) - Datos específicos del paciente actual

### Razones para mantenerlos en apps:
1. **Lógica de negocio específica** no reutilizable
2. **Dependencias específicas** de servicios locales
3. **Configuración específica** de la app
4. **Tipos específicos** no compartidos

## 📊 Impacto Estimado

### Reducción de código duplicado:
- **Antes:** ~90 hooks distribuidos en 7 packages + 5 apps
- **Después:** ~40 hooks centralizados + ~15 hooks específicos por app
- **Reducción:** ~50% de duplicación

### Beneficios:
- ✅ **Mantenimiento centralizado** de hooks comunes
- ✅ **Consistencia** en implementaciones
- ✅ **Testing centralizado** 
- ✅ **Documentación unificada** en Storybook
- ✅ **Tree-shaking optimizado**
- ✅ **Type safety** mejorado

### Apps que más se benefician:
1. **Patients app** - Mayor número de hooks duplicados
2. **Doctors app** - Hooks de telemedicina complejos
3. **Admin app** - Hooks de gestión y UI

---

**Tiempo estimado total:** 2-3 días de desarrollo + 1 día de testing
**Complejidad:** Media-Alta (requiere coordinación entre múltiples apps)
**Beneficio:** Alto (reduce significativamente la duplicación y mejora mantenimiento)