/**
 * 🛠️ PATIENT UTILITIES - ALTAMEDICA
 * Utilidades comunes para trabajar con datos de pacientes
 */

import { Patient, PatientProfile } from './patients.service';

/**
 * Formatear nombre completo del paciente
 */
export function formatPatientName(patient: Patient | PatientProfile): string {
  if ('name' in patient) {
    return patient.name;
  }
  
  if ('personalInfo' in patient) {
    return `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`;
  }
  
  return 'Nombre no disponible';
}

/**
 * Calcular edad a partir de fecha de nacimiento
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validar email
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validar teléfono
 */
export function validatePhone(phone: string): boolean {
  return /^\+?[\d\s\-()]+$/.test(phone);
}

/**
 * Formatear teléfono para mostrar
 */
export function formatPhone(phone: string): string {
  // Eliminar caracteres no numéricos excepto +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Si comienza con código de país
  if (cleaned.startsWith('+57')) {
    const number = cleaned.substring(3);
    if (number.length === 10) {
      return `+57 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
  }
  
  // Formato básico
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  return phone; // Devolver original si no se puede formatear
}

/**
 * Obtener iniciales del paciente
 */
export function getPatientInitials(patient: Patient | PatientProfile): string {
  const name = formatPatientName(patient);
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * Obtener estado del paciente con estilo
 */
export function getPatientStatusInfo(status: Patient['status']): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'active':
      return {
        label: 'Activo',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      };
    case 'inactive':
      return {
        label: 'Inactivo',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      };
    case 'suspended':
      return {
        label: 'Suspendido',
        color: 'text-red-600',
        bgColor: 'bg-red-100'
      };
    default:
      return {
        label: 'Desconocido',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100'
      };
  }
}

/**
 * Verificar si el paciente tiene información médica completa
 */
export function hasCompleteProfile(patient: PatientProfile): boolean {
  const { personalInfo, medicalInfo } = patient;
  
  return !!(
    personalInfo.firstName &&
    personalInfo.lastName &&
    personalInfo.email &&
    personalInfo.phone &&
    personalInfo.dateOfBirth &&
    medicalInfo.emergencyContact.name &&
    medicalInfo.emergencyContact.phone
  );
}

/**
 * Obtener tiempo desde la última visita
 */
export function getTimeSinceLastVisit(lastVisit: string): string {
  const now = new Date();
  const visitDate = new Date(lastVisit);
  const diffInMs = now.getTime() - visitDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Hoy';
  } else if (diffInDays === 1) {
    return 'Ayer';
  } else if (diffInDays < 30) {
    return `Hace ${diffInDays} días`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
  }
}

/**
 * Filtrar pacientes por término de búsqueda
 */
export function filterPatients(patients: Patient[], searchTerm: string): Patient[] {
  if (!searchTerm.trim()) {
    return patients;
  }
  
  const term = searchTerm.toLowerCase();
  
  return patients.filter(patient => 
    patient.name.toLowerCase().includes(term) ||
    patient.email.toLowerCase().includes(term) ||
    (patient.phone && patient.phone.includes(term))
  );
}

/**
 * Agrupar pacientes por primera letra del apellido
 */
export function groupPatientsByLastName(patients: Patient[]): Record<string, Patient[]> {
  return patients.reduce((groups, patient) => {
    // Obtener la primera letra del apellido (asumiendo que el apellido es la última palabra)
    const nameParts = patient.name.split(' ');
    const lastName = nameParts[nameParts.length - 1];
    const firstLetter = lastName.charAt(0).toUpperCase();
    
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    
    groups[firstLetter].push(patient);
    
    return groups;
  }, {} as Record<string, Patient[]>);
}
