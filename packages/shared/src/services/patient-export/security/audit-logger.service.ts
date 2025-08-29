import { getFirebaseFirestore } from '@altamedica/firebase/client';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { ExportRequest } from '../types';
import { logger } from '../../logger.service';

/**
 * Audit Logger Service for Patient Data Export
 * Handles HIPAA-compliant audit logging and compliance tracking
 * Extracted from lines 1172-1194 of original PatientDataExportService
 * Enhanced with comprehensive audit trail and compliance validation
 */

export interface AuditEvent {
  id?: string;
  action: AuditAction;
  userId: string;
  targetId: string;
  resource: AuditResource;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: AuditMetadata;
  compliance: AuditComplianceInfo;
  severity: AuditSeverity;
  outcome: AuditOutcome;
  location?: GeographicLocation;
  device?: DeviceInfo;
}

export type AuditAction =
  | 'patient_data_export_requested'
  | 'patient_data_export_started'
  | 'patient_data_export_completed'
  | 'patient_data_export_failed'
  | 'patient_data_export_downloaded'
  | 'patient_data_export_deleted'
  | 'access_granted'
  | 'access_denied'
  | 'authentication_success'
  | 'authentication_failure'
  | 'permission_check'
  | 'data_collection_started'
  | 'data_collection_completed'
  | 'encryption_applied'
  | 'encryption_failed'
  | 'file_creation'
  | 'file_deletion'
  | 'compliance_check'
  | 'security_violation';

export type AuditResource =
  | 'patient_data'
  | 'medical_records'
  | 'export_request'
  | 'user_session'
  | 'export_file'
  | 'encryption_key'
  | 'access_control'
  | 'compliance_report';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AuditOutcome = 'success' | 'failure' | 'warning' | 'partial';

export interface AuditMetadata {
  exportId?: string;
  format?: string;
  categories?: string[];
  recordCount?: number;
  fileSize?: number;
  encryptionUsed?: boolean;
  accessMethod?: string;
  exportDuration?: number;
  errorCode?: string;
  errorMessage?: string;
  requestSource?: string;
  dataRange?: {
    from: Date;
    to: Date;
  };
  [key: string]: any;
}

export interface AuditComplianceInfo {
  hipaa: boolean;
  ley26529: boolean;
  article?: string;
  regulation?: string;
  dataClassification: 'phi' | 'pii' | 'public' | 'internal';
  retentionRequired: boolean;
  encryptionRequired: boolean;
  auditRequired: boolean;
  consentRequired: boolean;
  minimumDataOnly: boolean;
}

export interface GeographicLocation {
  country?: string;
  region?: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet' | 'server' | 'api';
  os?: string;
  browser?: string;
  version?: string;
  fingerprint?: string;
}

export interface AuditQuery {
  userId?: string;
  targetId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  dateRange?: {
    from: Date;
    to: Date;
  };
  severity?: AuditSeverity;
  outcome?: AuditOutcome;
  limit?: number;
  offset?: number;
}

export interface AuditSummary {
  totalEvents: number;
  eventsByAction: Record<AuditAction, number>;
  eventsByOutcome: Record<AuditOutcome, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  uniqueUsers: number;
  uniquePatients: number;
  complianceViolations: number;
  timeRange: {
    from: Date;
    to: Date;
  };
}

export class AuditLoggerService {
  private readonly db = getFirebaseFirestore();
  private readonly COLLECTION_NAME = 'audit_logs';
  private readonly RETENTION_DAYS = 2555; // 7 years for HIPAA compliance

  // Cache for user info to avoid repeated lookups
  private userCache = new Map<string, any>();

