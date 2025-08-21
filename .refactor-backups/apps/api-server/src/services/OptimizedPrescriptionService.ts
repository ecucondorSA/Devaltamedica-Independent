/**
 * 💊 OPTIMIZED PRESCRIPTION SERVICE - ALTAMEDICA
 * Servicio optimizado que resuelve N+1 queries
 * CORREGIDO: Batch queries para obtener datos relacionados
 */

import { adminDb } from '@/lib/firebase-admin';
import { z } from 'zod';
import { BaseService, ServiceContext, QueryOptions, ServiceResponse } from '@/lib/patterns/ServicePattern';

import { logger } from '@altamedica/shared/services/logger.service';
// Prescription entity optimized
export interface OptimizedPrescription {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  medicalRecordId?: string;
  medications: Array<{
    name: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity: number;
    refills: number;
    isControlled: boolean;
  }>;
  diagnosis?: string;
  instructions?: string;
  duration: string;
  priority: 'normal' | 'urgent';
  notes?: string;
  allowGeneric: boolean;
  status: 'pending' | 'filled' | 'cancelled' | 'expired';
  prescriptionNumber: string;
  expirationDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  filledAt?: Date;
  filledBy?: string;
  
  // Populated fields (OPTIMIZED: loaded in batch)
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    specialties?: string[];
    licenseNumber?: string;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    allergies?: string[];
  };
  appointment?: {
    id: string;
    scheduledAt: Date;
    type: string;
  };
}

export class OptimizedPrescriptionService {
  private collectionName = 'prescriptions';

