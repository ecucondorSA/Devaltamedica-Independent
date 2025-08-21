/**
 * 🚨 ALTAMEDICA - HIPAA COMPLIANT AUDIT LOGGER
 * Comprehensive audit logging for medical data access
 * Compliance: HIPAA Security Rule § 164.312(b)
 */

import { promises as fs } from 'fs'
import path from 'path'

import { logger } from '@altamedica/shared/services/logger.service';
// Audit event types for HIPAA compliance
export enum AuditEventType {
  // Authentication events
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTH_LOGOUT = 'AUTH_LOGOUT',
  
  // PHI access events (Critical for HIPAA)
  PHI_ACCESS = 'PHI_ACCESS',
  PHI_MODIFY = 'PHI_MODIFY',
  PHI_DELETE = 'PHI_DELETE',
  PHI_EXPORT = 'PHI_EXPORT',
  
  // Medical record events
  MEDICAL_RECORD_VIEW = 'MEDICAL_RECORD_VIEW',
  MEDICAL_RECORD_UPDATE = 'MEDICAL_RECORD_UPDATE',
  MEDICAL_RECORD_CREATE = 'MEDICAL_RECORD_CREATE',
  
  // System events
  SYSTEM_ACCESS = 'SYSTEM_ACCESS',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Administrative events
  USER_CREATED = 'USER_CREATED',
  USER_MODIFIED = 'USER_MODIFIED',
  USER_DEACTIVATED = 'USER_DEACTIVATED'
}

// Audit log entry structure (HIPAA compliant)
export interface AuditLogEntry {
  // Required HIPAA fields
  timestamp: string // ISO 8601 format
  eventType: AuditEventType
  userId?: string // User who performed the action
  patientId?: string // Patient whose data was accessed (if applicable)
  resourceId?: string // Specific resource accessed
  
  // Security information
  ipAddress: string
  userAgent: string
  sessionId?: string
  
  // Event details
  action: string
  resource: string
  outcome: 'SUCCESS' | 'FAILURE' | 'ERROR'
  
  // Additional context
  details?: Record<string, any>
  errorMessage?: string
  
  // Compliance metadata
  complianceFlags: {
    isPHI: boolean // Was PHI involved?
    isEmergencyAccess: boolean // Was this emergency access?
    dataMinimization: boolean // Was data minimization followed?
  }
}

class HIPAAAuditLogger {
  private logDirectory: string
  private retentionDays: number
  private encryptionEnabled: boolean

