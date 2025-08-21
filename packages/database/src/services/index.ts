/**
 * 🔧 SERVICES INDEX - ALTAMEDICA DATABASE
 * Export centralizado de servicios de alto nivel
 */

// ⚠️ DEPRECATED SERVICES - Use Repositories instead
// These services violate best practices by using Firebase Client SDK without ServiceContext
/**
 * @deprecated Use CompanyRepository and MarketplaceRepository instead
 */
export { companiesService, marketplaceService, analyticsService } from './CompanyService';

/**
 * @deprecated Use MarketplaceRepository and ApplicationRepository instead
 */
export { 
  jobApplicationsService,
  messagingService,
  interviewsService,
  notificationsService,
  communicationEventsService,
  realtimeService
} from './B2CCommunicationService';

// ✅ RECOMMENDED: Use Repository Pattern instead
export { 
  CompanyRepository, 
  companyRepository,
  MarketplaceRepository, 
  marketplaceRepository,
  ApplicationRepository,
  applicationRepository
} from '../repositories/index';

// ✅ NEW SERVICES - Patient and Appointment Management
export { 
  PatientService,
  getPatientService,
  getAppointmentService,
  type PatientSummary,
  type PatientSearchFilters,
  type PatientSearchOptions,
  type PatientSearchResult,
  type PatientStats,
  type CreateAppointmentRequest
} from './PatientService';

// TODO: Implement additional service layer
// export { MedicalRecordService } from './MedicalRecordService';

// Version export
export const servicesVersion = '2.0.0';