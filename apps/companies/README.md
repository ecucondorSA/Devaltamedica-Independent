# 🏢 AltaMedica Companies Portal

**Puerto:** 3004 | **Tipo:** Portal Empresarial | **Framework:** Next.js

## ⚠️ REGLA FUNDAMENTAL: USAR PACKAGES CENTRALIZADOS

### 🚫 **LO QUE NO DEBES HACER:**
```typescript
// ❌ NUNCA crear hooks locales duplicados
export function useCompanyStats() {
  // Implementación duplicada - PROHIBIDO
}

// ❌ NUNCA implementar utilidades que ya existen
export function validateEmail() {
  // Ya existe en @altamedica/utils - PROHIBIDO  
}

// ❌ NUNCA crear componentes que ya existen
export function CompanyCard() {
  // Ya existe en @altamedica/ui - PROHIBIDO
}
```

### ✅ **LO QUE SÍ DEBES HACER:**
```typescript
// ✅ SIEMPRE importar desde packages centralizados
import { useAuth, useCompanies, useAppointments } from '@altamedica/hooks';
import { formatCurrency, formatDate } from '@altamedica/utils';
import { Button, Card, Loading } from '@altamedica/ui';
import { Company, Employee } from '@altamedica/types';
```

## 📦 **PASO 1: REVISAR PACKAGES DISPONIBLES**

**ANTES de escribir cualquier código, verifica estos packages:**

### 🪝 Hooks Disponibles (`@altamedica/hooks`)
```bash
# Ver todos los hooks disponibles
cd ../../packages/hooks/src
ls -la */index.ts

# Hooks empresariales principales:
# - useAuth, useCompanies, useEmployees
# - useContracts, usePayments, useBilling
# - useMarketplace, useNotifications
```

### 🎨 Componentes UI (`@altamedica/ui`)
```bash
# Ver componentes disponibles
cd ../../packages/ui/src
ls -la

# Componentes principales:
# - Button, Card, Input, Modal, Loading
# - Table, Form, Navigation, Layout
# - Charts, Graphs, Analytics
```

### 🔧 Utilidades (`@altamedica/utils`)
```bash
# Ver utilidades disponibles
cd ../../packages/utils/src
ls -la

# Utilidades principales:
# - Formatters, Validators, Helpers
# - Date utils, Currency utils, String utils
```

## 🚀 **Configuración de Desarrollo**

### Instalación
```bash
pnpm install
```

### Desarrollo
```bash
pnpm dev  # Puerto 3004
```

### Build
```bash
pnpm build
```

## 🏗️ **Arquitectura de la App**

```
src/
├── app/                 # Next.js 13+ App Router
├── components/          # Componentes ESPECÍFICOS del portal empresarial
│   ├── dashboard/       # Dashboard específico de empresas
│   ├── hiring/          # Gestión de contrataciones
│   └── marketplace/     # Marketplace de servicios médicos
├── hooks/               # Solo hooks ESPECÍFICOS de empresas
│   └── useCompanyOnly.ts  # SOLO si no existe en packages
├── lib/                 # Configuración específica
└── services/            # Servicios específicos del portal
```

## ✅ **Checklist Antes de Desarrollar**

### 📋 **OBLIGATORIO - Verificar Packages Primero:**
- [ ] ¿El hook ya existe en `@altamedica/hooks`?
- [ ] ¿El componente ya existe en `@altamedica/ui`?
- [ ] ¿La utilidad ya existe en `@altamedica/utils`?
- [ ] ¿El tipo ya existe en `@altamedica/types`?

### 📋 **Solo si NO existe en packages:**
- [ ] ¿Es específico del portal de empresas?
- [ ] ¿No puede ser reutilizado por otras apps?
- [ ] ¿Está documentado por qué es específico?

## 🎯 **Funcionalidades Específicas del Companies Portal**

### Dashboard Empresarial
- **Gestión de empleados y beneficios médicos**
- **Contratación de servicios de salud**  
- **Marketplace de proveedores médicos**
- **Analytics de uso y costos**

### Componentes Empresa-Específicos
```typescript
// ✅ CORRECTO - Específico del portal empresarial
export function CompanyDashboard() {
  const { company, employees, contracts } = useCompanyDashboard();
  
  return (
    <Card> {/* De @altamedica/ui */}
      <CompanyMetrics data={company} />
      <EmployeeHealthTable employees={employees} />
      <ContractsSummary contracts={contracts} />
    </Card>
  );
}
```

### Marketplace de Servicios Médicos
```typescript
// ✅ CORRECTO - Lógica específica de marketplace empresarial
export function MedicalMarketplace() {
  const { providers, services, quotes } = useMarketplace();
  
  return (
    <div>
      <ProviderFilters /> {/* Específico de empresas */}
      <ServiceCatalog providers={providers} />
      <QuoteComparison quotes={quotes} />
    </div>
  );
}
```

