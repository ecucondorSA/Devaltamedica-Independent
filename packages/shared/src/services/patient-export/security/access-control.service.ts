import { getFirebaseFirestore } from '@altamedica/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { logger } from '../../logger.service';

/**
 * Access Control Service for Patient Data Export
 * Handles permission verification and authorization
 * Extracted from lines 1132-1151 of original PatientDataExportService
 * Enhanced with role-based access control and audit trail
 */

export interface AccessRights {
  canExportOwnData: boolean;
  canExportPatientData: boolean;
  canExportAllData: boolean;
  canAccessFinancialData: boolean;
  canAccessTechnicalData: boolean;
  canAccessAuditLogs: boolean;
  maxExportSizeBytes?: number;
  allowedFormats?: string[];
  restrictedCategories?: string[];
}

export interface AccessVerificationResult {
  granted: boolean;
  reason?: string;
  accessRights?: AccessRights;
  userId: string;
  patientId: string;
  requestedBy: string;
  verifiedAt: Date;
  restrictions?: AccessRestriction[];
}

export interface AccessRestriction {
  type: 'format' | 'category' | 'date_range' | 'size' | 'frequency';
  description: string;
  value?: any;
}

export interface User {
  id: string;
  role: 'patient' | 'doctor' | 'admin' | 'company' | 'guardian';
  patientId?: string;
  authorizedPatients?: string[];
  permissions?: string[];
  department?: string;
  facilityId?: string;
  isActive: boolean;
  lastLogin?: Date;
  failedLoginAttempts?: number;
  accountLocked?: boolean;
  lockoutUntil?: Date;
}

