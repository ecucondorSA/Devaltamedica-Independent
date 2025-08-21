
import { z } from 'zod';

/**
 * Esquema para la creación de un nuevo doctor.
 * Valida los datos necesarios para registrar un profesional en la plataforma.
 */
export const createDoctorSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  specialty: z.string().min(2, { message: "La especialidad es requerida." }),
  licenseNumber: z.string().regex(/^[A-Z0-9]+$/, { message: "El número de licencia contiene caracteres inválidos." }),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  // Añadir otros campos relevantes aquí
});
