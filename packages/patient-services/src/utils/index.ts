// packages/patient-services/src/utils/index.ts

export type PatientStatus = 'active' | 'inactive' | 'suspended';

export const getPatientStatusInfo = (status?: PatientStatus) => {
  switch (status) {
    case 'active':
      return { label: 'Activo', color: 'text-green-800', bgColor: 'bg-green-100' };
    case 'inactive':
      return { label: 'Inactivo', color: 'text-yellow-800', bgColor: 'bg-yellow-100' };
    case 'suspended':
      return { label: 'Suspendido', color: 'text-red-800', bgColor: 'bg-red-100' };
    default:
      return { label: 'Desconocido', color: 'text-gray-800', bgColor: 'bg-gray-100' };
  }
};

// Añadir otras funciones de utils aquí si es necesario
export const formatPatientName = (patient: { firstName: string; lastName: string }) => {
    return `${patient.firstName} ${patient.lastName}`;
}

export const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

export const formatPhone = (phone?: string) => {
    return phone || 'N/A';
}

export const getTimeSinceLastVisit = (lastVisit?: string) => {
    if (!lastVisit) return 'N/A';
    return lastVisit;
}
