# 👨‍⚕️ AltaMedica Doctors Portal

**Puerto:** 3002 | **Tipo:** Portal Médico | **Framework:** Next.js

## ⚠️ REGLA FUNDAMENTAL: USAR PACKAGES CENTRALIZADOS

### 🚫 **LO QUE NO DEBES HACER:**
```typescript
// ❌ NUNCA crear hooks médicos duplicados
export function usePatients() {
  // Ya existe en @altamedica/hooks - PROHIBIDO
}

// ❌ NUNCA implementar cálculos médicos duplicados
export function calculateBMI() {
  // Ya existe en @altamedica/medical-utils - PROHIBIDO  
}

// ❌ NUNCA crear componentes médicos que ya existen
export function PatientCard() {
  // Ya existe en @altamedica/medical-components - PROHIBIDO
}
```

### ✅ **LO QUE SÍ DEBES HACER:**
```typescript
// ✅ SIEMPRE importar desde packages centralizados
import { useAuth, usePatients, useAppointments } from '@altamedica/hooks';
import { calculateBMI, formatMedicalDate } from '@altamedica/medical-utils';
import { PatientCard, AppointmentTable } from '@altamedica/medical-components';
import { Patient, MedicalRecord } from '@altamedica/medical-types';
```

## 📦 **PASO 1: REVISAR PACKAGES MÉDICOS DISPONIBLES**

**ANTES de escribir cualquier código médico, verifica estos packages:**

### 🪝 Hooks Médicos (`@altamedica/hooks`)
```bash
# Ver hooks médicos disponibles
cd ../../packages/hooks/src/medical
ls -la

# Hooks médicos principales:
# - usePatients, useAppointments, usePrescriptions
# - useMedicalRecords, useDiagnostics, useTelemedicine
# - useVitalSigns, useLabResults, useImaging
```

### 🏥 Componentes Médicos (`@altamedica/medical-components`)
```bash
# Ver componentes médicos disponibles
cd ../../packages/medical-components/src
ls -la

# Componentes médicos principales:
# - PatientDashboard, AppointmentScheduler
# - MedicalHistory, VitalSigns, Prescriptions
# - TelemedicineConsole, DiagnosticTools
```

### 🔧 Utilidades Médicas (`@altamedica/medical-utils`)
```bash
# Ver utilidades médicas disponibles
cd ../../packages/medical-utils/src
ls -la

# Utilidades médicas principales:
# - BMI, dosage, vitals calculations
# - Medical validations, FHIR helpers
# - ICD-10, SNOMED CT utilities
```

### 🩺 Tipos Médicos (`@altamedica/medical-types`)
```bash
# Ver tipos médicos disponibles
cd ../../packages/medical-types/src
ls -la

# Tipos médicos principales:
# - Patient, Appointment, MedicalRecord
# - Prescription, Diagnosis, VitalSigns
# - LabResult, Imaging, Allergy
```

## 🚀 **Configuración de Desarrollo**

### Instalación
```bash
pnpm install
```

### Desarrollo
```bash
pnpm dev  # Puerto 3002
```

### Build
```bash
pnpm build
```

## 🏗️ **Arquitectura del Portal Médico**

```
src/
├── app/                 # Next.js 13+ App Router
├── components/          # Componentes ESPECÍFICOS del portal médico
│   ├── consultation/    # Consulta específica de doctores
│   ├── telemedicine/    # WebRTC específico para doctores
│   └── diagnosis/       # Herramientas diagnósticas específicas
├── hooks/               # Solo hooks ESPECÍFICOS de doctores
│   └── useDoctorOnly.ts   # SOLO si no existe en packages
├── lib/                 # Configuración específica médica
└── services/            # Servicios específicos del doctor
```

## ✅ **Checklist Antes de Desarrollar**

### 📋 **OBLIGATORIO - Verificar Medical Packages Primero:**
- [ ] ¿El hook médico ya existe en `@altamedica/hooks`?
- [ ] ¿El componente médico ya existe en `@altamedica/medical-components`?
- [ ] ¿La utilidad médica ya existe en `@altamedica/medical-utils`?
- [ ] ¿El tipo médico ya existe en `@altamedica/medical-types`?

### 📋 **Solo si NO existe en packages médicos:**
- [ ] ¿Es específico del flujo de trabajo del doctor?
- [ ] ¿No puede ser reutilizado por pacientes u otras apps?
- [ ] ¿Está documentado por qué es específico del doctor?

