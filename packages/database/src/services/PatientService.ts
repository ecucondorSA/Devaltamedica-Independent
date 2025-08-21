/**
import { logger } from '@altamedica/shared/services/logger.service';

 * Patient Service - Centralized patient management
 * Migrated from @altamedica/medical-services
 */

import type { 
  Patient,
  MedicalHistory,
  InsuranceInfo,
  EmergencyContact
} from '@altamedica/types';

export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age?: number;
  lastVisit?: Date | string;
  status: 'active' | 'inactive' | 'pending';
}

export interface PatientSearchFilters {
  name?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'pending';
  doctorId?: string;
}

export interface PatientSearchOptions {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'date' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface PatientSearchResult {
  patients: PatientSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PatientStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  date: Date | string;
  time: string;
  type: 'consultation' | 'follow-up' | 'procedure' | 'emergency';
  reason: string;
  notes?: string;
}

export class PatientService {
  private isClient = false;
  private cache: Map<string, Patient> = new Map();

  constructor() {
    this.isClient = typeof window !== 'undefined';
  }

  /**
   * Get patients with optional filters
   */
  async getPatients(
    filters: PatientSearchFilters = {},
    options: PatientSearchOptions = {}
  ): Promise<PatientSearchResult> {
    try {
      // Mock data for development - in production would connect to API
      const mockPatients: PatientSummary[] = [
        {
          id: '1',
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan.perez@example.com',
          age: 39,
          lastVisit: new Date('2024-01-15'),
          status: 'active'
        },
        {
          id: '2',
          firstName: 'Ana',
          lastName: 'González',
          email: 'ana.gonzalez@example.com',
          age: 34,
          lastVisit: new Date('2024-02-10'),
          status: 'active'
        },
        {
          id: '3',
          firstName: 'Carlos',
          lastName: 'Rodríguez',
          email: 'carlos.rodriguez@example.com',
          age: 46,
          status: 'pending'
        }
      ];

      // Apply filters
      let filteredPatients = mockPatients;

      if (filters.name) {
        const searchTerm = filters.name.toLowerCase();
        filteredPatients = filteredPatients.filter(p => 
          p.firstName.toLowerCase().includes(searchTerm) ||
          p.lastName.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.email) {
        filteredPatients = filteredPatients.filter(p => 
          p.email.toLowerCase().includes(filters.email!.toLowerCase())
        );
      }

      if (filters.status) {
        filteredPatients = filteredPatients.filter(p => p.status === filters.status);
      }

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

      return {
        patients: paginatedPatients,
        total: filteredPatients.length,
        page,
        totalPages: Math.ceil(filteredPatients.length / limit)
      };

    } catch (error) {
      logger.error('Error getting patients:', error);
      return {
        patients: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(id: string): Promise<Patient | null> {
    try {
      // Check cache first
      if (this.cache.has(id)) {
        return this.cache.get(id)!;
      }

      // In production, this would make an API call
      // For now, return mock data
      return null;
    } catch (error) {
      logger.error('Error getting patient:', error);
      return null;
    }
  }

  /**
   * Create new patient
   */
  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    try {
      const newPatient: Patient = {
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...patientData
      } as Patient;

      // In production, API call here
      logger.info('Creating patient:', newPatient);

      // Add to cache
      this.cache.set(newPatient.id, newPatient);

      return newPatient;
    } catch (error) {
      logger.error('Error creating patient:', error);
      throw error;
    }
  }

  /**
   * Update patient
   */
  async updatePatient(id: string, patientData: Partial<Patient>): Promise<Patient | null> {
    try {
      const existingPatient = await this.getPatientById(id);
      if (!existingPatient) {
        return null;
      }

      const updatedPatient: Patient = {
        ...existingPatient,
        ...patientData,
        id: existingPatient.id,
        updatedAt: new Date()
      };

      // In production, API call here
      logger.info('Updating patient:', updatedPatient);

      // Update cache
      this.cache.set(id, updatedPatient);

      return updatedPatient;
    } catch (error) {
      logger.error('Error updating patient:', error);
      throw error;
    }
  }

  /**
   * Delete patient
   */
  async deletePatient(id: string): Promise<boolean> {
    try {
      // In production, API call here
      logger.info(`Deleting patient with ID: ${id}`);

      // Remove from cache
      this.cache.delete(id);

      return true;
    } catch (error) {
      logger.error('Error deleting patient:', error);
      return false;
    }
  }

  /**
   * Search patients by term
   */
  async searchPatients(searchTerm: string): Promise<PatientSummary[]> {
    try {
      const filters: PatientSearchFilters = {
        name: searchTerm
      };

      const result = await this.getPatients(filters);
      return result.patients;
    } catch (error) {
      logger.error('Error searching patients:', error);
      return [];
    }
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(): Promise<PatientStats> {
    try {
      const result = await this.getPatients({}, { limit: 1000 });
      
      return {
        total: result.total,
        active: result.patients.filter(p => p.status === 'active').length,
        inactive: result.patients.filter(p => p.status === 'inactive').length,
        pending: result.patients.filter(p => p.status === 'pending').length
      };
    } catch (error) {
      logger.error('Error getting statistics:', error);
      return { total: 0, active: 0, inactive: 0, pending: 0 };
    }
  }

  /**
   * Create appointment for patient
   */
  async createAppointment(appointment: CreateAppointmentRequest): Promise<any> {
    try {
      logger.info('Creating appointment:', appointment);
      // In production, this would call the API
      return {
        id: this.generateId(),
        ...appointment,
        status: 'scheduled',
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   */
  isServiceReady(): boolean {
    return this.isClient;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // Private utility methods
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// Singleton for global use
let patientServiceInstance: PatientService | null = null;

export const getPatientService = (): PatientService => {
  if (!patientServiceInstance) {
    patientServiceInstance = new PatientService();
  }
  return patientServiceInstance;
};

// Appointment service re-export for compatibility
export const getAppointmentService = () => {
  return {
    createAppointment: async (data: CreateAppointmentRequest) => {
      const service = getPatientService();
      return service.createAppointment(data);
    }
  };
};

// Default export
export default getPatientService();