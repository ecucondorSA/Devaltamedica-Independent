# 🏥 ALTAMEDICA - Sistema de Gestión Médica

Sistema integral de gestión médica con cumplimiento **HIPAA/GDPR** desarrollado con Next.js 14, Firebase y TypeScript.

## 🎯 Características Principales

### 🔐 Seguridad y Cumplimiento
- ✅ **Cumplimiento HIPAA** completo
- ✅ **Cumplimiento GDPR** con manejo de consentimientos
- ✅ **Cifrado AES-256-GCM** para datos sensibles
- ✅ **Auditoría completa** de todas las acciones
- ✅ **Autenticación multifactor** (MFA)
- ✅ **Control de acceso basado en roles** (RBAC/ABAC)

### 🏥 Funcionalidades Médicas
- 📋 **Gestión completa de pacientes** con historial médico
- 📅 **Sistema de citas** con notificaciones en tiempo real
- 🚨 **Alertas críticas** con priorización médica
- 📊 **Dashboard médico** con KPIs especializados
- 🔬 **Integración HL7/FHIR** para interoperabilidad
- 📱 **Interfaz responsive** optimizada para tablets médicas

### 🛠️ Tecnologías

```
Frontend:     Next.js 14, React 18, TypeScript 5
Backend:      Firebase (Auth, Firestore, Storage, Functions)
Styling:      Tailwind CSS con tema médico personalizado
State:        React Query + Zustand
Security:     Crypto-JS, Web Crypto API
Charts:       Chart.js + React-Chartjs-2
Testing:      Jest + Testing Library
```

## 🚀 Inicio Rápido

### Prerrequisitos

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Cuenta de Firebase con Blaze plan (para funciones)
```

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/altamedica/doctors-app.git
cd doctors-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase
```

4. **Configurar Firebase**
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Autenticarse
firebase login

# Inicializar proyecto
firebase init
```

5. **Ejecutar en modo desarrollo**
```bash
# Con emuladores de Firebase
npm run emulators &
npm run dev

# Solo aplicación
npm run dev
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js 14
│   ├── page.tsx           # Dashboard principal
│   ├── layout.tsx         # Layout raíz
│   ├── globals.css        # Estilos globales
│   ├── pacientes/         # Gestión de pacientes
│   ├── citas/             # Sistema de citas
│   └── dashboard/         # Configuraciones
│
├── components/            # Componentes React reutilizables
│   ├── dashboard/         # Componentes del dashboard médico
│   │   ├── MedicalDashboard.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── TodayAppointments.tsx
│   │   └── CriticalAlerts.tsx
│   ├── navigation/        # Navegación y layout
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   └── auth/             # Autenticación
│
├── services/             # Servicios y lógica de negocio
│   ├── firebase-service.ts      # Configuración Firebase
│   ├── patient-service.ts       # Gestión de pacientes
│   ├── encryption-service.ts    # Cifrado médico
│   └── validation-service.ts    # Validaciones médicas
│
├── hooks/                # React Hooks personalizados
│   └── useDashboard.ts   # Hook principal del dashboard
│
├── types/                # Definiciones TypeScript
│   ├── medical-entities.ts      # Entidades médicas
│   └── appointments-users.ts    # Citas y usuarios
│
└── utils/                # Utilidades y helpers
    ├── constants.ts      # Constantes médicas
    └── helpers.ts        # Funciones auxiliares
```

## 🔧 Configuración

### Variables de Entorno

Crear `.env.local` basado en `.env.example`:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Cifrado (GENERAR NUEVAS CLAVES)
NEXT_PUBLIC_ENCRYPTION_KEY=clave-de-cifrado-segura
NEXT_PUBLIC_SIGNING_KEY=clave-de-firma-segura

# Configuración médica
NEXT_PUBLIC_ENABLE_AUDIT_LOGGING=true
NEXT_PUBLIC_DATA_RETENTION_DAYS=2555
NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES=30
```

### Firebase Rules

Configurar reglas de seguridad en Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Pacientes - Solo acceso autorizado
    match /patients/{patientId} {
      allow read, write: if request.auth != null 
        && hasRole('medical_professional')
        && hasAccessToPatient(patientId);
    }
    
    // Auditoría - Solo escritura, lectura para auditores
    match /audit_logs/{logId} {
      allow create: if request.auth != null;
      allow read: if hasRole('auditor') || hasRole('admin');
    }
    
    // Funciones de helper
    function hasRole(role) {
      return role in resource.data.roles;
    }
    
    function hasAccessToPatient(patientId) {
      return patientId in resource.data.authorizedPatients;
    }
  }
}
```

## 🏥 Funcionalidades Médicas

### 👥 Gestión de Pacientes

```typescript
// Crear paciente con validación médica
const newPatient = await patientService.createPatient({
  personalInfo: {
    firstName: 'Juan',
    lastName: 'Pérez',
    dateOfBirth: '1990-01-01',
    nationalId: '12345678',
    // ... datos cifrados automáticamente
  },
  medicalInfo: {
    bloodType: 'O+',
    allergies: [...],
    chronicConditions: [...],
    // ... validado según estándares médicos
  }
});

// Búsqueda avanzada con filtros médicos
const patients = await patientService.searchPatients({
  bloodType: 'O+',
  hasAllergies: true,
  riskLevel: 'HIGH'
});
```

### 📅 Sistema de Citas

```typescript
// Dashboard con citas en tiempo real
const { todayAppointments, criticalAlerts } = useDashboard();