  /**
   * OPTIMIZED: Get prescriptions with related data in batch queries
   * Solves N+1 query problem by fetching all related entities at once
   */
  async findManyOptimized(
    options: QueryOptions,
    context: ServiceContext
  ): Promise<ServiceResponse<OptimizedPrescription[]>> {
    
    const { page = 1, limit = 20, filters = {} } = options;
    const offset = (page - 1) * limit;

    try {
      // 1. First query: Get prescriptions
      let prescriptionsQuery: any = adminDb.collection(this.collectionName);

      // Apply filters
      if (filters.patientId) {
        prescriptionsQuery = prescriptionsQuery.where('patientId', '==', filters.patientId);
      }
      if (filters.doctorId) {
        prescriptionsQuery = prescriptionsQuery.where('doctorId', '==', filters.doctorId);
      }
      if (filters.status && filters.status !== 'all') {
        prescriptionsQuery = prescriptionsQuery.where('status', '==', filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        prescriptionsQuery = prescriptionsQuery.where('priority', '==', filters.priority);
      }

      // Apply date filters
      if (filters.startDate) {
        prescriptionsQuery = prescriptionsQuery.where('createdAt', '>=', new Date(filters.startDate));
      }
      if (filters.endDate) {
        prescriptionsQuery = prescriptionsQuery.where('createdAt', '<=', new Date(filters.endDate));
      }

      // Order and paginate
      prescriptionsQuery = prescriptionsQuery
        .orderBy('createdAt', 'desc')
        .offset(offset)
        .limit(limit);

      const prescriptionsSnapshot = await prescriptionsQuery.get();

      if (prescriptionsSnapshot.empty) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          hasNext: false,
          hasPrev: false
        };
      }

      // Extract prescriptions data
      const prescriptions = prescriptionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate() || doc.data().updatedAt,
        expirationDate: doc.data().expirationDate?.toDate() || doc.data().expirationDate,
        filledAt: doc.data().filledAt?.toDate() || doc.data().filledAt,
      })) as OptimizedPrescription[];

      // 2. OPTIMIZATION: Batch fetch related entities
      const doctorIds = [...new Set(prescriptions.map(p => p.doctorId))];
      const patientIds = [...new Set(prescriptions.map(p => p.patientId))];
      const appointmentIds = [...new Set(prescriptions.map(p => p.appointmentId).filter(Boolean))];

      // Batch queries to resolve N+1 problem
      const [doctorsData, patientsData, appointmentsData] = await Promise.all([
        this.batchFetchUsers(doctorIds),
        this.batchFetchUsers(patientIds),
        this.batchFetchAppointments(appointmentIds)
      ]);

      // 3. Map related data to prescriptions
      const optimizedPrescriptions = prescriptions.map(prescription => ({
        ...prescription,
        doctor: doctorsData.get(prescription.doctorId),
        patient: patientsData.get(prescription.patientId),
        appointment: prescription.appointmentId ? appointmentsData.get(prescription.appointmentId) : undefined
      }));

      // 4. Get total count for pagination (separate optimized query)
      const totalCount = await this.getTotalCount(filters);

      return {
        data: optimizedPrescriptions,
        total: totalCount,
        page,
        limit,
        hasNext: offset + limit < totalCount,
        hasPrev: page > 1
      };

    } catch (error) {
      logger.error('Error in optimized prescription query:', undefined, error);
      throw error;
    }
  }

  /**
   * OPTIMIZATION: Batch fetch users (doctors/patients) to avoid N+1 queries
   */
  private async batchFetchUsers(userIds: string[]): Promise<Map<string, any>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const usersMap = new Map();

    try {
      // Firestore 'in' queries are limited to 10 items, so we batch them
      const batches = this.chunkArray(userIds, 10);
      
      for (const batch of batches) {
        const usersSnapshot = await adminDb.collection('users')
          .where('__name__', 'in', batch.map(id => adminDb.collection('users').doc(id)))
          .get();

        for (const doc of usersSnapshot.docs) {
          const userData = doc.data();
          usersMap.set(doc.id, {
            id: doc.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            specialties: userData.specialties,
            licenseNumber: userData.licenseNumber,
            dateOfBirth: userData.dateOfBirth,
            allergies: userData.allergies
          });
        }
      }
    } catch (error) {
      logger.error('Error batch fetching users:', undefined, error);
    }

    return usersMap;
  }

  /**
   * OPTIMIZATION: Batch fetch appointments to avoid N+1 queries
   */
  private async batchFetchAppointments(appointmentIds: string[]): Promise<Map<string, any>> {
    if (appointmentIds.length === 0) {
      return new Map();
    }

    const appointmentsMap = new Map();

    try {
      const batches = this.chunkArray(appointmentIds, 10);
      
      for (const batch of batches) {
        const appointmentsSnapshot = await adminDb.collection('appointments')
          .where('__name__', 'in', batch.map(id => adminDb.collection('appointments').doc(id)))
          .get();

        for (const doc of appointmentsSnapshot.docs) {
          const appointmentData = doc.data();
          appointmentsMap.set(doc.id, {
            id: doc.id,
            scheduledAt: appointmentData.scheduledAt?.toDate() || appointmentData.scheduledAt,
            type: appointmentData.type
          });
        }
      }
    } catch (error) {
      logger.error('Error batch fetching appointments:', undefined, error);
    }

    return appointmentsMap;
  }

  /**
   * OPTIMIZATION: Get total count with optimized query
   */
  private async getTotalCount(filters: Record<string, any>): Promise<number> {
    try {
      let countQuery: any = adminDb.collection(this.collectionName);

      // Apply same filters as main query
      if (filters.patientId) {
        countQuery = countQuery.where('patientId', '==', filters.patientId);
      }
      if (filters.doctorId) {
        countQuery = countQuery.where('doctorId', '==', filters.doctorId);
      }
      if (filters.status && filters.status !== 'all') {
        countQuery = countQuery.where('status', '==', filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        countQuery = countQuery.where('priority', '==', filters.priority);
      }
      if (filters.startDate) {
        countQuery = countQuery.where('createdAt', '>=', new Date(filters.startDate));
      }
      if (filters.endDate) {
        countQuery = countQuery.where('createdAt', '<=', new Date(filters.endDate));
      }

      const countSnapshot = await countQuery.get();
      return countSnapshot.size;
    } catch (error) {
      logger.error('Error getting prescription count:', undefined, error);
      return 0;
    }
  }

  /**
   * Helper: Split array into chunks for batch processing
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * OPTIMIZATION: Get single prescription with related data
   */
  async findByIdOptimized(id: string, context: ServiceContext): Promise<OptimizedPrescription | null> {
    try {
      const prescriptionDoc = await adminDb.collection(this.collectionName).doc(id).get();
      
      if (!prescriptionDoc.exists) {
        return null;
      }

      const prescriptionData = {
        id: prescriptionDoc.id,
        ...prescriptionDoc.data(),
        createdAt: prescriptionDoc.data()!.createdAt?.toDate() || prescriptionDoc.data()!.createdAt,
        updatedAt: prescriptionDoc.data()!.updatedAt?.toDate() || prescriptionDoc.data()!.updatedAt,
        expirationDate: prescriptionDoc.data()!.expirationDate?.toDate() || prescriptionDoc.data()!.expirationDate,
        filledAt: prescriptionDoc.data()!.filledAt?.toDate() || prescriptionDoc.data()!.filledAt,
      } as OptimizedPrescription;

      // Batch fetch related data
      const [doctorsData, patientsData, appointmentsData] = await Promise.all([
        this.batchFetchUsers([prescriptionData.doctorId]),
        this.batchFetchUsers([prescriptionData.patientId]),
        prescriptionData.appointmentId ? 
          this.batchFetchAppointments([prescriptionData.appointmentId]) : 
          Promise.resolve(new Map())
      ]);

      return {
        ...prescriptionData,
        doctor: doctorsData.get(prescriptionData.doctorId),
        patient: patientsData.get(prescriptionData.patientId),
        appointment: prescriptionData.appointmentId ? 
          appointmentsData.get(prescriptionData.appointmentId) : 
          undefined
      };

    } catch (error) {
      logger.error('Error finding prescription by ID:', undefined, error);
      throw error;
    }
  }
}