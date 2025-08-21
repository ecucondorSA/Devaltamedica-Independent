/**
 * Esquema de Auditoria para AltaMedica Platform
 * Conforme a Ley 26.529 Argentina - Derechos del Paciente
 * Art. 15: "acceso con clave de identificacion" y "registro de modificaciones"
 */

import { z } from 'zod';

// Tipos de acciones auditables conforme legislacion argentina
export const AuditActionSchema = z.enum([
  'read',           // Consulta de historia clinica
  'create',         // Creacion de registro medico
  'update',         // Modificacion de datos existentes
  'delete',         // Eliminacion de registros
  'export',         // Exportacion de datos (Ley 25.326)
  'access_denied',  // Intento de acceso no autorizado
  'login',          // Acceso al sistema
  'logout'          // Salida del sistema
]);

// Tipos de recursos auditables en sistema medico
export const AuditResourceSchema = z.enum([
  'patient',              // Historia clinica del paciente
  'appointment',          // Citas medicas
  'medical_record',       // Registros medicos
  'prescription',         // Prescripciones
  'lab_result',          // Resultados de laboratorio
  'telemedicine_session', // Sesiones de telemedicina
  'user_profile',        // Perfiles de usuario
  'billing',             // Facturacion
  'system'               // Operaciones de sistema
]);

// Esquema principal de auditoria - Ley 26.529 Argentina + Hash Chain (GAP-001-T5)
export const AuditLogSchema = z.object({
  id: z.string().uuid('ID debe ser UUID valido'),
  
  // OBLIGATORIO - Art. 15 Ley 26.529: "registro de modificaciones"
  timestamp: z.date({
    required_error: 'Timestamp es obligatorio por Ley 26.529',
    description: 'Fecha y hora exacta de la accion'
  }),
  
  // OBLIGATORIO - Art. 15 Ley 26.529: "clave de identificacion"
  actorId: z.string().min(1, 'Actor ID obligatorio para identificacion'),
  actorType: z.enum(['patient', 'doctor', 'admin', 'system', 'company_user'], {
    description: 'Tipo de usuario que realiza la accion'
  }),
  
  // OBLIGATORIO - Que accion se realizo
  action: AuditActionSchema,
  
  // OBLIGATORIO - Sobre que recurso
  resource: AuditResourceSchema,
  resourceId: z.string().optional(), // ID especifico del recurso si aplica
  
  // BUENAS PRACTICAS - No obligatorio por ley argentina
  ip: z.string().ip().optional(),
  userAgent: z.string().optional(),
  
  // Metadatos contextuales limitados (no PHI)
  metadata: z.record(z.unknown()).optional().default({}),
  
  // Para cumplimiento Ley 25.326 - Habeas Data
  patientId: z.string().optional(), // Solo si accion involucra datos de paciente especifico
  
  // Informacion de la sesion
  sessionId: z.string().optional(),
  
  // Resultado de la accion
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
  
  // GAP-001-T5: Hash Chain para integridad inmutable (HIPAA + Ley 26.529)
  hash: z.string().regex(/^[a-f0-9]{64}$/, 'Hash debe ser SHA-256 válido').optional(),
  prevHash: z.string().regex(/^[a-f0-9]{64}$/, 'PrevHash debe ser SHA-256 válido').nullable().optional(),
  sequenceNumber: z.number().int().positive().optional()
});

// Tipo inferido
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type AuditAction = z.infer<typeof AuditActionSchema>;
export type AuditResource = z.infer<typeof AuditResourceSchema>;

// Schema para creacion (sin ID y timestamp que se generan automaticamente)
export const CreateAuditLogSchema = AuditLogSchema.omit({
  id: true,
  timestamp: true
});

export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>;

// Schema para consultas/filtros
export const AuditLogFilterSchema = z.object({
  actorId: z.string().optional(),
  patientId: z.string().optional(),
  resource: AuditResourceSchema.optional(),
  action: AuditActionSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  success: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

export type AuditLogFilter = z.infer<typeof AuditLogFilterSchema>;

// Constantes para facilitar uso
export const AUDIT_ACTIONS = {
  // Acciones de lectura
  READ: 'read' as const,
  
  // Acciones de escritura
  CREATE: 'create' as const,
  UPDATE: 'update' as const,
  DELETE: 'delete' as const,
  
  // Acciones especiales
  EXPORT: 'export' as const,
  ACCESS_DENIED: 'access_denied' as const,
  LOGIN: 'login' as const,
  LOGOUT: 'logout' as const
} as const;

export const AUDIT_RESOURCES = {
  PATIENT: 'patient' as const,
  APPOINTMENT: 'appointment' as const,
  MEDICAL_RECORD: 'medical_record' as const,
  PRESCRIPTION: 'prescription' as const,
  LAB_RESULT: 'lab_result' as const,
  TELEMEDICINE_SESSION: 'telemedicine_session' as const,
  USER_PROFILE: 'user_profile' as const,
  BILLING: 'billing' as const,
  SYSTEM: 'system' as const
} as const;

// Helper para crear logs de auditoria
export const createAuditLogEntry = (data: CreateAuditLog): AuditLog => {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ...data
  };
};

// Validador para verificar si una accion requiere auditoria
export const requiresAudit = (resource: AuditResource, action: AuditAction): boolean => {
  // Según Ley 26.529, todos los accesos a historias clinicas deben ser auditados
  const medicalResources: AuditResource[] = [
    'patient',
    'appointment', 
    'medical_record',
    'prescription',
    'lab_result',
    'telemedicine_session'
  ];
  
  return medicalResources.includes(resource);
};

// Tipo para estadisticas de auditoria
export const AuditStatsSchema = z.object({
  totalEntries: z.number(),
  entriesByAction: z.record(z.number()),
  entriesByResource: z.record(z.number()),
  failedActions: z.number(),
  uniqueActors: z.number(),
  dateRange: z.object({
    start: z.date(),
    end: z.date()
  })
});

export type AuditStats = z.infer<typeof AuditStatsSchema>;