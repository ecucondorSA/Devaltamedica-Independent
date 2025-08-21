/**
 * 👨‍⚕️ DOCTOR REPOSITORY - ALTAMEDICA
 * Repository especializado para gestión de doctores con funcionalidades médicas
 * específicas y validaciones profesionales
 */

import { dbConnection } from '../core/DatabaseConnection';
import { DoctorSchema } from '../schemas/user-schemas';
import { BaseEntity, BaseRepository, RepositoryResult, ServiceContext } from './BaseRepository';

// Doctor entity interface que extiende BaseEntity
export interface Doctor extends BaseEntity {
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  role: 'doctor';
  licenseNumber: string;
  specialty: string[];
  subSpecialty?: string[];
  medicalSchool: string;
  graduationYear: number;
  yearsOfExperience: number;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: Date;
    expiryDate?: Date;
    certificateNumber?: string;
  }>;
  workplaces: Array<{
    hospitalId?: string;
    name: string;
    position: string;
    department?: string;
    startDate: Date;
    endDate?: Date;
    isCurrentWorkplace: boolean;
  }>;
  consultationFee?: number;
  availableSchedule: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  telemedicineEnabled: boolean;
  emergencyConsultations: boolean;
  acceptsNewPatients: boolean;
  rating?: number;
  reviewCount: number;
  totalConsultations: number;
  professionalSummary?: string;
  awards: Array<{
    title: string;
    organization: string;
    year: number;
    description?: string;
  }>;
  publications: Array<{
    title: string;
    journal: string;
    year: number;
    doi?: string;
    url?: string;
  }>;
  isVerified: boolean;
  verificationDate?: Date;
  status: 'pending' | 'active' | 'suspended' | 'inactive';
}

export class DoctorRepository extends BaseRepository<Doctor> {
  protected collectionName = 'doctors';
  protected entitySchema = DoctorSchema;

  /**
   * Buscar doctores por especialidad
   */
  async findBySpecialty(specialty: string, context: ServiceContext): Promise<RepositoryResult<Doctor>> {
    const startTime = Date.now();
    const db = await this.ensureFirestore();
    
    try {
      const query = db.collection(this.collectionName)
        .where('specialty', 'array-contains', specialty)
        .where('status', '==', 'active')
        .where('isVerified', '==', true);

      const snapshot = await query.get();
      const doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));

      await this.logAudit('read_by_specialty', 'collection', context, { specialty, count: doctors.length });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findBySpecialty_${this.collectionName}`, duration, true);

      return { data: doctors, total: doctors.length, hasMore: false };
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findBySpecialty_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Buscar doctores por licencia médica
   */
  async findByLicenseNumber(licenseNumber: string, context: ServiceContext): Promise<Doctor | null> {
    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const query = db.collection(this.collectionName)
        .where('licenseNumber', '==', licenseNumber)
        .limit(1);

      const snapshot = await query.get();
      if (snapshot.empty) {
        const duration = Date.now() - startTime;
        dbConnection.recordQuery(`findByLicense_${this.collectionName}`, duration, true);
        return null;
      }

      const doctor = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Doctor;
      await this.logAudit('read_by_license', doctor.id, context, { licenseNumber });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByLicense_${this.collectionName}`, duration, true);
      return doctor;
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findByLicense_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Buscar doctores disponibles para telemedicina
   */
  async findTelemedicineEnabled(context: ServiceContext): Promise<RepositoryResult<Doctor>> {
    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      const query = db.collection(this.collectionName)
        .where('telemedicineEnabled', '==', true)
        .where('status', '==', 'active')
        .where('isVerified', '==', true)
        .where('acceptsNewPatients', '==', true);

      const snapshot = await query.get();
      const doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));

      await this.logAudit('read_telemedicine_enabled', 'collection', context, { count: doctors.length });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findTelemedicine_${this.collectionName}`, duration, true);
      return { data: doctors, total: doctors.length, hasMore: false };
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`findTelemedicine_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Actualizar rating y estadísticas del doctor
   */
  async updateRating(doctorId: string, newRating: number, context: ServiceContext): Promise<Doctor | null> {
    const doctor = await this.findById(doctorId, context);
    if (!doctor) return null;

    const currentRating = doctor.rating || 0;
    const currentReviewCount = doctor.reviewCount || 0;

    const newReviewCount = currentReviewCount + 1;
    const newAverageRating = ((currentRating * currentReviewCount) + newRating) / newReviewCount;

    const result = await this.update(doctorId, {
      rating: Math.round(newAverageRating * 100) / 100,
      reviewCount: newReviewCount
    }, context);

    await this.logAudit('update_rating', doctorId, context, {
      oldRating: currentRating,
      newRating: newAverageRating,
      reviewCount: newReviewCount
    });

    return result;
  }

  /**
   * Verificar doctor
   */
  async verifyDoctor(doctorId: string, context: ServiceContext): Promise<Doctor | null> {
    const result = await this.update(doctorId, {
      isVerified: true,
      verificationDate: new Date(),
      status: 'active',
      updatedAt: new Date()
    } as any, context);

    await this.logAudit('doctor_verified', doctorId, context);
    return result;
  }

  /**
   * Suspender doctor
   */
  async suspendDoctor(doctorId: string, reason: string, context: ServiceContext): Promise<Doctor | null> {
    const result = await this.update(doctorId, {
      status: 'suspended',
      updatedAt: new Date()
    } as any, context);

    await this.logAudit('doctor_suspended', doctorId, context, { reason });
    return result;
  }

  /**
   * Buscar doctores con filtros avanzados
   */
  async searchDoctors(filters: {
    specialty?: string;
    location?: string;
    telemedicineEnabled?: boolean;
    acceptsNewPatients?: boolean;
    minRating?: number;
    maxConsultationFee?: number;
    availability?: { dayOfWeek: number; time: string };
  }, context: ServiceContext): Promise<RepositoryResult<Doctor>> {
    const startTime = Date.now();
    const db = await this.ensureFirestore();

    try {
      let query = db.collection(this.collectionName)
        .where('status', '==', 'active')
        .where('isVerified', '==', true);

      if (filters.specialty) {
        query = query.where('specialty', 'array-contains', filters.specialty);
      }
      if (filters.telemedicineEnabled !== undefined) {
        query = query.where('telemedicineEnabled', '==', filters.telemedicineEnabled);
      }
      if (filters.acceptsNewPatients !== undefined) {
        query = query.where('acceptsNewPatients', '==', filters.acceptsNewPatients);
      }

      const snapshot = await query.get();
      let doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));

      if (filters.minRating) {
        doctors = doctors.filter(doc => (doc.rating || 0) >= (filters.minRating as number));
      }
      if (filters.maxConsultationFee) {
        doctors = doctors.filter(doc => !doc.consultationFee || doc.consultationFee <= (filters.maxConsultationFee as number));
      }

      await this.logAudit('search_doctors', 'collection', context, { filters, count: doctors.length });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`search_${this.collectionName}`, duration, true);
      return { data: doctors, total: doctors.length, hasMore: false };
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery(`search_${this.collectionName}`, duration, false);
      throw error;
    }
  }

  /**
   * Incrementar contador de consultas
   */
  async incrementConsultationCount(doctorId: string, context: ServiceContext): Promise<Doctor | null> {
    const doctor = await this.findById(doctorId, context);
    if (!doctor) return null;

    const result = await this.update(doctorId, {
      totalConsultations: (doctor.totalConsultations || 0) + 1
    }, context);

    await this.logAudit('increment_consultations', doctorId, context);
    return result;
  }
}

// Instancia singleton del repository
export const doctorRepository = new DoctorRepository();