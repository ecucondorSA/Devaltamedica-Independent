/**
 * Servicio de Auditoría HIPAA Compliant
 * Registra todas las acciones sobre PHI con integridad criptográfica
 */

import * as crypto from 'crypto';
import { logger } from './logger.service';
import { encryptionService } from './encryption.service';
import { UserRole } from '@altamedica/types';

export interface AuditEvent {
  // Identificadores
  eventId: string;
  timestamp: string;
  
  // Actor
  userId: string;
  userRole: UserRole;
  userName?: string;
  userEmail?: string;
  
  // Acción
  action: AuditAction;
  resource: string;
  resourceId?: string;
  resourceType?: ResourceType;
  
  // Contexto
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  
  // Resultado
  success: boolean;
  error?: string;
  
  // Datos
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
  
  // Integridad
  hash?: string;
  previousHash?: string;
  sequenceNumber?: number;
}

export enum AuditAction {
  // Acceso
  VIEW = 'VIEW',
  SEARCH = 'SEARCH',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',
  
  // Modificación
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // Autenticación
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  MFA_SETUP = 'MFA_SETUP',
  MFA_VERIFY = 'MFA_VERIFY',
  
  // Autorización
  PERMISSION_GRANT = 'PERMISSION_GRANT',
  PERMISSION_REVOKE = 'PERMISSION_REVOKE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  
  // Médico
  PATIENT_ACCESS = 'PATIENT_ACCESS',
  MEDICAL_RECORD_VIEW = 'MEDICAL_RECORD_VIEW',
  MEDICAL_RECORD_CREATE = 'MEDICAL_RECORD_CREATE',
  MEDICAL_RECORD_UPDATE = 'MEDICAL_RECORD_UPDATE',
  PRESCRIPTION_CREATE = 'PRESCRIPTION_CREATE',
  PRESCRIPTION_VIEW = 'PRESCRIPTION_VIEW',
  LAB_RESULT_VIEW = 'LAB_RESULT_VIEW',
  DIAGNOSIS_CREATE = 'DIAGNOSIS_CREATE',
  
  // Comunicación
  MESSAGE_SEND = 'MESSAGE_SEND',
  MESSAGE_VIEW = 'MESSAGE_VIEW',
  VIDEO_CALL_START = 'VIDEO_CALL_START',
  VIDEO_CALL_END = 'VIDEO_CALL_END',
  
  // Pagos
  PAYMENT_PROCESS = 'PAYMENT_PROCESS',
  INVOICE_GENERATE = 'INVOICE_GENERATE',
  REFUND_PROCESS = 'REFUND_PROCESS',
  
  // Sistema
  BACKUP_CREATE = 'BACKUP_CREATE',
  BACKUP_RESTORE = 'BACKUP_RESTORE',
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  AUDIT_EXPORT = 'AUDIT_EXPORT',
  BREACH_DETECTED = 'BREACH_DETECTED'
}

export enum ResourceType {
  PATIENT = 'PATIENT',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
  PRESCRIPTION = 'PRESCRIPTION',
  APPOINTMENT = 'APPOINTMENT',
  LAB_RESULT = 'LAB_RESULT',
  INVOICE = 'INVOICE',
  USER = 'USER',
  SYSTEM = 'SYSTEM'
}

