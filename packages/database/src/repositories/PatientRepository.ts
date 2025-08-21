/**
 * 👤 PATIENT REPOSITORY - ALTAMEDICA
 * Repository especializado para gestión de pacientes con validaciones HIPAA
 * y funcionalidades específicas para datos médicos sensibles
 */

import { BaseRepository, BaseEntity, ServiceContext, QueryOptions, RepositoryResult } from './BaseRepository.js';
import { z } from 'zod';
import { dbConnection } from '../core/DatabaseConnection.js';

import { logger } from '@altamedica/shared/services/logger.service';
// Schema Zod para Patient migrado y mejorado
export const PatientSchema = z.object({
  userId: z.string().min(1, "El ID de usuario es requerido."),
  firstName: z.string().min(2, "El nombre es requerido."),
  lastName: z.string().min(2, "El apellido es requerido."),
  email: z.string().email("El email no es válido."),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().datetime("La fecha de nacimiento no es válida."),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('Mexico')
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phoneNumber: z.string(),
    email: z.string().email().optional()
  }).optional(),
  medicalInfo: z.object({
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    allergies: z.array(z.string()).default([]),
    chronicConditions: z.array(z.string()).default([]),
    currentMedications: z.array(z.object({
      name: z.string(),
      dosage: z.string(),
      frequency: z.string(),
      prescribedBy: z.string(),
      startDate: z.string().datetime()
    })).default([]),
    insuranceInfo: z.object({
      provider: z.string(),
      policyNumber: z.string(),
      groupNumber: z.string().optional()
    }).optional()
  }).optional(),
  preferences: z.object({
    language: z.string().default('es'),
    timezone: z.string().default('America/Mexico_City'),
    communicationPreferences: z.object({
      email: z.boolean().default(true),
      sms: z.boolean().default(true),
      push: z.boolean().default(true)
    }).default({})
  }).optional(),
  isActive: z.boolean().default(true),
  lastVisit: z.string().datetime().optional(),
  assignedDoctorId: z.string().optional(),
  patientNumber: z.string().optional()
});

export interface Patient extends BaseEntity {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    email?: string;
  };
  medicalInfo?: {
    bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    allergies: string[];
    chronicConditions: string[];
    currentMedications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      prescribedBy: string;
      startDate: Date;
    }>;
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      groupNumber?: string;
    };
  };
  preferences?: {
    language: string;
    timezone: string;
    communicationPreferences: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
  isActive: boolean;
  lastVisit?: Date;
  assignedDoctorId?: string;
  patientNumber?: string;
}

export class PatientRepository extends BaseRepository<Patient> {
  protected collectionName = 'patients';
  protected entitySchema = PatientSchema;

  /**
   * Verifica permisos de acceso a datos de paciente
   */
  private async checkPatientAccess(patientId: string, context: ServiceContext): Promise<boolean> {
    try {
      const patient = await super.findById(patientId, context);
      if (!patient) return false;

      // Administradores tienen acceso completo
      if (context.userRole === 'admin') return true;

      // Doctores pueden acceder a sus pacientes asignados
      if (context.userRole === 'doctor' && patient.assignedDoctorId === context.userId) return true;

      // El propio paciente puede acceder a sus datos
      if (context.userRole === 'patient' && patient.userId === context.userId) return true;

      // Doctores pueden acceder a pacientes con los que han tenido consultas
      if (context.userRole === 'doctor') {
        const hasConsultation = await this.hasConsultationWith(patientId, context.userId);
        return hasConsultation;
      }

      return false;
    } catch (error) {
      logger.error('Error checking patient access:', error);
      return false;
    }
  }

  /**
   * Verifica si un doctor ha tenido consultas con un paciente
   */
  private async hasConsultationWith(patientId: string, doctorId: string): Promise<boolean> {
    try {
      const db = await this.ensureFirestore();
      const consultationQuery = await db.collection('medical_records')
        .where('patientId', '==', patientId)
        .where('doctorId', '==', doctorId)
        .limit(1)
        .get();

      return !consultationQuery.empty;
    } catch (error) {
      logger.error('Error checking consultation history:', error);
      return false;
    }
  }

  /**
   * Override findById con verificación de permisos
   */
  public async findById(id: string, context: ServiceContext): Promise<Patient | null> {
    const hasAccess = await this.checkPatientAccess(id, context);
    if (!hasAccess) {
      await this.logAudit('access_denied', id, context);
      return null;
    }

    return super.findById(id, context);
  }

