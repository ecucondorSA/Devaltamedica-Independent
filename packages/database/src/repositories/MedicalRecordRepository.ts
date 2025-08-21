/**
 * 🏥 MEDICAL RECORD REPOSITORY - ALTAMEDICA
 * Repository especializado para historiales médicos con validaciones específicas
 * y optimizaciones para consultas médicas frecuentes
 */

import { BaseRepository, BaseEntity, ServiceContext, QueryOptions, RepositoryResult } from './BaseRepository.js';
import { z } from 'zod';
import { dbConnection } from '../core/DatabaseConnection.js';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// Schema Zod para Medical Record migrado desde el API server
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
    instructions: z.string().optional()
  })).optional().default([]),
  testResults: z.array(z.object({
    testName: z.string(),
    result: z.string(),
    normalRange: z.string().optional(),
    notes: z.string().optional(),
    date: z.date().optional()
  })).optional().default([]),
  vitalSigns: z.object({
    bloodPressure: z.object({
      systolic: z.number(),
      diastolic: z.number()
    }).optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    weight: z.number().optional(),
    height: z.number().optional()
  }).optional(),
  notes: z.string().optional(),
  isPrivate: z.boolean().default(false),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  recordNumber: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.date().optional(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    url: z.string(),
    uploadedAt: z.date()
  })).optional().default([])
});

export interface MedicalRecord extends BaseEntity {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  type: 'consultation' | 'diagnosis' | 'treatment' | 'test_result' | 'prescription' | 'other';
  title: string;
  description: string;
  diagnosis?: string;
  symptoms: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration?: string;
    instructions?: string;
  }>;
  testResults: Array<{
    testName: string;
    result: string;
    normalRange?: string;
    notes?: string;
    date?: Date;
  }>;
  vitalSigns?: {
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  notes?: string;
  isPrivate: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  recordNumber?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: Date;
  }>;
}

export class MedicalRecordRepository extends BaseRepository<MedicalRecord> {
  protected collectionName = 'medical_records';
  protected entitySchema = MedicalRecordSchema;

  /**
   * Verifica permisos de acceso a un registro médico
   */
  private async checkAccessPermissions(recordId: string, context: ServiceContext): Promise<boolean> {
    try {
      const record = await super.findById(recordId, context);
      if (!record) return false;

      // Administradores tienen acceso completo
      if (context.userRole === 'admin') return true;

      // Doctores pueden acceder a sus propios registros
      if (context.userRole === 'doctor' && record.doctorId === context.userId) return true;

      // Pacientes pueden acceder a sus propios registros no privados
      if (context.userRole === 'patient' && record.patientId === context.userId && !record.isPrivate) return true;

      return false;
    } catch (error) {
      logger.error('Error checking access permissions:', error);
      return false;
    }
  }

  /**
   * Override findById con verificación de permisos
   */
  public async findById(id: string, context: ServiceContext): Promise<MedicalRecord | null> {
    const hasAccess = await this.checkAccessPermissions(id, context);
    if (!hasAccess) {
      await this.logAudit('access_denied', id, context);
      return null;
    }

    return super.findById(id, context);
  }

  /**
   * Encuentra registros médicos por paciente con permisos
   */
  public async findByPatientId(patientId: string, context: ServiceContext, options: QueryOptions = {}): Promise<RepositoryResult<MedicalRecord>> {
    // Verificar permisos
    const canAccess = 
      context.userRole === 'admin' ||
      (context.userRole === 'doctor') ||
      (context.userRole === 'patient' && context.userId === patientId);

    if (!canAccess) {
      await this.logAudit('access_denied', `patient:${patientId}`, context);
      return { data: [], total: 0, hasMore: false };
    }

    const filters: Record<string, any> = {
      ...options.filters,
      patientId
    };

    // Si es el propio paciente, excluir registros privados
    if (context.userRole === 'patient' && context.userId === patientId) {
      filters.isPrivate = false;
    }

    const queryOptions = {
      ...options,
      filters
    };

    return this.findMany(queryOptions, context);
  }