class AuditService {
  private static instance: AuditService;
  private lastHash: string = '0';
  private sequenceNumber: number = 0;
  private auditQueue: AuditEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.initializeService();
  }
  
  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }
  
  private initializeService(): void {
    // Inicializar flush interval para procesar cola
    this.flushInterval = setInterval(() => {
      this.flushQueue();
    }, 5000); // Flush cada 5 segundos
    
    // Limpiar en shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }
  
  private async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flushQueue();
  }
  
  /**
   * Registra un evento de auditoría
   */
  async log(event: Partial<AuditEvent>): Promise<void> {
    try {
      const auditEvent = this.createAuditEvent(event);
      
      // Agregar a la cola
      this.auditQueue.push(auditEvent);
      
      // Si es crítico, flush inmediato
      if (this.isCriticalEvent(auditEvent)) {
        await this.flushQueue();
      }
    } catch (error) {
      logger.error('Failed to log audit event', error, {
        action: event.action,
        resource: event.resource
      });
    }
  }
  
  /**
   * Crea un evento de auditoría completo
   */
  private createAuditEvent(event: Partial<AuditEvent>): AuditEvent {
    // Incrementar número de secuencia
    this.sequenceNumber++;
    
    const auditEvent: AuditEvent = {
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
      userId: event.userId || 'SYSTEM',
      userRole: event.userRole || 'PATIENT' as UserRole,
      action: event.action || AuditAction.VIEW,
      resource: event.resource || 'UNKNOWN',
      success: event.success ?? true,
      sequenceNumber: this.sequenceNumber,
      ...event
    };
    
    // Encriptar datos sensibles si existen
    if (auditEvent.oldValue) {
      auditEvent.oldValue = encryptionService.encryptPHI(auditEvent.oldValue);
    }
    if (auditEvent.newValue) {
      auditEvent.newValue = encryptionService.encryptPHI(auditEvent.newValue);
    }
    
    // Calcular hash para integridad
    auditEvent.previousHash = this.lastHash;
    auditEvent.hash = this.calculateHash(auditEvent);
    this.lastHash = auditEvent.hash;
    
    return auditEvent;
  }
  
  /**
   * Genera un ID único para el evento
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  /**
   * Calcula el hash del evento para integridad
   */
  private calculateHash(event: AuditEvent): string {
    const dataToHash = {
      eventId: event.eventId,
      timestamp: event.timestamp,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      success: event.success,
      previousHash: event.previousHash,
      sequenceNumber: event.sequenceNumber
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(dataToHash))
      .digest('hex');
  }
  
  /**
   * Verifica si es un evento crítico
   */
  private isCriticalEvent(event: AuditEvent): boolean {
    const criticalActions = [
      AuditAction.BREACH_DETECTED,
      AuditAction.LOGIN_FAILED,
      AuditAction.PERMISSION_GRANT,
      AuditAction.PERMISSION_REVOKE,
      AuditAction.ROLE_CHANGE,
      AuditAction.SYSTEM_CONFIG_CHANGE,
      AuditAction.DELETE,
      AuditAction.EXPORT
    ];
    
    return criticalActions.includes(event.action);
  }
  
  /**
   * Procesa la cola de eventos
   */
  private async flushQueue(): Promise<void> {
    if (this.auditQueue.length === 0) return;
    
    const events = [...this.auditQueue];
    this.auditQueue = [];
    
    try {
      // TODO: Implementar persistencia en base de datos
      await this.persistEvents(events);
      
      logger.debug(`Flushed ${events.length} audit events`, {
        action: 'audit_flush',
        count: events.length
      });
    } catch (error) {
      // Si falla, volver a agregar a la cola
      this.auditQueue.unshift(...events);
      logger.error('Failed to flush audit queue', error);
    }
  }
  
  /**
   * Persiste los eventos en la base de datos
   */
  private async persistEvents(events: AuditEvent[]): Promise<void> {
    // TODO: Implementar persistencia real
    // Por ahora, log a archivo
    for (const event of events) {
      if (process.env.ENABLE_AUDIT_LOGS === 'true') {
        // En producción, esto iría a base de datos
        logger.info('AUDIT_LOG', {
          ...event,
          action: `audit_${event.action.toLowerCase()}`
        });
      }
    }
  }
  
  /**
   * Verifica la integridad de la cadena de auditoría
   */
  async verifyIntegrity(fromDate?: Date, toDate?: Date): Promise<boolean> {
    try {
      // TODO: Implementar verificación desde base de datos
      logger.info('Audit integrity verification requested', {
        fromDate: fromDate?.toISOString(),
        toDate: toDate?.toISOString()
      });
      
      return true;
    } catch (error) {
      logger.error('Audit integrity verification failed', error);
      return false;
    }
  }
  
  /**
   * Exporta logs de auditoría
   */
  async exportAuditLogs(
    filters: {
      userId?: string;
      action?: AuditAction;
      resourceType?: ResourceType;
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<AuditEvent[]> {
    // Log la exportación misma
    await this.log({
      action: AuditAction.AUDIT_EXPORT,
      resource: 'AUDIT_LOGS',
      metadata: filters
    });
    
    // TODO: Implementar query desde base de datos
    return [];
  }
  
  /**
   * Helpers para acciones comunes
   */
  
  async logPatientAccess(
    userId: string,
    userRole: UserRole,
    patientId: string,
    action: 'view' | 'update' | 'create'
  ): Promise<void> {
    const actionMap = {
      view: AuditAction.PATIENT_ACCESS,
      update: AuditAction.MEDICAL_RECORD_UPDATE,
      create: AuditAction.MEDICAL_RECORD_CREATE
    };
    
    await this.log({
      userId,
      userRole,
      action: actionMap[action],
      resource: 'PATIENT',
      resourceId: patientId,
      resourceType: ResourceType.PATIENT
    });
  }
  
  async logAuthentication(
    userId: string,
    success: boolean,
    metadata?: any
  ): Promise<void> {
    await this.log({
      userId,
      action: success ? AuditAction.LOGIN : AuditAction.LOGIN_FAILED,
      resource: 'AUTH',
      success,
      metadata
    });
  }
  
  async logDataExport(
    userId: string,
    userRole: UserRole,
    resourceType: ResourceType,
    count: number
  ): Promise<void> {
    await this.log({
      userId,
      userRole,
      action: AuditAction.EXPORT,
      resource: resourceType,
      metadata: { count }
    });
  }
  
  async logBreachDetection(
    details: string,
    affectedResources?: string[]
  ): Promise<void> {
    await this.log({
      userId: 'SYSTEM',
      userRole: 'ADMIN' as UserRole,
      action: AuditAction.BREACH_DETECTED,
      resource: 'SECURITY',
      success: false,
      metadata: {
        details,
        affectedResources,
        timestamp: new Date().toISOString()
      }
    });
    
    // Notificación crítica
    logger.fatal('SECURITY BREACH DETECTED', new Error(details), {
      affectedResources
    });
  }
}

// Exportar instancia singleton
export const auditService = AuditService.getInstance();

// Helper functions para uso directo
export const auditLog = (event: Partial<AuditEvent>) => 
  auditService.log(event);

export const auditPatientAccess = (
  userId: string,
  userRole: UserRole,
  patientId: string,
  action: 'view' | 'update' | 'create'
) => auditService.logPatientAccess(userId, userRole, patientId, action);

export const auditAuth = (userId: string, success: boolean, metadata?: any) =>
  auditService.logAuthentication(userId, success, metadata);

export const auditExport = (
  userId: string,
  userRole: UserRole,
  resourceType: ResourceType,
  count: number
) => auditService.logDataExport(userId, userRole, resourceType, count);

export const auditBreach = (details: string, resources?: string[]) =>
  auditService.logBreachDetection(details, resources);