  /**
   * Encuentra paciente por userId (ID de Firebase Auth)
   */
  public async findByUserId(userId: string, context: ServiceContext): Promise<Patient | null> {
    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const query = db.collection(this.collectionName)
        .where('userId', '==', userId)
        .where('status', '!=', 'archived')
        .limit(1);

      const snapshot = await query.get();

      if (snapshot.empty) {
        const duration = Date.now() - startTime;
        dbConnection.recordQuery(`findByUserId_${this.collectionName}`, duration, true);
        return null;
      }

      const patient = this.documentToEntity(snapshot.docs[0]);

      // Verificar permisos
      const hasAccess = await this.checkPatientAccess(patient.id, context);
      if (!hasAccess) {
        await this.logAudit('access_denied', patient.id, context);
        return null;
      }

      await this.logAudit('read', patient.id, context);

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByUserId_${this.collectionName}`, duration, true);

      return patient;
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByUserId_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Encuentra pacientes asignados a un doctor
   */
  public async findByDoctorId(doctorId: string, context: ServiceContext, options: QueryOptions = {}): Promise<RepositoryResult<Patient>> {
    // Solo doctores y admins pueden acceder
    if (context.userRole !== 'admin' && (context.userRole !== 'doctor' || context.userId !== doctorId)) {
      await this.logAudit('access_denied', `doctor:${doctorId}`, context);
      return { data: [], total: 0, hasMore: false };
    }

    const queryOptions = {
      ...options,
      filters: {
        ...options.filters,
        assignedDoctorId: doctorId,
        isActive: true
      }
    };

    return this.findMany(queryOptions, context);
  }

  /**
   * Busca pacientes por criterios médicos (para emergencias)
   */
  public async findByMedicalCriteria(criteria: {
    bloodType?: string;
    allergies?: string[];
    chronicConditions?: string[];
  }, context: ServiceContext, options: QueryOptions = {}): Promise<RepositoryResult<Patient>> {
    // Solo personal médico puede hacer búsquedas por criterios médicos
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      await this.logAudit('access_denied', 'medical_criteria_search', context);
      return { data: [], total: 0, hasMore: false };
    }

    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      let query = db.collection(this.collectionName)
        .where('status', '!=', 'archived')
        .where('isActive', '==', true);

      // Aplicar filtros médicos
      if (criteria.bloodType) {
        query = query.where('medicalInfo.bloodType', '==', criteria.bloodType);
      }

      const snapshot = await query.get();
      let patients = snapshot.docs.map(doc => this.documentToEntity(doc));

      // Filtrar por alergias o condiciones crónicas (requiere filtrado en memoria)
      if (criteria.allergies && criteria.allergies.length > 0) {
        patients = patients.filter(patient => 
          patient.medicalInfo?.allergies.some(allergy => 
            criteria.allergies!.includes(allergy)
          )
        );
      }

      if (criteria.chronicConditions && criteria.chronicConditions.length > 0) {
        patients = patients.filter(patient => 
          patient.medicalInfo?.chronicConditions.some(condition => 
            criteria.chronicConditions!.includes(condition)
          )
        );
      }

      await this.logAudit('medical_criteria_search', 'collection', context, {
        criteria,
        resultsCount: patients.length
      });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByMedicalCriteria_${this.collectionName}`, duration, true);

      // Aplicar paginación
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const paginatedData = patients.slice(offset, offset + limit);

