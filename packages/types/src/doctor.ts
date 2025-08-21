import { z } from 'zod';

// Esquema de Zod para la validación de datos de doctores
export const doctorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Email inválido." }),
  specialty: z.string().min(2, { message: "La especialidad debe tener al menos 2 caracteres." }),
  licenseNumber: z.string().min(4, { message: "El número de licencia debe tener al menos 4 caracteres." }),
  phone: z.string().optional(),
  experience: z.number().min(0, { message: "Los años de experiencia no pueden ser negativos." }),
  status: z.enum(["Activo", "Inactivo", "De Vacaciones"]),
  consultationFee: z.number().min(0, { message: "La tarifa debe ser mayor a 0." }),
  availability: z.enum(["Disponible", "Ocupado", "No Disponible"]),
  hireDate: z.date(),
});

// Inferencia del tipo TypeScript a partir del esquema de Zod
export type Doctor = z.infer<typeof doctorSchema>;
