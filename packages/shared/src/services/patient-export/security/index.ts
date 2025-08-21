/**
 * Security Layer for Patient Export Services
 * Centralized security, compliance, and audit functionality
 */

// Access Control
export {
  AccessControlService,
  accessControlService,
  type AccessRights,
  type AccessVerificationResult,
  type AccessRestriction,
  type User,
} from './access-control.service';

// Encryption
export {
  EncryptionService,
  encryptionService,
  type EncryptionConfig,
  type EncryptedData,
  type EncryptionResult,
  type KeyDerivationOptions,
} from './encryption.service';

// Audit Logging
export {
  AuditLoggerService,
  auditLoggerService,
  type AuditEvent,
  type AuditAction,
  type AuditResource,
  type AuditSeverity,
  type AuditOutcome,
  type AuditMetadata,
  type AuditComplianceInfo,
  type AuditQuery,
  type AuditSummary,
} from './audit-logger.service';

// Unified Security Manager
export class SecurityManager {
  private readonly accessControl = accessControlService;
  private readonly encryption = encryptionService;
  private readonly auditLogger = auditLoggerService;

  /**
   * Verify access and log the attempt
   */
  async verifyAndLogAccess(
    patientId: string,
    requestedBy: string,
    exportOptions?: any
  ): Promise<AccessVerificationResult> {
    const result = await this.accessControl.verifyAccessRights(
      patientId,
      requestedBy,
      exportOptions
    );

    // Log access attempt
    await this.auditLogger.logAccessControl(
      requestedBy,
      patientId,
      result.granted,
      result.reason,
      exportOptions?.categories
    );

    return result;
  }

  /**
   * Encrypt file and log the operation
   */
  async encryptAndLog(
    filePath: string,
    userId: string,
    patientId: string,
    exportId: string
  ): Promise<EncryptionResult | null> {
    if (!this.encryption.isEncryptionEnabled()) {
      await this.auditLogger.logEncryption(
        userId,
        patientId,
        exportId,
        false,
        undefined,
        'Encryption not enabled'
      );
      return null;
    }

    try {
      const result = await this.encryption.encryptFile(filePath);
      
      await this.auditLogger.logEncryption(
        userId,
        patientId,
        exportId,
        true,
        'aes-256-gcm'
      );

      return result;
    } catch (error) {
      await this.auditLogger.logEncryption(
        userId,
        patientId,
        exportId,
        false,
        'aes-256-gcm',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  /**
   * Get security compliance status
   */
  getComplianceStatus(): {
    encryption: boolean;
    accessControl: boolean;
    auditLogging: boolean;
    overall: 'compliant' | 'partial' | 'non-compliant';
  } {
    const encryption = this.encryption.isEncryptionEnabled();
    const accessControl = true; // Always available
    const auditLogging = true; // Always available

    let overall: 'compliant' | 'partial' | 'non-compliant';
    if (encryption && accessControl && auditLogging) {
      overall = 'compliant';
    } else if (accessControl && auditLogging) {
      overall = 'partial';
    } else {
      overall = 'non-compliant';
    }

    return {
      encryption,
      accessControl,
      auditLogging,
      overall,
    };
  }

  /**
   * Get security metadata for export
   */
  getSecurityMetadata(): any {
    return {
      encryption: this.encryption.getEncryptionMetadata(),
      compliance: this.getComplianceStatus(),
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    };
  }
}

// Export singleton security manager
export const securityManager = new SecurityManager();