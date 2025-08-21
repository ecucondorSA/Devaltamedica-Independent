/**
 * 🏥 MEDICAL RECORD SERVICE - ALTAMEDICA
 * Servicio para la gestión de historias clínicas individuales.
 * Sigue el ServicePattern y se enfoca en operaciones CRUD para una sola entidad.
 */
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { BaseService, ServiceContext } from '@/lib/patterns/ServicePattern';
import { optimizedMedicalRecordService, OptimizedMedicalRecord } from './OptimizedMedicalRecordService';

import { logger } from '@altamedica/shared/services/logger.service';
// Esquema de Zod para la validación de una historia clínica.
// Se usa tanto para creación como para actualización (con .partial()).
export const MedicalRecordSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es requerido."),
  doctorId: z.string().min(1, "El ID del doctor es requerido."),
  appointmentId: z.string().optional(),
  type: z.enum(['consultation', 'diagnosis', 'treatment', 'test_result', 'prescription', 'other']),
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  diagnosis: z.string().optional(),
  symptoms: z.array(z.string()).optional().default([]),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string().optional(),
  })).optional().default([]),
  testResults: z.array(z.object({
    testName: z.string(),
    result: z.string(),
    normalRange: z.string().optional(),
    notes: z.string().optional(),
  })).optional().default([]),
  notes: z.string().optional(),
  isPrivate: z.boolean().default(false),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

// Extender la interfaz para incluir los campos de BaseEntity
export interface MedicalRecord extends z.infer<typeof MedicalRecordSchema> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  // Campos populados del servicio optimizado
  doctor?: any;
  patient?: any;
  appointment?: any;
  relatedRecords?: any[];
}

class MedicalRecordService extends BaseService<MedicalRecord> {
  protected collectionName = 'medical_records';
  protected entitySchema = MedicalRecordSchema;

  /**
   * Encuentra una historia clínica por su ID, utilizando el servicio optimizado
   * para poblar los datos relacionados de manera eficiente.
   */
  async findById(id: string, context: ServiceContext): Promise<MedicalRecord | null> {
    // Reutilizamos el servicio optimizado para garantizar la consistencia de los datos
    // y evitar la duplicación de la lógica de batching.
    const record = await optimizedMedicalRecordService.findByIdOptimized(id, context);
    
    if (!record) {
      return null;
    }

    // Aquí se puede añadir lógica de permisos específica si es necesario
    // Por ejemplo, verificar si el `context.userId` tiene permiso para ver este registro.
    if (context.userRole !== 'admin' && record.patientId !== context.userId && record.doctorId !== context.userId) {
        // En un caso real, podríamos lanzar un error de permiso.
        // Por ahora, devolvemos null como si no se encontrara.
        logger.warn(`Acceso no autorizado intentado por ${context.userId} al registro ${id}`);
        return null;
    }

    return record as MedicalRecord;
  }

  /**
   * Actualiza una historia clínica.
   */
  async update(id: string, data: Partial<MedicalRecord>, context: ServiceContext): Promise<MedicalRecord> {
    const validatedData = this.validateUpdate(data);

    const recordRef = adminDb.collection(this.collectionName).doc(id);
    const doc = await recordRef.get();

    if (!doc.exists) {
      throw new Error('NOT_FOUND');
    }
    
    // Lógica de permisos para actualizar
    const recordData = doc.data();
    if (context.userRole !== 'admin' && recordData?.doctorId !== context.userId) {
        throw new Error('FORBIDDEN');
    }

    const updatePayload = {
      ...validatedData,
      updatedAt: new Date(),
      updatedBy: context.userId,
    };

    await recordRef.update(updatePayload);
    await this.logAction('update', id, context, { updatedFields: Object.keys(validatedData) });

    // Devolvemos el registro actualizado y optimizado
    return (await this.findById(id, context))!;
  }

  /**
   * Elimina una historia clínica (borrado lógico).
   */
  async delete(id: string, context: ServiceContext): Promise<boolean> {
    const recordRef = adminDb.collection(this.collectionName).doc(id);
    const doc = await recordRef.get();

    if (!doc.exists) {
      return false; // O lanzar error si se prefiere
    }

    // Lógica de permisos para eliminar
    const recordData = doc.data();
    if (context.userRole !== 'admin' && recordData?.doctorId !== context.userId) {
        throw new Error('FORBIDDEN');
    }

    // Borrado lógico en lugar de físico
    await recordRef.update({
      status: 'archived',
      updatedAt: new Date(),
      updatedBy: context.userId,
    });

    await this.logAction('delete', id, context);
    return true;
  }

  // Implementación de los métodos `create` y `findMany`.
  async create(data: Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, context: ServiceContext): Promise<MedicalRecord> {
    // Solo los doctores pueden crear historias clínicas.
    if (context.userRole !== 'doctor') {
        throw new Error('FORBIDDEN');
    }
    
    const validatedData = this.validateCreate(data);

    const newRecord = {
      ...validatedData,
      createdBy: context.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      recordNumber: `MR-${Date.now()}`, // Generar un número de registro único
    };

    const docRef = await adminDb.collection(this.collectionName).add(newRecord);
    
    await this.logAction('create', docRef.id, context);

    return { id: docRef.id, ...newRecord } as MedicalRecord;
  }

  async findMany(options: any, context: ServiceContext): Promise<any> {
    // La lógica de permisos (quién puede ver qué) se maneja dentro del servicio optimizado.
    // Simplemente pasamos las opciones y el contexto.
    return optimizedMedicalRecordService.findManyOptimized(options, context);
  }
}

export const medicalRecordService = new MedicalRecordService();
