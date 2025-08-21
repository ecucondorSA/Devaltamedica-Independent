# 🧪 MIGRACIÓN TEST - ButtonCorporate

## ✅ Migración Completada

**ButtonCorporate** ha sido migrado exitosamente desde `apps/patients` a `@altamedica/ui/corporate`.

### 📦 Ubicación Nueva
```
packages/ui/src/components/corporate/ButtonCorporate.tsx
```

### 🔧 Uso Nuevo
```typescript
// ANTES (en apps/patients)
import ButtonCorporate from './components/ui/ButtonCorporate';

// DESPUÉS (desde @altamedica/ui)
import { ButtonCorporate } from '@altamedica/ui';
```

### 🎯 Características Migradas

✅ **9 variantes**: primary, secondary, outline, ghost, danger, success, warning, medical, emergency
✅ **5 tamaños**: xs, sm, md, lg, xl  
✅ **Estados avanzados**: loading, disabled, gradient, animate
✅ **Iconos**: left/right positioning con Lucide React
✅ **Clases médicas**: variantes medical y emergency específicas
✅ **Accesibilidad**: focus states, ARIA compliance
✅ **Animaciones**: hover scale, pulse para emergency

### 🧪 Ejemplo de Uso

```tsx
import { ButtonCorporate } from '@altamedica/ui';
import { Heart, AlertTriangle } from 'lucide-react';

// Botón médico básico
<ButtonCorporate variant="medical" size="md">
  Consulta Médica
</ButtonCorporate>

// Botón de emergencia con icono
<ButtonCorporate 
  variant="emergency" 
  icon={<AlertTriangle />}
  animate={true}
>
  Emergencia Médica
</ButtonCorporate>

// Botón con loading
<ButtonCorporate 
  variant="primary"
  loading={true}
  loadingText="Guardando paciente..."
>
  Guardar Paciente
</ButtonCorporate>
```

### 🎨 Variantes Médicas Específicas

```tsx
// Variante médica con gradiente
<ButtonCorporate 
  medical={true}
  gradient={true}
  shadow={true}
>
  Iniciar Consulta
</ButtonCorporate>

// Botón de emergencia con animación
<ButtonCorporate 
  emergency={true}
  fullWidth={true}
>
  🚨 LLAMAR EMERGENCIA
</ButtonCorporate>
```

## 🏥 HealthMetricCard - COMPONENTE MÉDICO ESPECIALIZADO

**HealthMetricCard** ha sido migrado exitosamente desde `apps/patients` a `@altamedica/ui/medical`.

### 📦 Ubicación Nueva
```
packages/ui/src/components/medical/HealthMetricCard.tsx
```

### 🔧 Uso Nuevo
```typescript
// ANTES (en apps/patients)
import { HealthMetricCard } from './components/ui/HealthMetricCard';

// DESPUÉS (desde @altamedica/ui)
import { HealthMetricCard } from '@altamedica/ui';
```

### 🎯 Características Médicas Migradas

✅ **4 estados clínicos**: normal, warning, critical, excellent  
✅ **3 tendencias**: up, down, stable con iconos  
✅ **Prioridades médicas**: low, medium, high, critical  
✅ **Modo emergencia**: animaciones especiales y alertas  
✅ **Rangos normales**: referencia médica para valores  
✅ **Timestamps**: última actualización de métricas  
✅ **Accesibilidad**: ARIA compliance y contraste médico  
✅ **Validaciones**: robustas para datos médicos críticos  

### 🧪 Ejemplos de Uso Médico

```tsx
import { HealthMetricCard } from '@altamedica/ui';
import { Heart, Thermometer, Activity } from 'lucide-react';

// Métrica normal de presión arterial
<HealthMetricCard
  title="Presión Arterial"
  value="120/80"
  unit="mmHg"
  status="normal"
  trend="stable"
  icon={<Heart />}
  normalRange="90-120 / 60-80"
  description="Presión arterial óptima"
  lastUpdated="Hace 2 horas"
/>

// Temperatura crítica con emergencia
<HealthMetricCard
  title="Temperatura Corporal"
  value="39.2"
  unit="°C"
  status="critical"
  trend="up"
  icon={<Thermometer />}
  emergency={true}
  priority="critical"
  description="Fiebre alta - requiere atención médica"
  normalRange="36.1-37.2°C"
/>

// Frecuencia cardíaca excelente
<HealthMetricCard
  title="Frecuencia Cardíaca"
  value="72"
  unit="BPM"
  status="excellent"
  trend="stable"
  icon={<Activity />}
  description="Ritmo cardíaco en rango atlético"
  normalRange="60-100 BPM"
/>
```

### 🚨 Funcionalidades de Emergencia

```tsx
// Modo de emergencia médica
<HealthMetricCard
  title="Saturación de Oxígeno"
  value="88"
  unit="%"
  status="critical"
  emergency={true}
  priority="critical"
  icon={<Activity />}
  description="Saturación crítica - oxigenoterapia urgente"
/>
```