## 🎯 **Funcionalidades Específicas del Portal Médico**

### Dashboard Médico
- **Agenda de consultas del día**
- **Pacientes recurrentes y urgentes**  
- **Alertas médicas y notificaciones**
- **Métricas de práctica médica**

### Consulta Médica
```typescript
// ✅ CORRECTO - Específico del flujo de consulta médica
export function MedicalConsultation() {
  const { patient, history, vitals } = useConsultation();
  
  return (
    <div>
      <PatientSummary patient={patient} /> {/* De @altamedica/medical-components */}
      <VitalSigns data={vitals} />
      <MedicalHistory history={history} />
      <DiagnosisInterface />  {/* Específico del doctor */}
    </div>
  );
}
```

### Telemedicina para Doctores
```typescript
// ✅ CORRECTO - WebRTC específico para el rol de doctor
export function DoctorTelemedicineConsole() {
  const { 
    patientConnection, 
    medicalTools, 
    consultationNotes 
  } = useDoctorTelemedicine();
  
  return (
    <div>
      <VideoConsultation connection={patientConnection} />
      <MedicalToolsPanel tools={medicalTools} />
      <ConsultationNotes notes={consultationNotes} />
    </div>
  );
}
```

## 🔗 **Dependencies Médicas Principales**

```json
{
  "@altamedica/hooks": "workspace:*",
  "@altamedica/medical-components": "workspace:*", 
  "@altamedica/medical-utils": "workspace:*",
  "@altamedica/medical-types": "workspace:*",
  "@altamedica/medical-fhir": "workspace:*",
  "@altamedica/telemedicine-core": "workspace:*"
}
```

## 📊 **Funcionalidades Médicas Principales**

### Gestión de Pacientes
- **Expedientes médicos electrónicos (EMR)**
- **Historial clínico completo**
- **Alertas de medicamentos y alergias**
- **Seguimiento de tratamientos**

### Diagnóstico y Prescripción
```typescript
// ✅ CORRECTO - Herramientas diagnósticas para doctores
export function DiagnosticWorkflow() {
  const { 
    symptoms, 
    differentialDiagnosis, 
    recommendedTests 
  } = useDiagnosticAI();
  
  return (
    <div>
      <SymptomChecker symptoms={symptoms} />
      <DiagnosisAssistant suggestions={differentialDiagnosis} />
      <TestRecommendations tests={recommendedTests} />
    </div>
  );
}
```

### Prescripción Digital
```typescript
// ✅ CORRECTO - Sistema de prescripción para doctores
export function DigitalPrescription() {
  const { 
    medicationDatabase, 
    dosageCalculator, 
    interactions 
  } = usePrescriptionTools();
  
  return (
    <div>
      <MedicationSearch database={medicationDatabase} />
      <DosageCalculator calculator={dosageCalculator} />
      <InteractionWarnings warnings={interactions} />
    </div>
  );
}
```

## 🛡️ **Seguridad y Compliance HIPAA**

### Autenticación Médica
```typescript
// ✅ CORRECTO - Auth médico con validación de licencia
import { useAuth, requireMedicalLicense } from '@altamedica/auth';

export const DoctorDashboard = requireMedicalLicense()(
  function DoctorDashboard() {
    const { doctor, patients, schedule } = useAuth();
    
    return <MedicalDashboard doctor={doctor} />;
  }
);
```

### Manejo de PHI (Protected Health Information)
```typescript
// ✅ CORRECTO - Manejo seguro de datos médicos
import { encryptPHI, auditLog } from '@altamedica/medical-security';

export function useSecureMedicalData() {
  const accessPatientData = async (patientId: string) => {
    // Audit log obligatorio
    await auditLog('patient_data_access', { 
      doctorId, 
      patientId, 
      timestamp: new Date() 
    });
    
    // Datos encriptados por defecto
    const data = await encryptPHI.decrypt(patientData);
    return data;
  };
}
```

## 🩺 **Herramientas Médicas Específicas**

### Calculadoras Médicas
```typescript
// ✅ CORRECTO - Usar calculadoras centralizadas
import { 
  calculateBMI, 
  calculateGFR, 
  calculateCardiacRisk 
} from '@altamedica/medical-utils';

export function MedicalCalculators() {
  return (
    <div>
      <BMICalculator calculator={calculateBMI} />
      <GFRCalculator calculator={calculateGFR} />
      <CardiacRiskAssessment calculator={calculateCardiacRisk} />
    </div>
  );
}
```