## 🔗 **Dependencies Principales**

```json
{
  "@altamedica/hooks": "workspace:*",
  "@altamedica/ui": "workspace:*", 
  "@altamedica/utils": "workspace:*",
  "@altamedica/types": "workspace:*",
  "@altamedica/api-client": "workspace:*"
}
```

## 📊 **Funcionalidades Principales**

### Gestión de Empleados
- **Registro y perfiles de empleados**
- **Asignación de beneficios médicos**
- **Historial de servicios utilizados**
- **Reportes de salud ocupacional**

### Contratación de Servicios
- **Catálogo de proveedores médicos**
- **Cotizaciones y comparativas**
- **Contratos y SLAs**
- **Facturación y pagos**

### Analytics y Reportes
```typescript
// ✅ CORRECTO - Analytics específicos de empresas
export function CompanyAnalytics() {
  const { usage, costs, trends } = useCompanyAnalytics();
  
  return (
    <div>
      <UsageMetrics data={usage} />
      <CostAnalysis costs={costs} />
      <HealthTrends trends={trends} />
    </div>
  );
}
```

## 🛡️ **Seguridad y Compliance**

### Autenticación Empresarial
```typescript
// ✅ CORRECTO - Usar auth centralizado
import { useAuth, requireCompanyRole } from '@altamedica/auth';

export const CompanyAdminPage = requireCompanyRole('admin')(
  function CompanyAdminPage() {
    const { company, permissions } = useAuth();
    
    return <CompanyDashboard company={company} />;
  }
);
```

### Manejo de Datos Empresariales
```typescript
// ✅ CORRECTO - Usar validadores centralizados
import { validateCompanyData } from '@altamedica/utils';
import { CompanySchema } from '@altamedica/types';

export function useCompanyForm() {
  const validateForm = (data) => {
    return validateCompanyData(data, CompanySchema);
  };
  
  // Lógica específica del formulario empresarial
}
```

## 🎨 **UI/UX Específica de Empresas**

### Temas y Branding
```typescript
// ✅ CORRECTO - Customización específica de empresas
export const companyTheme = {
  colors: {
    primary: '#2563eb',    // Azul empresarial
    secondary: '#64748b',  // Gris corporativo
    success: '#059669',    // Verde éxito
    warning: '#d97706'     // Naranja alerta
  }
};
```

### Layouts Específicos
```typescript
// ✅ CORRECTO - Layout específico del portal empresarial
export function CompanyLayout({ children }) {
  return (
    <Layout> {/* De @altamedica/ui */}
      <CompanySidebar />
      <CompanyHeader />
      <main>{children}</main>
      <CompanyFooter />
    </Layout>
  );
}
```

## 🚨 **Code Review Checklist**

### ❌ **Rechazar PR si:**
- Implementa hooks que ya existen en packages
- Duplica componentes de @altamedica/ui
- Crea utilidades que ya existen
- No justifica por qué algo es específico del portal empresarial

### ✅ **Aprobar PR si:**
- Usa packages centralizados
- Solo contiene lógica específica de empresas
- Está bien documentado y justificado
- Sigue las convenciones establecidas

## 📈 **Performance y Escalabilidad**

### Lazy Loading de Componentes
```typescript
// ✅ CORRECTO - Lazy loading para mejor performance
const MarketplaceDashboard = lazy(() => import('./components/MarketplaceDashboard'));
const EmployeeManagement = lazy(() => import('./components/EmployeeManagement'));
```

### Cache de Datos Empresariales
```typescript
// ✅ CORRECTO - Cache específico de datos empresariales
export function useCompanyCache() {
  // Lógica de cache específica para datos de empresas
  // que no interfiere con cache general del sistema
}
```

## 🧪 **Testing**

### Tests Específicos de Empresas
```bash
# Tests unitarios
pnpm test

# Tests de integración específicos del portal
pnpm test:integration

# Tests E2E del flujo empresarial
pnpm test:e2e:company
```

### Cypress Tests Recomendados
```typescript
// ✅ Tests específicos del portal empresarial
describe('Company Portal Workflow', () => {
  it('should allow company admin to manage employees', () => {
    // Test del flujo completo empresarial
  });
  
  it('should handle marketplace service contracting', () => {
    // Test del marketplace empresarial
  });
});
```

---

## 🎯 **RECUERDA:**
> **"PRIMERO PACKAGES, DESPUÉS DESARROLLO"**
> 
> Antes de escribir una línea de código, verifica que no exista ya en los packages centralizados.

## 📞 **Soporte**

- **Documentación Packages:** `../../packages/*/README.md`
- **Issues:** GitHub Issues
- **Chat:** Canal de desarrollo empresarial