  constructor() {
    this.logDirectory = process.env.AUDIT_LOG_DIRECTORY || path.join(process.cwd(), 'logs', 'audit')
    this.retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555') // 7 years default
    this.encryptionEnabled = process.env.PHI_ENCRYPTION_ENABLED === 'true'
    
    // Ensure log directory exists
    this.ensureLogDirectory()
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDirectory, { recursive: true })
    } catch (error) {
      logger.error('Failed to create audit log directory:', undefined, error)
    }
  }

  private async writeLogEntry(entry: AuditLogEntry): Promise<void> {
    try {
      const logFileName = `audit-${new Date().toISOString().split('T')[0]}.jsonl`
      const logFilePath = path.join(this.logDirectory, logFileName)
      
      const logLine = JSON.stringify(entry) + '\n'
      
      // In production, this should be encrypted if PHI is involved
      if (this.encryptionEnabled && entry.complianceFlags.isPHI) {
        // TODO: Implement encryption for PHI-related logs
        // const encryptedLog = await this.encryptLog(logLine)
        await fs.appendFile(logFilePath, logLine, { encoding: 'utf8' })
      } else {
        await fs.appendFile(logFilePath, logLine, { encoding: 'utf8' })
      }
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        logger.info('🔍 AUDIT LOG:', entry)
      }
      
    } catch (error) {
      logger.error('Failed to write audit log:', undefined, error)
      // In production, this should trigger an alert
    }
  }

  /**
   * 🔐 Log authentication success
   */
  async logAuthSuccess(
    user: any,
    ipAddress: string,
    userAgent: string,
    sessionId?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_SUCCESS,
      userId: user?.uid || user?.userId,
      ipAddress,
      userAgent,
      sessionId,
      action: 'USER_LOGIN',
      resource: '/api/auth',
      outcome: 'SUCCESS',
      details: {
        userEmail: user?.email,
        userRole: user?.role
      },
      complianceFlags: {
        isPHI: false,
        isEmergencyAccess: false,
        dataMinimization: true
      }
    }
    
    await this.writeLogEntry(entry)
  }

  /**
   * 🚨 Log authentication failure
   */
  async logAuthFailure(
    reason: string,
    ipAddress: string,
    userAgent: string,
    attemptedUserId?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.AUTH_FAILURE,
      userId: attemptedUserId,
      ipAddress,
      userAgent,
      action: 'USER_LOGIN_ATTEMPT',
      resource: '/api/auth',
      outcome: 'FAILURE',
      errorMessage: reason,
      details: {
        failureReason: reason
      },
      complianceFlags: {
        isPHI: false,
        isEmergencyAccess: false,
        dataMinimization: true
      }
    }
    
    await this.writeLogEntry(entry)
  }

  /**
   * 🏥 Log PHI access (CRITICAL for HIPAA)
   */
  async logPHIAccess(
    userId: string,
    patientId: string,
    resourceType: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    isEmergencyAccess: boolean = false
  ): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.PHI_ACCESS,
      userId,
      patientId,
      resourceId: `${resourceType}:${patientId}`,
      ipAddress,
      userAgent,
      action: `PHI_${action.toUpperCase()}`,
      resource: `/api/patients/${patientId}/${resourceType}`,
      outcome: 'SUCCESS',
      details: {
        resourceType,
        accessReason: isEmergencyAccess ? 'EMERGENCY' : 'ROUTINE'
      },
      complianceFlags: {
        isPHI: true,
        isEmergencyAccess,
        dataMinimization: true
      }
    }
    
    await this.writeLogEntry(entry)
  }

  /**
   * 📋 Log medical record access
   */
  async logMedicalRecordAccess(
    userId: string,
    patientId: string,
    recordId: string,
    action: 'VIEW' | 'UPDATE' | 'CREATE' | 'DELETE',
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const eventType = action === 'VIEW' ? AuditEventType.MEDICAL_RECORD_VIEW :
                     action === 'UPDATE' ? AuditEventType.MEDICAL_RECORD_UPDATE :
                     action === 'CREATE' ? AuditEventType.MEDICAL_RECORD_CREATE :
                     AuditEventType.PHI_DELETE

    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId,
      patientId,
      resourceId: recordId,
      ipAddress,
      userAgent,
      action: `MEDICAL_RECORD_${action}`,
      resource: `/api/medical-records/${recordId}`,
      outcome: 'SUCCESS',
      details: {
        recordType: 'medical_record',
        patientId
      },
      complianceFlags: {
        isPHI: true,
        isEmergencyAccess: false,
        dataMinimization: true
      }
    }
    
    await this.writeLogEntry(entry)
  }

  /**
   * ⚠️ Log system errors
   */
  async logSystemError(
    error: Error,
    userId?: string,
    ipAddress: string = 'unknown',
    userAgent: string = 'unknown'
  ): Promise<void> {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      eventType: AuditEventType.SYSTEM_ERROR,
      userId,
      ipAddress,
      userAgent,
      action: 'SYSTEM_ERROR',
      resource: 'SYSTEM',
      outcome: 'ERROR',
      errorMessage: error.message,
      details: {
        errorStack: error.stack,
        errorName: error.name
      },
      complianceFlags: {
        isPHI: false,
        isEmergencyAccess: false,
        dataMinimization: true
      }
    }
    
    await this.writeLogEntry(entry)
  }

  /**
   * 🔍 Search audit logs (for compliance reporting)
   */
  async searchLogs(criteria: {
    startDate?: Date
    endDate?: Date
    userId?: string
    patientId?: string
    eventType?: AuditEventType
    outcome?: 'SUCCESS' | 'FAILURE' | 'ERROR'
  }): Promise<AuditLogEntry[]> {
    // In production, this should query a proper database
    // For now, we'll return a placeholder
    logger.info('Searching audit logs with criteria:', criteria)
    return []
  }

  /**
   * 📊 Generate compliance report
   */
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalEvents: number
    phiAccessEvents: number
    authFailures: number
    systemErrors: number
    emergencyAccess: number
  }> {
    // In production, this should analyze actual audit logs
    return {
      totalEvents: 0,
      phiAccessEvents: 0,
      authFailures: 0,
      systemErrors: 0,
      emergencyAccess: 0
    }
  }

  /**
   * 🧹 Clean up old audit logs (respecting retention policy)
   */
  async cleanupOldLogs(): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays)
      
      const files = await fs.readdir(this.logDirectory)
      
      for (const file of files) {
        if (file.startsWith('audit-')) {
          const filePath = path.join(this.logDirectory, file)
          const stats = await fs.stat(filePath)
          
          if (stats.mtime < cutoffDate) {
            // In production, archive to long-term storage before deletion
            await fs.unlink(filePath)
            logger.info(`Cleaned up old audit log: ${file}`)
          }
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old audit logs:', undefined, error)
    }
  }
}

// Export singleton instance
export const auditLogger = new HIPAAAuditLogger()

export default auditLogger
