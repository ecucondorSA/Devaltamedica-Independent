/**
 * 📦 REPOSITORIES INDEX - ALTAMEDICA DATABASE
 * Export centralizado de todos los repositories
 */

// Base Repository
export { BaseRepository, type BaseEntity, type ServiceContext, type QueryOptions, type RepositoryResult } from './BaseRepository.js';

// Medical Repositories
export { MedicalRecordRepository, medicalRecordRepository, type MedicalRecord } from './MedicalRecordRepository.js';
export { PatientRepository, patientRepository, type Patient } from './PatientRepository.js';
export { DoctorRepository, doctorRepository, type Doctor } from './DoctorRepository.js';
export { AppointmentRepository, appointmentRepository, type Appointment } from './AppointmentRepository.js';

// Business Repositories
export { CompanyRepository, companyRepository, type Company } from './CompanyRepository.js';
export { 
  MarketplaceRepository, 
  marketplaceRepository, 
  ApplicationRepository,
  applicationRepository,
  type MarketplaceOffer,
  type Application 
} from './MarketplaceRepository.js';

// Audit & Compliance Repositories
export { AuditLogRepository, auditLogRepository } from './AuditLogRepository';

// TODO: Add more repositories as they are implemented
// export { PrescriptionRepository, prescriptionRepository } from './PrescriptionRepository';
// export { TelemedicineRepository, telemedicineRepository } from './TelemedicineRepository';