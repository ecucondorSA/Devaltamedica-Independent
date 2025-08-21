/**
 * 💊 PRESCRIPTION SERVICE - ALTAMEDICA
 * Servicio para la gestión de prescripciones médicas individuales.
 */
import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { BaseService, ServiceContext } from '@/lib/patterns/ServicePattern';
import { logger } from '@altamedica/shared/services/logger.service';
// Asumimos que puede haber un servicio optimizado para prescripciones también
// import { optimizedPrescriptionService } from './OptimizedPrescriptionService';

// Esquema de Zod para la validación de una prescripción.
export const PrescriptionSchema = z.object({
  patientId: z.string().min(1, "El ID del paciente es requerido."),
  doctorId: z.string().min(1, "El ID del doctor es requerido."),
  appointmentId: z.string().optional(),
  medications: z.array(z.object({
    name: z.string().min(1, "El nombre del medicamento es requerido."),
    dosage: z.string().min(1, "La dosis es requerida."),
    frequency: z.string().min(1, "La frecuencia es requerida."),
    duration: z.string().describe("Ej: 7 días, 3 meses, etc."),
    instructions: z.string().optional(),
  })).min(1, "Se debe prescribir al menos un medicamento."),
  issueDate: z.string().datetime("La fecha de emisión debe ser una fecha válida."),
  expirationDate: z.string().datetime("La fecha de expiración debe ser una fecha válida.").optional(),
  status: z.enum(['active', 'expired', 'cancelled']).default('active'),
  notes: z.string().optional(),
});

export interface Prescription extends z.infer<typeof PrescriptionSchema> {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  // Campos populados opcionales
  doctor?: any;
  patient?: any;
}

class PrescriptionService extends BaseService<Prescription> {
  protected collectionName = 'prescriptions';
  protected entitySchema = PrescriptionSchema;

  /**
   * Encuentra una prescripción por su ID.
   * Opcionalmente podría poblar datos del doctor y paciente.
   */
  async findById(id: string, context: ServiceContext): Promise<Prescription | null> {
    const doc = await adminDb.collection(this.collectionName).doc(id).get();
    if (!doc.exists) {
      return null;
    }

    const prescription = { id: doc.id, ...doc.data() } as Prescription;

    // Lógica de permisos
    if (context.userRole !== 'admin' && prescription.patientId !== context.userId && prescription.doctorId !== context.userId) {
      logger.warn(`Acceso no autorizado intentado por ${context.userId} a la prescripción ${id}`);
      return null;
    }
    
    // TODO: Implementar batching para poblar doctor y paciente si es necesario,
    // similar a OptimizedMedicalRecordService.
    
    return prescription;
  }

  /**
   * Actualiza una prescripción.
   */
  async update(id: string, data: Partial<Prescription>, context: ServiceContext): Promise<Prescription> {
    const validatedData = this.validateUpdate(data);

    const docRef = adminDb.collection(this.collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('NOT_FOUND');
    }
    
    // Lógica de permisos
    if (context.userRole !== 'admin' && doc.data()?.doctorId !== context.userId) {
        throw new Error('FORBIDDEN');
    }

    const updatePayload = {
      ...validatedData,
      updatedAt: new Date(),
      updatedBy: context.userId,
    };

    await docRef.update(updatePayload);
    await this.logAction('update', id, context, { updatedFields: Object.keys(validatedData) });

    return (await this.findById(id, context))!;
  }

  /**
   * Elimina una prescripción (borrado lógico, la cancela).
   */
  async delete(id: string, context: ServiceContext): Promise<boolean> {
    const docRef = adminDb.collection(this.collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return false;
    }

    // Lógica de permisos
    if (context.userRole !== 'admin' && doc.data()?.doctorId !== context.userId) {
        throw new Error('FORBIDDEN');
    }

    await docRef.update({
      status: 'cancelled',
      updatedAt: new Date(),
      updatedBy: context.userId,
    });

    await this.logAction('delete', id, context, { reason: 'cancelled' });
    return true;
  }

  // Implementación de los métodos `create` y `findMany`.
  async create(data: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>, context: ServiceContext): Promise<Prescription> {
    // Solo los doctores pueden crear recetas.
    if (context.userRole !== 'doctor') {
        throw new Error('FORBIDDEN');
    }
    
    const validatedData = this.validateCreate(data);

    const newPrescription = {
      ...validatedData,
      createdBy: context.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection(this.collectionName).add(newPrescription);
    
    await this.logAction('create', docRef.id, context);

    return { id: docRef.id, ...newPrescription } as Prescription;
  }

  async findMany(options: any, context: ServiceContext): Promise<any> {
    const { page = 1, limit = 20, filters = {} } = this.buildQuery(options);
    
    let query = adminDb.collection(this.collectionName).orderBy('issueDate', 'desc');

    // Lógica de permisos: los pacientes solo ven sus recetas, los doctores las suyas y los admins todo.
    if (context.userRole === 'patient') {
        query = query.where('patientId', '==', context.userId);
    } else if (context.userRole === 'doctor') {
        query = query.where('doctorId', '==', context.userId);
    }
    
    // Aplicar filtros adicionales
    if (filters.patientId && context.userRole !== 'patient') {
      query = query.where('patientId', '==', filters.patientId);
    }
     if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    const dataSnapshot = await query.limit(limit).offset((page - 1) * limit).get();
    const data = dataSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      data,
      total,
      page,
      limit,
      hasNext: (page * limit) < total,
      hasPrev: page > 1,
    };
  }
}

export const prescriptionService = new PrescriptionService();
