import { adminDb } from '@/shared/lib/firebase-admin';
import { ServiceContext } from '@/shared/lib/patterns/ServicePattern';
import { sanitizeInput } from '../../middleware/hipaa-audit.middleware';
import { CreatePatientSchema, Patient, PatientQueryOptions, PatientStats, UpdatePatientSchema } from './patient.types';

import { logger } from '@altamedica/shared/services/logger.service';
export class PatientService {
  private static collectionName = 'patients';

  static async getAllPatients(options: PatientQueryOptions = {}, context?: ServiceContext): Promise<Patient[]> {
    try {
      let query = adminDb.collection(this.collectionName);

      // Sanitizar y blindar parámetros de consulta
      const safeSearch = options.search
        ? (sanitizeInput(options.search) as string).replace(/[^a-zA-Z0-9\s-]/g, '').trim()
        : undefined;
      const allowedSortFields = new Set(['createdAt', 'lastName', 'firstName']);
      const sortBy = allowedSortFields.has((options.sortBy as string) || '')
        ? (options.sortBy as string)
        : 'createdAt';
      const sortOrder: 'asc' | 'desc' = (options.sortOrder === 'asc' || options.sortOrder === 'desc')
        ? options.sortOrder
        : 'desc';

      // Filtrar por doctor si se proporciona
      if (options.doctorId) {
        query = query.where('assignedDoctor', '==', sanitizeInput(options.doctorId));
      }

      // Búsqueda por nombre (simplificada)
      if (safeSearch) {
        // En un caso real, podrías usar Algolia o similar para búsqueda compleja
        query = query.where('firstName', '>=', safeSearch)
                    .where('firstName', '<=', safeSearch + '\uf8ff');
      }

      // Ordenamiento
      query = query.orderBy(sortBy, sortOrder);

      // Paginación
      const limit = options.limit || 50;
      query = query.limit(limit);

      if (options.page && options.page > 1) {
        const offset = (options.page - 1) * limit;
        // Para paginación real necesitarías usar cursor-based pagination
        // query = query.offset(offset); // Firestore no soporta offset
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => this.mapDocToPatient(doc));
    } catch (error) {
      logger.error('Error obteniendo pacientes:', undefined, error);
      throw new Error('Error al obtener pacientes');
    }
  }

  static async getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
    try {
      const snapshot = await adminDb.collection(this.collectionName)
        .where('assignedDoctor', '==', doctorId)
        .where('isActive', '==', true)
        .orderBy('lastName')
        .get();

      return snapshot.docs.map(doc => this.mapDocToPatient(doc));
    } catch (error) {
      logger.error('Error obteniendo pacientes por doctor:', undefined, error);
      throw new Error('Error al obtener pacientes del doctor');
    }
  }

  static async getPatientById(patientId: string, context?: ServiceContext): Promise<Patient | null> {
    try {
      const doc = await adminDb.collection(this.collectionName).doc(patientId).get();
      
      if (!doc.exists) {
        return null;
      }

      return this.mapDocToPatient(doc);
    } catch (error) {
      logger.error('Error obteniendo paciente:', undefined, error);
      throw new Error('Error al obtener paciente');
    }
  }

  static async createPatient(data: any, context?: ServiceContext): Promise<Patient> {
    try {
      // Validar datos de entrada
      const validatedData = CreatePatientSchema.parse(data);

      const patientData = {
        ...validatedData,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: context?.userId
      };

      const docRef = await adminDb.collection(this.collectionName).add(patientData);
      
      return {
        id: docRef.id,
        ...patientData
      } as Patient;
    } catch (error) {
      logger.error('Error creando paciente:', undefined, error);
      if (error.name === 'ZodError') {
        throw new Error('Datos de paciente inválidos');
      }
      throw new Error('Error al crear paciente');
    }
  }

  static async updatePatient(patientId: string, data: any, context?: ServiceContext): Promise<Patient> {
    try {
      // Validar datos de entrada
      const validatedData = UpdatePatientSchema.parse(data);

      const updateData = {
        ...validatedData,
        updatedAt: new Date(),
        updatedBy: context?.userId
      };

      // Si se proporciona dateOfBirth, convertirlo a Date
      if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
      }

      await adminDb.collection(this.collectionName).doc(patientId).update(updateData);

      // Obtener el paciente actualizado
      const updatedDoc = await adminDb.collection(this.collectionName).doc(patientId).get();
      
      if (!updatedDoc.exists) {
        throw new Error('Paciente no encontrado después de actualizar');
      }

      return this.mapDocToPatient(updatedDoc);
    } catch (error) {
      logger.error('Error actualizando paciente:', undefined, error);
      if (error.name === 'ZodError') {
        throw new Error('Datos de actualización inválidos');
      }
      throw new Error('Error al actualizar paciente');
    }
  }

  static async deletePatient(patientId: string, context?: ServiceContext): Promise<void> {
    try {
      // Soft delete - marcar como inactivo
      await adminDb.collection(this.collectionName).doc(patientId).update({
        isActive: false,
        deletedAt: new Date(),
        deletedBy: context?.userId
      });
    } catch (error) {
      logger.error('Error eliminando paciente:', undefined, error);
      throw new Error('Error al eliminar paciente');
    }
  }

  static async assignDoctor(patientId: string, doctorId: string, context?: ServiceContext): Promise<void> {
    try {
      await adminDb.collection(this.collectionName).doc(patientId).update({
        assignedDoctor: doctorId,
        updatedAt: new Date(),
        updatedBy: context?.userId
      });
    } catch (error) {
      logger.error('Error asignando doctor:', undefined, error);
      throw new Error('Error al asignar doctor');
    }
  }

  static async getPatientStats(doctorId?: string): Promise<PatientStats> {
    try {
      let query = adminDb.collection(this.collectionName);

      if (doctorId) {
        query = query.where('assignedDoctor', '==', doctorId);
      }

      const snapshot = await query.get();
      const patients = snapshot.docs.map(doc => doc.data());

      const totalPatients = patients.length;
      const activePatients = patients.filter(p => p.isActive).length;

      // Pacientes registrados en los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRegistrations = patients.filter(p => 
        p.createdAt && p.createdAt.toDate() > thirtyDaysAgo
      ).length;

      // Calcular edad promedio
      const currentYear = new Date().getFullYear();
      const ages = patients
        .filter(p => p.dateOfBirth)
        .map(p => currentYear - p.dateOfBirth.toDate().getFullYear());
      const avgAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;

      return {
        totalPatients,
        activePatients,
        recentRegistrations,
        avgAge: Math.round(avgAge)
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de pacientes:', undefined, error);
      throw new Error('Error al obtener estadísticas');
    }
  }

  private static mapDocToPatient(doc: any): Patient {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
      phoneNumber: data.phoneNumber,
      address: data.address,
      emergencyContact: data.emergencyContact,
      insuranceInfo: data.insuranceInfo,
      medicalHistory: data.medicalHistory || [],
      assignedDoctor: data.assignedDoctor,
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  }
}