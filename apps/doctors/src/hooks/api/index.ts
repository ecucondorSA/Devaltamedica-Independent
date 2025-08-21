// 🎣 AltaMedica API Hooks - Índice Principal
// Auto-generado - Conecta con APIs reales sin mocks
// Generado: 2025-08-04T07:48:44.700189

// ✨ Hooks base (useApiBridge deprecated / removido en migración)
// TODO: Reintroducir bridge si se necesita multiplexar múltiples backends.

// 🔐 Autenticación (shim temporal mientras se expone hook consolidado)
// Eliminamos exports rotos que generaban errores de compilación.

// 👥 Pacientes
export { usePatients } from './usePatients';
// export type { Patient } from './usePatients'; // Tipo no disponible actualmente

// 👨‍⚕️ Doctores
export { useDoctors } from './useDoctors';

// 📅 Citas
export { useAppointments } from './useAppointments';

// 🎥 Video Llamadas
export { useVideoCall } from './useVideoCall';

// 🎯 Hook principal para acceso completo
// 🔧 API principal simplificada (placeholder mientras se reconstruye capa de agregación)
export function useAltaMedicaAPI() {
  return {
    // auth: pending
    isHealthy: true,
    token: undefined
  } as const;
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
