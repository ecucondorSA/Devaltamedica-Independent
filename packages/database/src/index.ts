/**
 * 🏥 @ALTAMEDICA/DATABASE - UNIFIED DATABASE LAYER
 * Versión 2.0.0 - Arquitectura consolidada con Firebase/Firestore
 * Repository Pattern + HIPAA Compliance + Performance Optimization
 */

// Version
export const databaseVersion = '2.0.0';

// Core Database Connection
export { DatabaseConnection, dbConnection, getAuthAdmin, getFirestoreDB, getStorageAdmin } from './core/DatabaseConnection';

// Base Repository Pattern
export { BaseRepository, type BaseEntity, type QueryOptions, type RepositoryResult, type ServiceContext } from './repositories/BaseRepository';

// Specialized Repositories
export { AppointmentRepository, appointmentRepository } from './repositories/AppointmentRepository';
export { DoctorRepository, doctorRepository } from './repositories/DoctorRepository';
export { MedicalRecordRepository, medicalRecordRepository } from './repositories/MedicalRecordRepository';
export { PatientRepository, patientRepository } from './repositories/PatientRepository';
export { CompanyRepository, companyRepository } from './repositories/CompanyRepository';
export { MarketplaceRepository, marketplaceRepository, ApplicationRepository, applicationRepository } from './repositories/MarketplaceRepository';

// Audit & Compliance Repositories
export { AuditLogRepository, auditLogRepository } from './repositories/AuditLogRepository';

// Centralized Schemas (namespaced to avoid type name collisions)
export * as Schemas from './schemas';

// Repository Index Export
export * from './repositories';

// Services Export
export * from './services';

// Security & HIPAA
export * from './security';

// Cache Layer
export * from './cache';

// Monitoring
export * from './monitoring';

// Firebase Configuration
export * from './firebase/config';

// Migrations
export * from './migrations';

// Firestore Collections
export { AuditCollection } from './firestore/audit-collection';

// Import instances for convenience functions
import { dbConnection } from './core/DatabaseConnection';
import { appointmentRepository } from './repositories/AppointmentRepository';
import { doctorRepository } from './repositories/DoctorRepository';
import { medicalRecordRepository } from './repositories/MedicalRecordRepository';
import { patientRepository } from './repositories/PatientRepository';
import { companyRepository } from './repositories/CompanyRepository';
import { marketplaceRepository, applicationRepository } from './repositories/MarketplaceRepository';
import { auditLogRepository } from './repositories/AuditLogRepository';

import { logger } from '@altamedica/shared/services/logger.service';
// Convenience Functions for Quick Setup
export async function initializeAltaMedicaDatabase() {
  try {
    const db = await dbConnection.getFirestore();
    if (!db) {
      throw new Error('Failed to initialize AltaMedica Database');
    }
    
    const healthCheck = await dbConnection.healthCheck();
    logger.info('🏥 AltaMedica Database initialized successfully', {
      version: databaseVersion,
      status: healthCheck.status,
      services: healthCheck.services
    });
    
    return {
      connection: dbConnection,
      healthCheck,
      repositories: {
        medicalRecord: medicalRecordRepository,
        patient: patientRepository,
        doctor: doctorRepository,
        appointment: appointmentRepository,
        company: companyRepository,
        marketplace: marketplaceRepository,
        application: applicationRepository,
        auditLog: auditLogRepository
      }
    };
  } catch (error) {
    logger.error('❌ Failed to initialize AltaMedica Database:', error);
    throw error;
  }
}

// Quick Health Check
export async function checkDatabaseHealth() {
  return await dbConnection.healthCheck();
}

// Database Metrics
export function getDatabaseMetrics() {
  return dbConnection.getMetrics();
}