### Integración FHIR
```typescript
// ✅ CORRECTO - Usar FHIR centralizado
import { validateFHIR, convertToFHIR } from '@altamedica/medical-fhir';

export function FHIRIntegration() {
  const exportPatientData = (patient: Patient) => {
    const fhirData = convertToFHIR(patient, 'Patient');
    const validation = validateFHIR(fhirData);
    
    if (validation.valid) {
      return fhirData;
    }
    
    throw new Error('Invalid FHIR data');
  };
}
```

## 🎨 **UI/UX Específica Médica**

### Tema Médico
```typescript
// ✅ CORRECTO - Tema específico para doctores
export const medicalTheme = {
  colors: {
    primary: '#0369a1',      // Azul médico
    secondary: '#059669',    // Verde salud
    emergency: '#dc2626',    // Rojo emergencia
    warning: '#d97706'       // Naranja precaución
  },
  medical: {
    urgent: '#ef4444',
    normal: '#10b981',
    follow_up: '#f59e0b'
  }
};
```

### Layouts Médicos
```typescript
// ✅ CORRECTO - Layout específico para consulta médica
export function ConsultationLayout({ children }) {
  return (
    <MedicalLayout> {/* De @altamedica/medical-components */}
      <DoctorSidebar />
      <PatientInfoHeader />
      <main>{children}</main>
      <MedicalFooter />
    </MedicalLayout>
  );
}
```

## 🚨 **Code Review Checklist Médico**

### ❌ **Rechazar PR si:**
- Implementa hooks médicos que ya existen
- Duplica componentes de @altamedica/medical-components
- Crea cálculos médicos que ya existen en @altamedica/medical-utils
- No sigue estándares HIPAA de seguridad
- No justifica por qué algo es específico del doctor

### ✅ **Aprobar PR si:**
- Usa packages médicos centralizados
- Solo contiene lógica específica del flujo médico
- Cumple con estándares HIPAA
- Incluye audit logs apropiados
- Está bien documentado médicamente

## 📈 **Performance y Escalabilidad Médica**

### Lazy Loading de Componentes Médicos
```typescript
// ✅ CORRECTO - Lazy loading para mejor UX médica
const PatientHistory = lazy(() => import('./components/PatientHistory'));
const DiagnosticTools = lazy(() => import('./components/DiagnosticTools'));
const TelemedicineConsole = lazy(() => import('./components/TelemedicineConsole'));
```

### Cache de Datos Médicos Seguros
```typescript
// ✅ CORRECTO - Cache médico con TTL corto por seguridad
export function useMedicalCache() {
  const cacheOptions = {
    ttl: 300000, // 5 minutos máximo para datos médicos
    encryption: true,
    auditLog: true
  };
  
  // Cache específico para datos médicos sensibles
}
```

## 🧪 **Testing Médico**

### Tests Específicos Médicos
```bash
# Tests unitarios médicos
pnpm test:medical

# Tests de compliance HIPAA
pnpm test:hipaa

# Tests E2E de flujos médicos
pnpm test:e2e:medical
```

### Cypress Tests Médicos
```typescript
// ✅ Tests específicos del flujo médico
describe('Medical Consultation Workflow', () => {
  it('should handle complete patient consultation', () => {
    // Test del flujo completo de consulta
  });
  
  it('should validate prescription workflow', () => {
    // Test del flujo de prescripción digital
  });
  
  it('should ensure HIPAA compliance in data handling', () => {
    // Test de compliance médico
  });
});
```

## 📋 **Compliance y Regulaciones**

### HIPAA Compliance
- **Audit logs** obligatorios para acceso a PHI
- **Encryption** de datos médicos en reposo y tránsito
- **Access controls** basados en roles médicos
- **Data retention** según regulaciones médicas

### FDA Guidelines
- **Medical device software** classification si aplica
- **Clinical validation** para herramientas diagnósticas
- **Risk management** para funcionalidades médicas críticas

---

## 🎯 **RECUERDA:**
> **"MÉDICO PRIMERO, CÓDIGO DESPUÉS"**
> 
> La seguridad del paciente y el compliance médico son prioritarios sobre cualquier consideración técnica.

## 📞 **Soporte Médico**

- **Medical Documentation:** `../../packages/medical-*/README.md`
- **HIPAA Guidelines:** Documentación de compliance
- **Medical Issues:** Canal médico específico
- **Emergency Support:** 24/7 para issues críticos médicos