/**
 * Medical date utility functions
 * @module @altamedica/medical/utils/date-utils
 */
/**
 * Format a date for medical records display
 */
export declare const formatMedicalDate: (date: Date | string) => string;
/**
 * Format a date for short display (appointments list)
 */
export declare const formatShortDate: (date: Date | string) => string;
/**
 * Calculate age from birth date
 */
export declare const calculateAge: (birthDate: Date | string) => number;
/**
 * Check if appointment is in the past
 */
export declare const isPastAppointment: (date: Date | string) => boolean;
/**
 * Get time until appointment
 */
export declare const getTimeUntilAppointment: (date: Date | string) => string;
//# sourceMappingURL=date-utils.d.ts.map