      return {
        data: paginatedData,
        total: patients.length,
        hasMore: patients.length > offset + limit
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByMedicalCriteria_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Busca pacientes por email (para verificación de duplicados)
   */
  public async findByEmail(email: string, context: ServiceContext): Promise<Patient | null> {
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      return null;
    }

    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const query = db.collection(this.collectionName)
        .where('email', '==', email.toLowerCase())
        .where('status', '!=', 'archived')
        .limit(1);

      const snapshot = await query.get();

      if (snapshot.empty) {
        const duration = Date.now() - startTime;
        dbConnection.recordQuery(`findByEmail_${this.collectionName}`, duration, true);
        return null;
      }

      const patient = this.documentToEntity(snapshot.docs[0]);

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByEmail_${this.collectionName}`, duration, true);

      return patient;
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByEmail_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Crea un nuevo paciente con validaciones adicionales
   */
  public async create(data: Omit<Patient, keyof BaseEntity>, context: ServiceContext): Promise<Patient> {
    // Verificar si el email ya existe
    const existingPatient = await this.findByEmail(data.email, context);
    if (existingPatient) {
      throw new Error('DUPLICATE_EMAIL: A patient with this email already exists');
    }

    // Generar número de paciente único si no se proporciona
    if (!data.patientNumber) {
      const timestamp = Date.now();
      (data as any).patientNumber = `P-${timestamp.toString().slice(-6)}`;
    }

    // Normalizar email
    (data as any).email = data.email.toLowerCase();

    return super.create(data, context);
  }

  /**
   * Actualiza información del paciente con validaciones
   */
  public async update(id: string, data: Partial<Omit<Patient, keyof BaseEntity>>, context: ServiceContext): Promise<Patient | null> {
    const hasAccess = await this.checkPatientAccess(id, context);
    if (!hasAccess) {
      throw new Error('FORBIDDEN: Insufficient permissions to update this patient');
    }

    // Normalizar email si se está actualizando
    if (data.email) {
      (data as any).email = data.email.toLowerCase();
      
      // Verificar duplicados
      const existingPatient = await this.findByEmail(data.email, context);
      if (existingPatient && existingPatient.id !== id) {
        throw new Error('DUPLICATE_EMAIL: Another patient with this email already exists');
      }
    }

    // Los pacientes no pueden actualizar cierta información médica crítica
    if (context.userRole === 'patient') {
      const restrictedFields = ['medicalInfo.bloodType', 'assignedDoctorId', 'patientNumber'];
      const hasRestrictedFields = Object.keys(data).some(key => restrictedFields.includes(key));
      
      if (hasRestrictedFields) {
        throw new Error('FORBIDDEN: Patients cannot update restricted medical fields');
      }
    }

    return super.update(id, data, context);
  }

  /**
   * Asigna un doctor a un paciente
   */
  public async assignDoctor(patientId: string, doctorId: string, context: ServiceContext): Promise<Patient | null> {
    // Solo admins y doctores pueden asignar
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      throw new Error('FORBIDDEN: Insufficient permissions to assign doctor');
    }

    return this.update(patientId, { assignedDoctorId: doctorId }, context);
  }

  /**
   * Actualiza la última visita del paciente
   */
  public async updateLastVisit(patientId: string, visitDate: Date, context: ServiceContext): Promise<Patient | null> {
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      throw new Error('FORBIDDEN: Only medical staff can update visit information');
    }

    return this.update(patientId, { lastVisit: visitDate }, context);
  }

  /**
   * Obtiene estadísticas de pacientes
   */
  public async getStatistics(context: ServiceContext): Promise<{
    totalPatients: number;
    activePatients: number;
    patientsByGender: Record<string, number>;
    patientsByBloodType: Record<string, number>;
    averageAge: number;
  }> {
    if (context.userRole !== 'admin' && context.userRole !== 'doctor') {
      throw new Error('FORBIDDEN: Insufficient permissions');
    }

    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const [totalSnapshot, activeSnapshot, allPatientsSnapshot] = await Promise.all([
        db.collection(this.collectionName).where('status', '!=', 'archived').count().get(),
        db.collection(this.collectionName).where('isActive', '==', true).count().get(),
        db.collection(this.collectionName).where('status', '!=', 'archived').get()
      ]);

      const patientsByGender: Record<string, number> = {};
      const patientsByBloodType: Record<string, number> = {};
      let totalAge = 0;
      let ageCount = 0;

      allPatientsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Contar por género
        if (data.gender) {
          patientsByGender[data.gender] = (patientsByGender[data.gender] || 0) + 1;
        }

        // Contar por tipo de sangre
        if (data.medicalInfo?.bloodType) {
          patientsByBloodType[data.medicalInfo.bloodType] = (patientsByBloodType[data.medicalInfo.bloodType] || 0) + 1;
        }

        // Calcular edad promedio
        if (data.dateOfBirth) {
          const birthDate = data.dateOfBirth.toDate();
          const age = new Date().getFullYear() - birthDate.getFullYear();
          totalAge += age;
          ageCount++;
        }
      });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`statistics_${this.collectionName}`, duration, true);

      return {
        totalPatients: totalSnapshot.data().count,
        activePatients: activeSnapshot.data().count,
        patientsByGender,
        patientsByBloodType,
        averageAge: ageCount > 0 ? Math.round(totalAge / ageCount) : 0
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`statistics_${this.collectionName}`, duration, false);
      throw error;
    }
  }
}

// Instancia singleton para uso global
export const patientRepository = new PatientRepository();