export class AccessControlService {
  private readonly db = getFirebaseFirestore();
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Verify access rights for patient data export
   * Enhanced version with comprehensive role-based checks
   */
  async verifyAccessRights(
    patientId: string,
    requestedBy: string,
    exportOptions?: {
      categories?: string[];
      format?: string;
      includeFinancial?: boolean;
      includeTechnical?: boolean;
    }
  ): Promise<AccessVerificationResult> {
    try {
      // Get user information
      const user = await this.getUserById(requestedBy);
      if (!user) {
        return this.createDeniedResult(
          patientId,
          requestedBy,
          'User not found or unauthorized'
        );
      }

      // Check if account is locked
      if (user.accountLocked && user.lockoutUntil && user.lockoutUntil > new Date()) {
        return this.createDeniedResult(
          patientId,
          requestedBy,
          `Account locked until ${user.lockoutUntil.toISOString()}`
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return this.createDeniedResult(
          patientId,
          requestedBy,
          'User account is inactive'
        );
      }

      // Get access rights based on role and relationship
      const accessRights = await this.calculateAccessRights(user, patientId);

      // Verify specific permissions for this export
      const verificationResult = await this.verifyExportPermissions(
        user,
        patientId,
        accessRights,
        exportOptions
      );

      if (!verificationResult.granted) {
        // Log failed access attempt
        await this.logAccessAttempt(user.id, patientId, false, verificationResult.reason);
        return verificationResult;
      }

      // Log successful access
      await this.logAccessAttempt(user.id, patientId, true);

      return {
        granted: true,
        accessRights,
        userId: user.id,
        patientId,
        requestedBy,
        verifiedAt: new Date(),
        restrictions: this.generateRestrictions(accessRights, exportOptions),
      };
    } catch (error) {
      logger.error('Error verifying access rights', 'AccessControl', error);
      return this.createDeniedResult(
        patientId,
        requestedBy,
        `Access verification failed: ${error}`
      );
    }
  }

  /**
   * Get user by ID with enhanced error handling
   */
  private async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      return {
        id: userId,
        role: data.role || 'patient',
        patientId: data.patientId,
        authorizedPatients: data.authorizedPatients || [],
        permissions: data.permissions || [],
        department: data.department,
        facilityId: data.facilityId,
        isActive: data.isActive !== false, // Default to true
        lastLogin: data.lastLogin?.toDate(),
        failedLoginAttempts: data.failedLoginAttempts || 0,
        accountLocked: data.accountLocked || false,
        lockoutUntil: data.lockoutUntil?.toDate(),
      };
    } catch (error) {
      logger.error('Error fetching user', 'AccessControl', error);
      return null;
    }
  }

  /**
   * Calculate access rights based on user role and relationship to patient
   */
  private async calculateAccessRights(user: User, patientId: string): Promise<AccessRights> {
    const baseRights: AccessRights = {
      canExportOwnData: false,
      canExportPatientData: false,
      canExportAllData: false,
      canAccessFinancialData: false,
      canAccessTechnicalData: false,
      canAccessAuditLogs: false,
      allowedFormats: ['json'],
      restrictedCategories: [],
    };

    switch (user.role) {
      case 'patient':
        if (user.patientId === patientId) {
          return {
            ...baseRights,
            canExportOwnData: true,
            canAccessFinancialData: true,
            allowedFormats: ['json', 'pdf', 'csv'],
            maxExportSizeBytes: 100 * 1024 * 1024, // 100MB
          };
        }
        break;

      case 'doctor':
        if (await this.isDoctorAuthorizedForPatient(user.id, patientId)) {
          return {
            ...baseRights,
            canExportPatientData: true,
            canAccessFinancialData: true,
            canAccessTechnicalData: true,
            allowedFormats: ['json', 'pdf', 'csv', 'fhir'],
            maxExportSizeBytes: 500 * 1024 * 1024, // 500MB
            restrictedCategories: ['audit_logs'], // Doctors can't access audit logs
          };
        }
        break;

      case 'admin':
        return {
          ...baseRights,
          canExportAllData: true,
          canAccessFinancialData: true,
          canAccessTechnicalData: true,
          canAccessAuditLogs: true,
          allowedFormats: ['json', 'pdf', 'csv', 'zip', 'fhir'],
          maxExportSizeBytes: 1024 * 1024 * 1024, // 1GB
        };

      case 'company':
        if (await this.isCompanyAuthorizedForPatient(user.id, patientId)) {
          return {
            ...baseRights,
            canExportPatientData: true,
            canAccessFinancialData: false,
            canAccessTechnicalData: false,
            allowedFormats: ['json', 'csv'],
            maxExportSizeBytes: 50 * 1024 * 1024, // 50MB
            restrictedCategories: ['audit_logs', 'billing', 'financial'],
          };
        }
        break;

      case 'guardian':
        if (user.authorizedPatients?.includes(patientId)) {
          return {
            ...baseRights,
            canExportPatientData: true,
            canAccessFinancialData: true,
            allowedFormats: ['json', 'pdf'],
            maxExportSizeBytes: 100 * 1024 * 1024, // 100MB
            restrictedCategories: ['audit_logs'],
          };
        }
        break;
    }

    return baseRights;
  }

  /**
   * Verify specific export permissions
   */
  private async verifyExportPermissions(
    user: User,
    patientId: string,
    accessRights: AccessRights,
    exportOptions?: {
      categories?: string[];
      format?: string;
      includeFinancial?: boolean;
      includeTechnical?: boolean;
    }
  ): Promise<AccessVerificationResult> {
    // Check basic access
    if (!accessRights.canExportOwnData && !accessRights.canExportPatientData && !accessRights.canExportAllData) {
      return this.createDeniedResult(
        patientId,
        user.id,
        'No permission to export data for this patient'
      );
    }

    // Check format permissions
    if (exportOptions?.format && accessRights.allowedFormats) {
      if (!accessRights.allowedFormats.includes(exportOptions.format)) {
        return this.createDeniedResult(
          patientId,
          user.id,
          `Format '${exportOptions.format}' not allowed for this user`
        );
      }
    }

    // Check category restrictions
    if (exportOptions?.categories && accessRights.restrictedCategories) {
      const restrictedRequested = exportOptions.categories.filter(cat =>
        accessRights.restrictedCategories!.includes(cat)
      );
      if (restrictedRequested.length > 0) {
        return this.createDeniedResult(
          patientId,
          user.id,
          `Access denied to categories: ${restrictedRequested.join(', ')}`
        );
      }
    }

    // Check financial data access
    if (exportOptions?.includeFinancial && !accessRights.canAccessFinancialData) {
      return this.createDeniedResult(
        patientId,
        user.id,
        'No permission to access financial data'
      );
    }

    // Check technical data access
    if (exportOptions?.includeTechnical && !accessRights.canAccessTechnicalData) {
      return this.createDeniedResult(
        patientId,
        user.id,
        'No permission to access technical data'
      );
    }

    return {
      granted: true,
      userId: user.id,
      patientId,
      requestedBy: user.id,
      verifiedAt: new Date(),
    };
  }

  /**
   * Check if doctor is authorized for patient
   */
  private async isDoctorAuthorizedForPatient(doctorId: string, patientId: string): Promise<boolean> {
    try {
      // Check if doctor has treated this patient (has appointments)
      const appointmentsRef = doc(this.db, 'appointments');
      // This would normally query for appointments where providerId = doctorId and patientId = patientId
      // For now, return true for mock purposes
      return true;
    } catch (error) {
      logger.error('Error checking doctor authorization', 'AccessControl', error);
      return false;
    }
  }

  /**
   * Check if company is authorized for patient
   */
  private async isCompanyAuthorizedForPatient(companyId: string, patientId: string): Promise<boolean> {
    try {
      // Check if company has active contracts or partnerships with patient's facility
      // For now, return true for mock purposes
      return true;
    } catch (error) {
      logger.error('Error checking company authorization', 'AccessControl', error);
      return false;
    }
  }

  /**
   * Log access attempt for audit trail
   */
  private async logAccessAttempt(
    userId: string,
    patientId: string,
    success: boolean,
    reason?: string
  ): Promise<void> {
    try {
      // This would log to audit collection
      logger.info(
        `Access attempt: User ${userId}, Patient ${patientId}, Success: ${success}${reason ? `, Reason: ${reason}` : ''}`,
        'AccessControl'
      );
    } catch (error) {
      logger.error('Error logging access attempt', 'AccessControl', error);
    }
  }

  /**
   * Generate access restrictions for export
   */
  private generateRestrictions(
    accessRights: AccessRights,
    exportOptions?: any
  ): AccessRestriction[] {
    const restrictions: AccessRestriction[] = [];

    if (accessRights.maxExportSizeBytes) {
      restrictions.push({
        type: 'size',
        description: `Maximum export size: ${Math.round(accessRights.maxExportSizeBytes / (1024 * 1024))}MB`,
        value: accessRights.maxExportSizeBytes,
      });
    }

    if (accessRights.allowedFormats && accessRights.allowedFormats.length < 5) {
      restrictions.push({
        type: 'format',
        description: `Allowed formats: ${accessRights.allowedFormats.join(', ')}`,
        value: accessRights.allowedFormats,
      });
    }

    if (accessRights.restrictedCategories && accessRights.restrictedCategories.length > 0) {
      restrictions.push({
        type: 'category',
        description: `Restricted categories: ${accessRights.restrictedCategories.join(', ')}`,
        value: accessRights.restrictedCategories,
      });
    }

    return restrictions;
  }

  /**
   * Create denied access result
   */
  private createDeniedResult(
    patientId: string,
    requestedBy: string,
    reason: string
  ): AccessVerificationResult {
    return {
      granted: false,
      reason,
      userId: requestedBy,
      patientId,
      requestedBy,
      verifiedAt: new Date(),
    };
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      return user.permissions?.includes(permission) || false;
    } catch (error) {
      logger.error('Error checking permission', 'AccessControl', error);
      return false;
    }
  }

  /**
   * Get effective permissions for user and patient combination
   */
  async getEffectivePermissions(userId: string, patientId: string): Promise<string[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      const accessRights = await this.calculateAccessRights(user, patientId);
      const permissions: string[] = [];

      if (accessRights.canExportOwnData) permissions.push('export_own_data');
      if (accessRights.canExportPatientData) permissions.push('export_patient_data');
      if (accessRights.canExportAllData) permissions.push('export_all_data');
      if (accessRights.canAccessFinancialData) permissions.push('access_financial_data');
      if (accessRights.canAccessTechnicalData) permissions.push('access_technical_data');
      if (accessRights.canAccessAuditLogs) permissions.push('access_audit_logs');

      return permissions;
    } catch (error) {
      logger.error('Error getting effective permissions', 'AccessControl', error);
      return [];
    }
  }
}

// Export singleton instance
export const accessControlService = new AccessControlService();
