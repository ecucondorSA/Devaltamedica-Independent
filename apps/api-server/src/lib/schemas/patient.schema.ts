import { z } from 'zod';

/**
 * Esquema para la creación de un nuevo paciente.
 * Valida los datos personales y de contacto del paciente.
 */
export const createPatientSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Dirección de correo electrónico inválida." }),
  phone: z.string().optional(),
  dateOfBirth: z.string().refine((dob) => {
    // Simple regex para YYYY-MM-DD, se puede mejorar
    return /^\d{4}-\d{2}-\d{2}$/.test(dob);
  }, { message: "El formato de la fecha de nacimiento debe ser YYYY-MM-DD." }),
  // Añadir otros campos relevantes como dirección, historial médico básico, etc.
});
