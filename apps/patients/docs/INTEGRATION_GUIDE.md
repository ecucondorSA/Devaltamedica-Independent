# Guía de Integración - Frontend con Backend Dockerizado

## 📋 Resumen
Se ha completado la integración del frontend de pacientes con el backend dockerizado de Altamedica, creando una capa de servicios robusta y hooks de React optimizados para el manejo de datos médicos.

## 🏗️ Arquitectura Implementada

### 1. Servicios API (`src/services/`)
- **`api-client.ts`**: Cliente HTTP central con retry logic y manejo de errores
- **`patients-service.ts`**: Gestión completa de pacientes (CRUD + búsqueda)
- **`appointments-service.ts`**: Sistema de citas médicas y gestión de doctores
- **`medical-records-service.ts`**: Historiales médicos, prescripciones y signos vitales
- **`telemedicine-service.ts`**: Sesiones de telemedicina y WebRTC
- **`auth-service.ts`**: Autenticación Firebase (ya existente, mejorado)

### 2. Hooks Integrados (`src/hooks/`)
- **`usePatientsIntegrated.ts`**: Hooks para gestión de pacientes
- **`useAppointmentsIntegrated.ts`**: Hooks para citas y doctores
- **`useMedicalRecordsIntegrated.ts`**: Hooks para historiales médicos
- **`useTelemedicineIntegrated.ts`**: Hooks para telemedicina
- **`useIntegratedServices.ts`**: Exportación centralizada y hook maestro

### 3. Configuración (`src/config/`)
- **`api.ts`**: URLs de endpoints actualizadas para backend dockerizado
- **Timeout y retry**: 30s timeout, 3 reintentos con backoff exponencial

### 4. Proveedor de Estado (`src/providers/`)
- **`QueryProvider.tsx`**: Configuración de React Query optimizada para datos médicos

## 🚀 Instalación y Setup

### Paso 1: Instalar Dependencias
```bash
cd apps/patients
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

**O usar el script incluido:**
```bash
cd /mnt/c/Users/Eduardo/Documents/devaltamedica
./install-react-query.sh
```

### Paso 2: Integrar Proveedor en Layout ✅ COMPLETADO
El proveedor ya está integrado en `src/app/layout.tsx`:

```tsx
import { QueryProvider } from '../providers/QueryProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <div id="root">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
```

### Paso 3: Verificar Backend Dockerizado
Asegurar que el backend esté ejecutándose en:
```
http://localhost:3001
```

### Paso 4: Usar Componentes de Ejemplo ✅ DISPONIBLES
Se han creado componentes de ejemplo listos para usar:

1. **`PatientDashboardIntegrated`** - Dashboard completo con todos los hooks
2. **`AppointmentManagerIntegrated`** - Gestión completa de citas médicas  
3. **`HooksUsageExamples`** - Ejemplos de uso de todos los hooks

## 📖 Uso de los Hooks

### Ejemplo 1: Gestión de Pacientes
```tsx
import { usePatients, useCreatePatient, usePatientsManager } from '@/hooks/useIntegratedServices';