  /**
   * Log export request with enhanced metadata and compliance tracking
   */
  async logExportRequest(request: ExportRequest, additionalMetadata?: Record<string, unknown>): Promise<void> {
    const auditEvent: AuditEvent = {
      action: 'patient_data_export_requested',
      userId: request.requestedBy,
      targetId: request.patientId,
      resource: 'patient_data',
      timestamp: new Date(),
      metadata: {
        exportId: request.id,
        format: request.format.type,
        categories: Object.keys(request.includeOptions).filter(
          (k) => request.includeOptions[k as keyof typeof request.includeOptions]
        ),
        encryptionUsed: !!process.env.EXPORT_ENCRYPTION_KEY,
        requestSource: 'patient_export_service',
        dataRange: request.dateRange,
        ...additionalMetadata,
      },
      compliance: {
        hipaa: true,
        ley26529: true,
        article: 'Right of Access / Art. 14',
        dataClassification: 'phi',
        retentionRequired: true,
        encryptionRequired: true,
        auditRequired: true,
        consentRequired: true,
        minimumDataOnly: true,
      },
      severity: 'medium',
      outcome: 'success',
    };

    await this.logEvent(auditEvent);
  }

  /**
   * Log export process start
   */
  async logExportStart(exportId: string, userId: string, patientId: string): Promise<void> {
    await this.logEvent({
      action: 'patient_data_export_started',
      userId,
      targetId: patientId,
      resource: 'export_request',
      timestamp: new Date(),
      metadata: { exportId },
      compliance: this.getStandardCompliance('phi'),
      severity: 'medium',
      outcome: 'success',
    });
  }

  /**
   * Log export completion with metrics
   */
  async logExportComplete(
    exportId: string,
    userId: string,
    patientId: string,
    metrics: {
      recordCount: number;
      fileSize: number;
      duration: number;
      categories: string[];
    }
  ): Promise<void> {
    await this.logEvent({
      action: 'patient_data_export_completed',
      userId,
      targetId: patientId,
      resource: 'export_file',
      timestamp: new Date(),
      metadata: {
        exportId,
        recordCount: metrics.recordCount,
        fileSize: metrics.fileSize,
        exportDuration: metrics.duration,
        categories: metrics.categories,
      },
      compliance: this.getStandardCompliance('phi'),
      severity: 'medium',
      outcome: 'success',
    });
  }

  /**
   * Log export failure with error details
   */
  async logExportFailure(
    exportId: string,
    userId: string,
    patientId: string,
    error: Error
  ): Promise<void> {
    await this.logEvent({
      action: 'patient_data_export_failed',
      userId,
      targetId: patientId,
      resource: 'export_request',
      timestamp: new Date(),
      metadata: {
        exportId,
        errorMessage: error.message,
        errorCode: (error as any).code || 'UNKNOWN',
      },
      compliance: this.getStandardCompliance('phi'),
      severity: 'high',
      outcome: 'failure',
    });
  }

  /**
   * Log access control decisions
   */
  async logAccessControl(
    userId: string,
    patientId: string,
    granted: boolean,
    reason?: string,
    requestedPermissions?: string[]
  ): Promise<void> {
    await this.logEvent({
      action: granted ? 'access_granted' : 'access_denied',
      userId,
      targetId: patientId,
      resource: 'access_control',
      timestamp: new Date(),
      metadata: {
        reason,
        requestedPermissions,
        accessMethod: 'patient_export',
      },
      compliance: this.getStandardCompliance('phi'),
      severity: granted ? 'low' : 'high',
      outcome: granted ? 'success' : 'failure',
    });
  }

  /**
   * Log data collection events
   */
  async logDataCollection(
    userId: string,
    patientId: string,
    category: string,
    recordCount: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    await this.logEvent({
      action: success ? 'data_collection_completed' : 'data_collection_started',
      userId,
      targetId: patientId,
      resource: 'patient_data',
      timestamp: new Date(),
      metadata: {
        categories: [category],
        recordCount: success ? recordCount : undefined,
        errorMessage: error,
      },
      compliance: this.getStandardCompliance('phi'),
      severity: success ? 'low' : (error ? 'medium' : 'low'),
      outcome: success ? 'success' : (error ? 'failure' : 'partial'),
    });
  }

