import { z } from 'zod';

/**
 * Esquema para la creación de una nueva cita.
 * Valida los IDs del doctor y paciente, y las fechas de inicio y fin.
 */
export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, { message: "El ID del doctor es requerido." }),
  patientId: z.string().min(1, { message: "El ID del paciente es requerido." }),
  startTime: z.string().datetime({ message: "La fecha de inicio debe ser una fecha y hora ISO 8601 válida." }),
  endTime: z.string().datetime({ message: "La fecha de fin debe ser una fecha y hora ISO 8601 válida." }),
  notes: z.string().optional(),
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: "La fecha de fin no puede ser anterior a la fecha de inicio.",
  path: ["endTime"], // path of error
});