  /**
   * Encuentra registros médicos por doctor
   */
  public async findByDoctorId(doctorId: string, context: ServiceContext, options: QueryOptions = {}): Promise<RepositoryResult<MedicalRecord>> {
    // Solo doctores y admins pueden acceder
    if (context.userRole !== 'admin' && (context.userRole !== 'doctor' || context.userId !== doctorId)) {
      await this.logAudit('access_denied', `doctor:${doctorId}`, context);
      return { data: [], total: 0, hasMore: false };
    }

    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        doctorId
      }
    };

    return this.findMany(queryOptions, context);
  }

  /**
   * Busca registros por síntomas (para análisis de IA)
   */
  public async findBySymptoms(symptoms: string[], context: ServiceContext, options: QueryOptions = {}): Promise<RepositoryResult<MedicalRecord>> {
    // Solo doctores y admin pueden hacer búsquedas por síntomas
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      await this.logAudit('access_denied', 'symptoms_search', context);
      return { data: [], total: 0, hasMore: false };
    }

    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      // Buscar registros donde algún síntoma coincida
      let query = db.collection(this.collectionName);
      
      // Firestore requiere array-contains para búsquedas en arrays
      // Para múltiples síntomas, necesitamos hacer múltiples queries
      const promises = symptoms.map(symptom => 
        query.where('symptoms', 'array-contains', symptom)
          .where('status', '!=', 'archived')
          .limit(options.limit || 50)
          .get()
      );

      const snapshots = await Promise.all(promises);
      
      // Combinar y deduplicar resultados
      const docMap = new Map();
      snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          if (!docMap.has(doc.id)) {
            docMap.set(doc.id, this.documentToEntity(doc));
          }
        });
      });

      const data = Array.from(docMap.values());
      
      await this.logAudit('symptoms_search', 'collection', context, {
        symptoms,
        resultsCount: data.length
      });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findBySymptoms_${this.collectionName}`, duration, true);

      return {
        data: data.slice(0, options.limit || 50),
        total: data.length,
        hasMore: data.length > (options.limit || 50)
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findBySymptoms_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Encuentra registros urgentes que requieren atención
   */
  public async findUrgentRecords(context: ServiceContext, options: QueryOptions = {}): Promise<RepositoryResult<MedicalRecord>> {
    // Solo doctores y admin
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      return { data: [], total: 0, hasMore: false };
    }

    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        priority: 'urgent'
      },
      sortBy: 'createdAt',
      sortOrder: 'desc' as const
    };

    return this.findMany(queryOptions, context);
  }

  /**
   * Encuentra registros que requieren seguimiento
   */
  public async findFollowUpRequired(doctorId: string, context: ServiceContext, options: QueryOptions = {}): Promise<RepositoryResult<MedicalRecord>> {
    if (context.userRole !== 'admin' && (context.userRole !== 'doctor' || context.userId !== doctorId)) {
      return { data: [], total: 0, hasMore: false };
    }

    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        doctorId,
        followUpRequired: true
      },
      sortBy: 'followUpDate',
      sortOrder: 'asc' as const
    };

    return this.findMany(queryOptions, context);
  }

  /**
   * Crea un registro médico con validaciones adicionales
   */
  public async create(data: Omit<MedicalRecord, keyof BaseEntity>, context: ServiceContext): Promise<MedicalRecord> {
    // Solo doctores pueden crear registros médicos
    if (context.userRole !== 'doctor' && context.userRole !== 'admin') {
      throw new Error('FORBIDDEN: Only doctors can create medical records');
    }

    // Generar número de registro único si no se proporciona
    if (!data.recordNumber) {
      const timestamp = Date.now();
      (data as any).recordNumber = `MR-${timestamp}-${data.patientId.slice(-4)}`;
    }

    return super.create(data, context);
  }

  /**
   * Actualiza un registro médico con validaciones
   */
  public async update(id: string, data: Partial<Omit<MedicalRecord, keyof BaseEntity>>, context: ServiceContext): Promise<MedicalRecord | null> {
    const hasAccess = await this.checkAccessPermissions(id, context);
    if (!hasAccess) {
      throw new Error('FORBIDDEN: Insufficient permissions to update this record');
    }

    // Los pacientes no pueden actualizar ciertos campos
    if (context.userRole === 'patient') {
      const restrictedFields = ['diagnosis', 'medications', 'testResults', 'priority'];
      const hasRestrictedFields = Object.keys(data).some(key => restrictedFields.includes(key));
      
      if (hasRestrictedFields) {
        throw new Error('FORBIDDEN: Patients cannot update medical fields');
      }
    }

    return super.update(id, data, context);
  }

  /**
   * Obtiene estadísticas de registros médicos
   */
  public async getStatistics(context: ServiceContext): Promise<{
    totalRecords: number;
    urgentRecords: number;
    recordsByType: Record<string, number>;
    recordsByPriority: Record<string, number>;
  }> {
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      throw new Error('FORBIDDEN: Insufficient permissions');
    }

    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const [
        totalSnapshot,
        urgentSnapshot,
        typeSnapshot,
        prioritySnapshot
      ] = await Promise.all([
        db.collection(this.collectionName).where('status', '!=', 'archived').count().get(),
        db.collection(this.collectionName).where('priority', '==', 'urgent').count().get(),
        db.collection(this.collectionName).where('status', '!=', 'archived').get(),
        db.collection(this.collectionName).where('status', '!=', 'archived').get()
      ]);

      const recordsByType: Record<string, number> = {};
      const recordsByPriority: Record<string, number> = {};

      typeSnapshot.docs.forEach(doc => {
        const data = doc.data();
        recordsByType[data.type] = (recordsByType[data.type] || 0) + 1;
        recordsByPriority[data.priority] = (recordsByPriority[data.priority] || 0) + 1;
      });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`statistics_${this.collectionName}`, duration, true);

      return {
        totalRecords: totalSnapshot.data().count,
        urgentRecords: urgentSnapshot.data().count,
        recordsByType,
        recordsByPriority
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`statistics_${this.collectionName}`, duration, false);
      throw error;
    }
  }
}

// Instancia singleton para uso global
export const medicalRecordRepository = new MedicalRecordRepository();