function PatientsComponent() {
  // Obtener lista de pacientes
  const { data: patients, isLoading, error } = usePatients(1, 10);
  
  // Gestión completa con un solo hook
  const {
    createPatient,
    updatePatient,
    deletePatient,
    isCreating,
    isUpdating,
    isDeleting
  } = usePatientsManager();
  
  const handleCreatePatient = async (patientData) => {
    try {
      await createPatient.mutateAsync(patientData);
      // El cache se actualiza automáticamente
    } catch (error) {
      console.error('Error creating patient:', error);
    }
  };
  
  return (
    <div>
      {isLoading ? (
        <div>Cargando pacientes...</div>
      ) : (
        <div>
          {patients?.patients.map(patient => (
            <div key={patient.id}>{patient.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Ejemplo 2: Citas Médicas
```tsx
import { useUpcomingAppointments, useCreateAppointment } from '@/hooks/useIntegratedServices';

function AppointmentsComponent({ patientId }: { patientId: string }) {
  const { data: appointments, isLoading } = useUpcomingAppointments(patientId);
  const createAppointment = useCreateAppointment();
  
  const handleBookAppointment = async (appointmentData) => {
    try {
      await createAppointment.mutateAsync(appointmentData);
      // Las próximas citas se actualizan automáticamente
    } catch (error) {
      console.error('Error booking appointment:', error);
    }
  };
  
  return (
    <div>
      <h3>Próximas Citas</h3>
      {appointments?.map(appointment => (
        <div key={appointment.id}>
          {appointment.date} - Dr. {appointment.doctorName}
        </div>
      ))}
    </div>
  );
}
```

### Ejemplo 3: Dashboard Integrado
```tsx
import { useIntegratedDashboard } from '@/hooks/useIntegratedServices';

function PatientDashboard({ patientId }: { patientId: string }) {
  const {
    patient,
    upcomingAppointments,
    medicalRecords,
    activePrescriptions,
    isLoading,
    hasError,
    refetchAll
  } = useIntegratedDashboard(patientId);
  
  if (isLoading) return <div>Cargando dashboard...</div>;
  if (hasError) return <div>Error al cargar datos</div>;
  
  return (
    <div>
      <h1>Bienvenido, {patient?.name}</h1>
      
      <section>
        <h2>Próximas Citas ({upcomingAppointments?.length || 0})</h2>
        {/* Renderizar citas */}
      </section>
      
      <section>
        <h2>Prescripciones Activas ({activePrescriptions?.length || 0})</h2>
        {/* Renderizar prescripciones */}
      </section>
      
      <button onClick={refetchAll}>Actualizar Todo</button>
    </div>
  );
}
```

### Ejemplo 4: Telemedicina
```tsx
import { useJoinTelemedicineSession, useTelemedicineManager } from '@/hooks/useIntegratedServices';

function TelemedicineComponent() {
  const {
    joinSession,
    endSession,
    sendMessage,
    isJoining,
    isEnding
  } = useTelemedicineManager();
  
  const handleJoinSession = async () => {
    try {
      const sessionData = await joinSession.mutateAsync({
        patientId: 'patient-123',
        doctorId: 'doctor-456',
        sessionType: 'video'
      });
      
      console.log('Joined session:', sessionData.sessionId);
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };
  
  return (
    <div>
      <button 
        onClick={handleJoinSession} 
        disabled={isJoining}
      >
        {isJoining ? 'Conectando...' : 'Unirse a Sesión'}
      </button>
    </div>
  );
}
```

## 🔧 Características Implementadas

### ✅ Gestión de Estado del Servidor
- **Cache inteligente**: 5-10 minutos según tipo de datos
- **Invalidación automática**: Updates tras mutaciones
- **Reintentos**: 3 intentos con backoff exponencial
- **Estados de carga**: Loading, error, success states

### ✅ Manejo de Errores
- **Errores HTTP**: Códigos de estado y mensajes descriptivos
- **Errores de Red**: Retry automático y fallbacks
- **Errores de Auth**: Integración con Firebase tokens
- **Logging**: Console logs para debugging

### ✅ Optimizaciones de Performance
- **Queries en paralelo**: Batch requests cuando es posible
- **Garbage collection**: Limpieza automática de cache
- **Stale-while-revalidate**: Datos stale + fetch en background
- **Prefetching**: Para datos críticos del dashboard

### ✅ Integración con Firebase Auth
- **Token automático**: Headers de autorización transparentes
- **Refresh de tokens**: Manejo automático
- **Estados de auth**: Sincronización con estado de login

### ✅ TypeScript
- **Tipos completos**: Interfaces para todos los servicios
- **Type safety**: Autocompletado y validación
- **Inferencia**: Tipos automáticos en hooks

## 🎯 Endpoints Integrados

### Pacientes
- `GET /api/v1/patients` - Lista paginada
- `GET /api/v1/patients/simple` - Lista simple
- `GET /api/v1/patients/{id}` - Paciente específico
- `GET /api/v1/patients/{id}/profile` - Perfil completo
- `POST /api/v1/patients` - Crear paciente
- `PUT /api/v1/patients/{id}` - Actualizar paciente
- `DELETE /api/v1/patients/{id}` - Eliminar paciente

### Citas
- `GET /api/v1/appointments` - Lista con filtros
- `GET /api/v1/appointments/{id}` - Cita específica
- `POST /api/v1/appointments` - Crear cita
- `PUT /api/v1/appointments/{id}` - Actualizar cita
- `POST /api/v1/appointments/{id}/cancel` - Cancelar cita
- `GET /api/v1/doctors` - Lista de doctores
- `GET /api/v1/doctors/{id}/availability` - Disponibilidad

### Registros Médicos
- `GET /api/v1/medical-records` - Lista con filtros
- `GET /api/v1/medical-records/{id}` - Registro específico
- `POST /api/v1/medical-records` - Crear registro
- `GET /api/v1/prescriptions` - Prescripciones
- `POST /api/v1/prescriptions` - Nueva prescripción
- `GET /api/v1/patients/{id}/vital-signs` - Signos vitales

### Telemedicina
- `GET /api/v1/telemedicine/sessions` - Sesiones activas
- `POST /api/v1/telemedicine/sessions` - Crear sesión
- `POST /api/v1/telemedicine/sessions/{id}/join` - Unirse a sesión
- `POST /api/v1/telemedicine/sessions/{id}/end` - Finalizar sesión
- `GET /api/v1/telemedicine/webrtc/rooms/{id}` - Config WebRTC

## 🔍 Monitoreo y Debug

### React Query Devtools
Disponible en desarrollo para inspeccionar:
- Estado de queries y mutaciones
- Cache de datos
- Network requests
- Performance timing

### Logs de Consola
```
🔄 API Request: GET /api/v1/patients (attempt 1/4)
✅ API Success: GET /api/v1/patients {...}
❌ API Error (attempt 1): Network timeout
```

### Health Checks
```tsx
import { useBackendConnectivity } from '@/hooks/useIntegratedServices';

function HealthMonitor() {
  const { isHealthy, healthData, serverStatus } = useBackendConnectivity();
  
  return (
    <div>
      <div>Backend: {isHealthy ? '✅ Conectado' : '❌ Desconectado'}</div>
      <div>Server Status: {serverStatus?.status}</div>
    </div>
  );
}
```

## 🚨 Consideraciones de Seguridad

### ✅ Autenticación
- Tokens Firebase ID en headers automáticamente
- Refresh automático de tokens expirados
- Logout limpia todo el cache

### ✅ Datos Sensibles
- HTTPS obligatorio en producción
- Headers CORS configurados
- Cache limpio al cambiar usuario

### ✅ Validación
- Validación de tipos en TypeScript
- Sanitización de inputs
- Manejo seguro de errores

## 📂 Componentes Creados

### 1. PatientDashboardIntegrated ✅
**Ubicación:** `src/components/dashboard/PatientDashboardIntegrated.tsx`

Dashboard completo que demuestra:
- Hook maestro `useIntegratedDashboard`
- Manejo de estados de carga y error
- Verificación de conectividad del backend
- Modo emergencia
- Navegación por secciones (resumen, citas, historial, etc.)

```tsx
import PatientDashboardIntegrated from '@/components/dashboard/PatientDashboardIntegrated';

<PatientDashboardIntegrated patientId="patient-123" />
```

### 2. AppointmentManagerIntegrated ✅
**Ubicación:** `src/components/appointments/AppointmentManagerIntegrated.tsx`

Sistema completo de gestión de citas que incluye:
- Lista de próximas citas y historial
- Formulario de agendamiento con selección de doctor
- Verificación de disponibilidad en tiempo real
- Cancelación y reprogramación de citas

```tsx
import AppointmentManagerIntegrated from '@/components/appointments/AppointmentManagerIntegrated';

<AppointmentManagerIntegrated patientId="patient-123" />
```

### 3. HooksUsageExamples ✅
**Ubicación:** `src/components/examples/HooksUsageExamples.tsx`

Ejemplos interactivos de todos los hooks:
- Gestión de pacientes (CRUD)
- Citas médicas
- Registros médicos y prescripciones
- Telemedicina
- Dashboard integrado
- Monitoreo de conectividad

```tsx
import HooksUsageExamples from '@/components/examples/HooksUsageExamples';

<HooksUsageExamples />
```

## 📈 Próximos Pasos

1. ✅ **Instalar dependencias** - Script disponible: `./install-react-query.sh`
2. ✅ **Integrar QueryProvider** - Ya integrado en layout
3. ✅ **Crear componentes de ejemplo** - 3 componentes listos
4. **Migrar componentes existentes** a usar los nuevos hooks
5. **Configurar variables de entorno** para URLs del backend
6. **Implementar tests** para los servicios
7. **Configurar CI/CD** para deployment automático

## 🎯 Uso Inmediato

**Para probar la integración ahora mismo:**

1. Instala las dependencias:
   ```bash
   ./install-react-query.sh
   ```

2. Importa y usa cualquier componente:
   ```tsx
   // En cualquier página de tu app
   import HooksUsageExamples from '@/components/examples/HooksUsageExamples';
   
   export default function TestPage() {
     return <HooksUsageExamples />;
   }
   ```

3. Verifica que el backend esté corriendo en `localhost:3001`

4. ¡Los datos se cargarán automáticamente del backend dockerizado!

## 🔗 Referencias

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Altamedica Backend API](http://localhost:3001/api/docs)

---

**Estado**: ✅ Integración completada y lista para uso
**Última actualización**: $(date +%Y-%m-%d)