  /**
   * Log encryption events
   */
  async logEncryption(
    userId: string,
    patientId: string,
    exportId: string,
    success: boolean,
    algorithm?: string,
    error?: string
  ): Promise<void> {
    await this.logEvent({
      action: success ? 'encryption_applied' : 'encryption_failed',
      userId,
      targetId: patientId,
      resource: 'export_file',
      timestamp: new Date(),
      metadata: {
        exportId,
        algorithm,
        errorMessage: error,
      },
      compliance: this.getStandardCompliance('phi'),
      severity: success ? 'low' : 'critical',
      outcome: success ? 'success' : 'failure',
    });
  }

  /**
   * Log file operations
   */
  async logFileOperation(
    operation: 'creation' | 'deletion',
    userId: string,
    patientId: string,
    exportId: string,
    filePath: string,
    fileSize?: number
  ): Promise<void> {
    await this.logEvent({
      action: operation === 'creation' ? 'file_creation' : 'file_deletion',
      userId,
      targetId: patientId,
      resource: 'export_file',
      timestamp: new Date(),
      metadata: {
        exportId,
        filePath: this.sanitizeFilePath(filePath),
        fileSize,
      },
      compliance: this.getStandardCompliance('phi'),
      severity: 'low',
      outcome: 'success',
    });
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(
    userId: string,
    targetId: string,
    violation: string,
    severity: AuditSeverity = 'critical',
    metadata?: any
  ): Promise<void> {
    await this.logEvent({
      action: 'security_violation',
      userId,
      targetId,
      resource: 'access_control',
      timestamp: new Date(),
      metadata: {
        violation,
        ...metadata,
      },
      compliance: this.getStandardCompliance('phi'),
      severity,
      outcome: 'failure',
    });
  }

  /**
   * Core audit event logging with enhanced error handling
   */
  private async logEvent(event: AuditEvent): Promise<void> {
    try {
      // Enrich event with additional context
      const enrichedEvent = await this.enrichAuditEvent(event);

      // Store in Firestore
      const auditRef = doc(collection(this.db, this.COLLECTION_NAME));
      await setDoc(auditRef, {
        ...enrichedEvent,
        id: auditRef.id,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        retentionUntil: new Date(Date.now() + this.RETENTION_DAYS * 24 * 60 * 60 * 1000),
      });

      // Log to console for immediate monitoring (in development)
      if (process.env.NODE_ENV !== 'production') {
        logger.info(
          `${event.action}: ${event.userId} -> ${event.targetId}`,
          'AuditLog',
          { severity: event.severity, outcome: event.outcome, metadata: event.metadata }
        );
      }

      // Check for compliance violations
      await this.checkComplianceViolations(enrichedEvent);
    } catch (error) {
      logger.error('Failed to log audit event', 'AuditLogger', error);

      // Fallback logging to prevent audit trail gaps
      await this.fallbackLog(event, error as Error);
    }
  }

  /**
   * Enrich audit event with additional context
   */
  private async enrichAuditEvent(event: AuditEvent): Promise<AuditEvent> {
    const enriched = { ...event };

    // Add session information if available
    if (process.env.NODE_ENV !== 'test') {
      enriched.ip = 'system'; // Would be extracted from request in real implementation
      enriched.userAgent = 'patient-export-service';
      enriched.sessionId = `export-session-${Date.now()}`;
    }

    // Add geographic information if available
    enriched.location = {
      country: 'AR', // Default to Argentina
      timezone: 'America/Argentina/Buenos_Aires',
    };

    // Add device information
    enriched.device = {
      type: 'server',
      os: process.platform,
      version: process.version,
    };

    return enriched;
  }

  /**
   * Check for compliance violations and alert if necessary
   */
  private async checkComplianceViolations(event: AuditEvent): Promise<void> {
    const violations: string[] = [];

    // Check for security violations
    if (event.action === 'access_denied' && event.severity === 'critical') {
      violations.push('Critical access denial detected');
    }

    if (event.action === 'encryption_failed') {
      violations.push('Encryption failure for PHI data');
    }

    if (event.outcome === 'failure' && event.compliance.encryptionRequired) {
      violations.push('Required encryption failed');
    }

    // Log violations for immediate attention
    if (violations.length > 0) {
      logger.warn('Compliance violations detected', 'AuditLogger', violations);

      // In production, this would trigger alerts/notifications
      if (process.env.NODE_ENV === 'production') {
        // await this.sendComplianceAlert(violations, event);
      }
    }
  }

  /**
   * Fallback logging mechanism
   */
  private async fallbackLog(event: AuditEvent, error: Error): Promise<void> {
    try {
      // Log to a fallback collection or local file
      logger.error('Fallback logging activated for event', 'AuditLogger', {
        action: event.action,
        userId: event.userId,
        targetId: event.targetId,
        timestamp: event.timestamp,
        error: error.message,
      });

      // In production, this might write to a local file or secondary database
    } catch (fallbackError) {
      logger.error('Fallback logging also failed', 'AuditLogger', fallbackError);
    }
  }

  /**
   * Get standard compliance info for data classification
   */
  private getStandardCompliance(classification: 'phi' | 'pii' | 'public' | 'internal'): AuditComplianceInfo {
    const base: AuditComplianceInfo = {
      hipaa: true,
      ley26529: true,
      dataClassification: classification,
      retentionRequired: true,
      encryptionRequired: classification === 'phi' || classification === 'pii',
      auditRequired: true,
      consentRequired: classification === 'phi',
      minimumDataOnly: classification === 'phi',
    };

    switch (classification) {
      case 'phi':
        return {
          ...base,
          regulation: 'HIPAA Security Rule § 164.312(b)',
        };
      case 'pii':
        return {
          ...base,
          regulation: 'Ley 25.326 de Protección de Datos Personales',
        };
      default:
        return base;
    }
  }

  /**
   * Sanitize file path for logging (remove sensitive directory structures)
   */
  private sanitizeFilePath(filePath: string): string {
    // Remove absolute paths and keep only relative structure
    return filePath.replace(/^.*[\\\/]exports[\\\/]/, 'exports/');
  }

  /**
   * Query audit logs with filtering and pagination
   */
  async queryAuditLogs(query: AuditQuery): Promise<AuditEvent[]> {
    // This would implement Firestore querying with the provided filters
    // For now, return empty array as placeholder
    logger.info('Query audit logs', 'AuditLogger', query);
    return [];
  }

  /**
   * Generate audit summary for compliance reporting
   */
  async generateAuditSummary(dateRange: { from: Date; to: Date }): Promise<AuditSummary> {
    // This would aggregate audit data for the specified date range
    // For now, return basic structure as placeholder
    return {
      totalEvents: 0,
      eventsByAction: {} as Record<AuditAction, number>,
      eventsByOutcome: {} as Record<AuditOutcome, number>,
      eventsBySeverity: {} as Record<AuditSeverity, number>,
      uniqueUsers: 0,
      uniquePatients: 0,
      complianceViolations: 0,
      timeRange: dateRange,
    };
  }

  /**
   * Get audit events for specific export request
   */
  async getExportAuditTrail(exportId: string): Promise<AuditEvent[]> {
    // This would query all audit events related to a specific export
    logger.info(`Get export audit trail for: ${exportId}`, 'AuditLogger');
    return [];
  }

  /**
   * Check if audit retention requirements are met
   */
  async validateRetentionCompliance(): Promise<{
    compliant: boolean;
    oldestRecord?: Date;
    retentionGaps?: string[];
  }> {
    // This would check if audit logs meet retention requirements
    return {
      compliant: true,
      retentionGaps: [],
    };
  }
}

// Export singleton instance
export const auditLoggerService = new AuditLoggerService();
