// 🎣 AltaMedica API Hooks - Índice Principal
// Auto-generado - Conecta con APIs reales sin mocks
// Generado: 2025-08-04T07:48:44.636079

// ✨ Hooks base
export { useApiBridge, useServiceHealth } from './useApiBridge';
export type { ApiResponse, UseApiOptions } from './useApiBridge';

// 🔐 Autenticación
export { useAuth } from "@altamedica/auth';
export type { User } from "@altamedica/auth';

// 👥 Pacientes
export { usePatients, usePatientsSearch } from './usePatients';
export type { Patient } from './usePatients';

// 👨‍⚕️ Doctores
export { useDoctors } from './useDoctors';
export type { Doctor } from './useDoctors';

// 📅 Citas
export { useAppointments } from './useAppointments';
export type { Appointment } from './useAppointments';

// 🎥 Video Llamadas
export { useVideoCall } from './useVideoCall';
export type { VideoCall } from './useVideoCall';

// 🎯 Hook principal para acceso completo
export function useAltaMedicaAPI() {
  const auth = useAuth();
  const serviceHealth = useServiceHealth();
  
  return {
    auth,
    serviceHealth,
    isHealthy: serviceHealth.healthyCount > 0,
    token: auth.token
  };
}

// 📱 Ejemplo de uso:
/*
import { useAltaMedicaAPI, usePatients, useDoctors } from './hooks';

function MyComponent() {
  const { auth, isHealthy } = useAltaMedicaAPI();
  const { patients, loading: patientsLoading } = usePatients({ 
    token: auth.token,
    immediate: auth.isAuthenticated 
  });
  const { doctors } = useDoctors({ token: auth.token });
  
  if (!isHealthy) return <div>Servicios no disponibles</div>;
  if (!auth.isAuthenticated) return <LoginForm />;
  
  return (
    <div>
      <h1>Pacientes: {patients.length}</h1>
      <h1>Doctores: {doctors.length}</h1>
    </div>
  );
}
*/
