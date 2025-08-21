/**
 * Medical date utility functions
 * @module @altamedica/medical/utils/date-utils
 */

/**
 * Format a date for medical records display
 */
export const formatMedicalDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Format a date for short display (appointments list)
 */
export const formatShortDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: Date | string): number => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1;
  }
  
  return age;
};

/**
 * Check if appointment is in the past
 */
export const isPastAppointment = (date: Date | string): boolean => {
  const appointmentDate = typeof date === 'string' ? new Date(date) : date;
  return appointmentDate < new Date();
};

/**
 * Get time until appointment
 */
export const getTimeUntilAppointment = (date: Date | string): string => {
  const appointmentDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = appointmentDate.getTime() - now.getTime();
  
  if (diff < 0) return 'Past appointment';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
};