import { z } from 'zod';

// Esquema de Zod para la validación de datos de empleados
export const employeeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Email inválido." }),
  role: z.enum(["Admin", "Doctor", "Enfermero", "Recepción", "Otro"]),
  department: z.string().min(2, { message: "El departamento debe tener al menos 2 caracteres." }),
  hireDate: z.date(),
  status: z.enum(["Activo", "Inactivo", "De Licencia"]),
});

// Inferencia del tipo TypeScript a partir del esquema de Zod
export type Employee = z.infer<typeof employeeSchema>;