// Gestión de estados de citas
await markAppointmentComplete(appointmentId);
await rescheduleAppointment(appointmentId, newDateTime);
```

### 🚨 Alertas Críticas

```typescript
// Sistema de alertas médicas automáticas
const alert: CriticalAlert = {
  type: 'CRITICAL_VALUES',
  patientId: 'patient-123',
  message: 'Valores de glucosa críticos: 350 mg/dL',
  priority: 'CRITICAL',
  actionRequired: true
};

// Reconocimiento de alertas con auditoría
await acknowledgeAlert(alertId);
```

## 🔐 Seguridad y Cumplimiento

### Cifrado de Datos

```typescript
// Cifrado automático de datos sensibles
const encryptedSSN = await encryptionService.encrypt(socialSecurityNumber);

// Firma digital para integridad
const signature = await encryptionService.signData(medicalData);
```

### Auditoría Completa

```typescript
// Registro automático de todas las acciones
await auditService.logEvent({
  action: 'PATIENT_ACCESSED',
  userId: currentUser.uid,
  patientId: patientId,
  timestamp: new Date().toISOString(),
  reasonForAccess: 'Consulta médica rutinaria'
});
```

### Control de Acceso

```typescript
// Verificación de permisos médicos
await checkPatientAccessPermission(userId, patientId, 'read');
await checkMedicalLicenseValid(professionalId);
```

## 📊 Dashboard Médico

### KPIs Especializados

- 👥 **Total de Pacientes** con tendencias
- 📅 **Citas del Día** con estados en tiempo real
- 🚨 **Alertas Críticas** priorizadas por urgencia médica
- ⏱️ **Tiempo de Espera** promedio
- 📈 **Satisfacción del Paciente** con métricas detalladas
- 💰 **Métricas Financieras** mensuales

### Componentes Interactivos

```typescript
// Dashboard principal con estado global
<MedicalDashboard initialView="overview" />

// Estadísticas en tiempo real
<DashboardStats stats={stats} isLoading={isLoading} />

// Citas con gestión de estados
<TodayAppointments 
  appointments={appointments}
  onMarkComplete={markComplete}
  onReschedule={reschedule}
/>

// Alertas críticas con priorización
<CriticalAlerts 
  alerts={alerts}
  onAcknowledge={acknowledge}
  maxVisible={5}
/>
```

## 🧪 Testing

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch

# Linting y type checking
npm run lint
npm run type-check
```

### Estructura de Tests

```
__tests__/
├── components/           # Tests de componentes React
├── services/            # Tests de servicios médicos
├── hooks/               # Tests de hooks personalizados
└── utils/               # Tests de utilidades
```

## 📱 Responsive Design

Optimizado para dispositivos médicos:

- 📱 **Mobile**: Smartphones para consultas rápidas
- 📊 **Tablet**: Tablets médicas en salas de consulta
- 💻 **Desktop**: Estaciones de trabajo médicas
- 🖨️ **Print**: Reportes médicos optimizados

```css
/* Breakpoints médicos personalizados */
@media (min-width: 768px) { /* Tablet médica */ }
@media (min-width: 1024px) { /* Estación médica */ }
@media print { /* Reportes médicos */ }
```

## 🚀 Deployment

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
# Build optimizado
npm run build

# Deploy a Firebase
npm run deploy

# Verificación post-deployment
npm run security:audit
```

### Variables de Entorno por Ambiente

```bash
# Desarrollo
.env.local

# Staging
.env.staging

# Producción
.env.production
```

## 📋 Checklist de Cumplimiento

### HIPAA Compliance ✅

- [x] Cifrado de datos en reposo y tránsito
- [x] Control de acceso basado en roles
- [x] Auditoría completa de accesos
- [x] Gestión segura de sesiones
- [x] Backup y recuperación de datos
- [x] Capacitación del personal médico

### GDPR Compliance ✅

- [x] Consentimiento explícito del paciente
- [x] Derecho al olvido (eliminación de datos)
- [x] Portabilidad de datos médicos
- [x] Notificación de brechas de seguridad
- [x] Designación de DPO (Data Protection Officer)
- [x] Privacy by Design

## 🔄 Actualizaciones y Mantenimiento

### Versionado Semántico

```
v2.0.0 - Release principal con nuevas funcionalidades
v2.0.1 - Patch de seguridad
v2.1.0 - Minor con nuevas características
```

### Logs de Actualización

```bash
# Ver changelog
cat CHANGELOG.md

# Verificar vulnerabilidades
npm audit

# Actualizar dependencias
npm run update-deps
```

## 🆘 Soporte y Documentación

### Recursos de Ayuda

- 📖 **Documentación**: `/docs`
- 🎥 **Tutoriales**: `/training`
- 📞 **Soporte 24/7**: support@altamedica.com
- 🐛 **Reportar Bugs**: GitHub Issues

### Contacto de Emergencia

```
🚨 Emergencias del Sistema: +1 (555) 123-4567
📧 Soporte Técnico: support@altamedica.com
💬 Chat en Vivo: https://altamedica.com/support
```

## 📄 Licencia

Este proyecto es **software propietario** de ALTAMEDICA. 

Todos los derechos reservados. El uso, modificación o distribución requiere autorización explícita.

---

<div align="center">

**ALTAMEDICA** - *Transformando la atención médica con tecnología segura*

🏥 [Website](https://altamedica.com) • 📧 [Contact](mailto:info@altamedica.com) • 🐛 [Issues](https://github.com/altamedica/doctors-app/issues)

</div>