## 📅 AppointmentCard + StatusBadge - SISTEMA COMPLETO DE CITAS MÉDICAS

**AppointmentCard** (450+ líneas) y **StatusBadge** (150+ líneas) han sido migrados exitosamente desde `apps/patients` a `@altamedica/ui/medical`.

### 📦 Ubicación Nueva
```
packages/ui/src/components/medical/AppointmentCard.tsx
packages/ui/src/components/medical/StatusBadge.tsx
```

### 🔧 Uso Nuevo
```typescript
// ANTES (en apps/patients)
import { AppointmentCard } from './components/ui/AppointmentCard';
import { StatusBadge } from './components/ui/StatusBadge';

// DESPUÉS (desde @altamedica/ui)
import { AppointmentCard, StatusBadge } from '@altamedica/ui';
```

### 🎯 Características de AppointmentCard Migradas

✅ **10 tipos de cita**: consultation, emergency, telemedicine, surgery, etc.  
✅ **7 estados**: scheduled, confirmed, in_progress, completed, cancelled  
✅ **3 variantes**: default, compact, detailed  
✅ **Acciones inteligentes**: join call, reschedule, cancel según contexto  
✅ **Información médica**: síntomas, diagnóstico, notas del doctor  
✅ **Telemedicina**: integración completa con videollamadas  
✅ **Información financiera**: costos y obras sociales  
✅ **Prioridades médicas**: low, medium, high, critical con indicadores  

### 🎯 Características de StatusBadge Migradas

✅ **20+ estados**: médicos, de sistema, de citas, emergencias  
✅ **3 tamaños**: sm, md, lg con iconos escalables  
✅ **Animaciones**: pulse para críticos, bounce para progreso  
✅ **Estados médicos**: critical, stable, improving, emergency  
✅ **Iconografía médica**: iconos específicos por contexto  

### 🧪 Ejemplo de Uso Completo

```tsx
import { AppointmentCard, StatusBadge } from '@altamedica/ui';
import { Video, User, AlertCircle } from 'lucide-react';

// Cita de telemedicina confirmada
<AppointmentCard
  appointment={{
    id: "apt_001",
    title: "Consulta Cardiológica",
    description: "Control de presión arterial y análisis de ECG",
    date: "2025-01-30",
    time: "10:00",
    duration: 45,
    type: "telemedicine",
    status: "confirmed",
    doctor: {
      id: "doc_001",
      name: "María García",
      specialty: "Cardiología",
      rating: 4.8,
      license: "12345",
      phone: "+54 11 1234-5678"
    },
    isTelemedicine: true,
    priority: "high",
    symptoms: ["dolor pecho", "fatiga", "mareos"],
    cost: 5000,
    insurance: "OSDE",
    patientNotes: "Dolor intermitente en pecho desde hace 3 días"
  }}
  variant="detailed"
  onJoinCall={(id) => console.log('Joining call:', id)}
  onReschedule={(id) => console.log('Rescheduling:', id)}
  onCancel={(id) => console.log('Cancelling:', id)}
/>

// Emergencia crítica
<AppointmentCard
  appointment={{
    id: "apt_002",
    title: "Emergencia Médica",
    date: "2025-01-29",
    time: "15:30",
    duration: 60,
    type: "emergency",
    status: "in_progress",
    priority: "critical",
    doctor: {
      id: "doc_002", 
      name: "Carlos López",
      specialty: "Medicina de Emergencias"
    },
    isTelemedicine: false,
    location: "Sala de Emergencias - Piso 1"
  }}
  variant="compact"
/>

// Badges médicos independientes
<StatusBadge status="critical" animate={true} />
<StatusBadge status="stable" text="Paciente Estable" />
<StatusBadge status="emergency" size="lg" />
```

## 🚀 FASE 1 COMPLETADA ✅

1. ✅ ButtonCorporate migrado (215 líneas + 9 variantes)
2. ✅ CardCorporate migrado (245 líneas + 4 subcomponentes)  
3. ✅ HealthMetricCard migrado (170 líneas + estados médicos)
4. ✅ AppointmentCard migrado (450+ líneas + sistema completo)
5. ✅ StatusBadge migrado (150+ líneas + 20+ estados)

### 📈 IMPACTO TOTAL DE LA FASE 1

**COMPONENTES MIGRADOS:** 5 componentes principales + 4 subcomponentes
**LÍNEAS DE CÓDIGO:** 1,230+ líneas de código médico especializado  
**DUPLICACIÓN ELIMINADA:** ~6 Button, ~10 Card, ~4 Badge implementations
**DESIGN SYSTEM:** Arquitectura médica-first establecida
**SUBCATEGORÍAS:** `/corporate` y `/medical` con exports organizados

## 📈 Impacto Esperado

- **Reducción de duplicación**: -6 Button components duplicados
- **Consistencia**: Design system unificado médico
- **Mantenimiento**: Una sola fuente de verdad
- **Performance**: Bundle size optimizado