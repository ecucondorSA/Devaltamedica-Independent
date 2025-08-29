// Re-export appointment types from the main types package
export {
  type Appointment,
  AppointmentStatus,
  AppointmentType,
  type RecurringPattern,
  type NotificationLog,
  type AppointmentOutcome,
  type UrgencyLevel,
  type AppointmentStatus as AppointmentStatusType,
  type AppointmentType as AppointmentTypeType
} from '@altamedica/types/appointment';

// Re-export User type from auth package
export type { User } from '@altamedica/auth';
