# 🏥 AltaMedica Admin Dashboard

**Puerto:** 3005 | **Tipo:** Panel de Administración | **Framework:** Next.js

## ⚠️ REGLA FUNDAMENTAL: USAR PACKAGES CENTRALIZADOS

### 🚫 **LO QUE NO DEBES HACER:**
```typescript
// ❌ NUNCA crear hooks locales duplicados
export function useAdminStats() {
  // Implementación duplicada - PROHIBIDO
}

// ❌ NUNCA implementar utilidades que ya existen
export function formatDate() {
  // Ya existe en @altamedica/utils - PROHIBIDO  
}

// ❌ NUNCA crear componentes que ya existen
export function Button() {
  // Ya existe en @altamedica/ui - PROHIBIDO
}
```

### ✅ **LO QUE SÍ DEBES HACER:**
```typescript
// ✅ SIEMPRE importar desde packages centralizados
import { useAuth, usePatients, useAppointments } from '@altamedica/hooks';
import { formatDate, formatCurrency } from '@altamedica/utils';
import { Button, Card, Loading } from '@altamedica/ui';
import { Patient, Appointment } from '@altamedica/types';
```

## 📦 **PASO 1: REVISAR PACKAGES DISPONIBLES**

**ANTES de escribir cualquier código, verifica estos packages:**

### 🪝 Hooks Disponibles (`@altamedica/hooks`)
```bash
# Ver todos los hooks disponibles
cd ../../packages/hooks/src
ls -la */index.ts

# Hooks médicos principales:
# - useAuth, usePatients, useAppointments
# - usePrescriptions, useMedicalRecords
# - useTelemedicine, useNotifications
```

### 🎨 Componentes UI (`@altamedica/ui`)
```bash
# Ver componentes disponibles
cd ../../packages/ui/src
ls -la

# Componentes principales:
# - Button, Card, Input, Modal, Loading
# - Table, Form, Navigation, Layout
```

### 🔧 Utilidades (`@altamedica/utils`)
```bash
# Ver utilidades disponibles
cd ../../packages/utils/src
ls -la

# Utilidades principales:
# - Formatters, Validators, Helpers
# - Date utils, Math utils, String utils
```

## 🚀 **Configuración de Desarrollo**

### Instalación
```bash
pnpm install
```

### Desarrollo
```bash
pnpm dev  # Puerto 3005
```

### Build
```bash
pnpm build
```

## 🏗️ **Arquitectura de la App**

```
src/
├── app/                 # Next.js 13+ App Router
├── components/          # Componentes ESPECÍFICOS del admin
│   ├── dashboard/       # Solo lógica específica de admin
│   └── stats/           # Métricas administrativas
├── hooks/               # Solo hooks ESPECÍFICOS de admin
│   └── useAdminOnly.ts  # SOLO si no existe en packages
├── lib/                 # Configuración específica
└── services/            # Servicios específicos de admin
```

## ✅ **Checklist Antes de Desarrollar**

### 📋 **OBLIGATORIO - Verificar Packages Primero:**
- [ ] ¿El hook ya existe en `@altamedica/hooks`?
- [ ] ¿El componente ya existe en `@altamedica/ui`?
- [ ] ¿La utilidad ya existe en `@altamedica/utils`?
- [ ] ¿El tipo ya existe en `@altamedica/types`?

### 📋 **Solo si NO existe en packages:**
- [ ] ¿Es específico del panel de admin?
- [ ] ¿No puede ser reutilizado por otras apps?
- [ ] ¿Está documentado por qué es específico?

## 🎯 **Funcionalidades Específicas del Admin**

### Dashboard de Administración
- **Vista general del sistema**
- **Métricas de usuarios y actividad**  
- **Gestión de roles y permisos**
- **Monitoreo de performance**

### Componentes Admin-Específicos
```typescript
// ✅ CORRECTO - Específico del admin
export function AdminDashboard() {
  const { users, appointments, stats } = useAdminDashboard();
  
  return (
    <Card> {/* De @altamedica/ui */}
      <AdminMetrics data={stats} />
      <AdminUserTable users={users} />
    </Card>
  );
}
```

## 🔗 **Dependencies Principales**

```json
{
  "@altamedica/hooks": "workspace:*",
  "@altamedica/ui": "workspace:*", 
  "@altamedica/utils": "workspace:*",
  "@altamedica/types": "workspace:*"
}
```

## 🚨 **Code Review Checklist**

### ❌ **Rechazar PR si:**
- Implementa hooks que ya existen en packages
- Duplica componentes de @altamedica/ui
- Crea utilidades que ya existen
- No justifica por qué algo es específico del admin

### ✅ **Aprobar PR si:**
- Usa packages centralizados
- Solo contiene lógica específica de admin
- Está bien documentado y justificado
- Sigue las convenciones establecidas

---

## 🎯 **RECUERDA:**
> **"PRIMERO PACKAGES, DESPUÉS DESARROLLO"**
> 
> Antes de escribir una línea de código, verifica que no exista ya en los packages centralizados.

## 📞 **Soporte**

- **Documentación Packages:** `../../packages/*/README.md`
- **Issues:** GitHub Issues
- **Chat:** Canal de desarrollo