import { addDoc, collection, getFirebaseFirestore, serverTimestamp } from '../client';

import { logger } from '../utils/logger';
/**
 * 🏥 MEDICAL AUDIT SYSTEM
 * Sistema de auditoría automática para cumplimiento HIPAA
 * Registra todos los accesos a datos médicos (PHI)
 */

export interface MedicalAuditLog {
  // Información del usuario
  userId: string;
  userRole: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'COMPANY';
  userEmail: string;
  userName: string;

  // Información del acceso
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: 'PATIENT' | 'MEDICAL_RECORD' | 'PRESCRIPTION' | 'APPOINTMENT' | 'VITAL_SIGNS';
  resourceId: string;
  resourcePath: string;

  // Información médica específica
  patientId?: string;
  medicalRecordType?: 'DIAGNOSIS' | 'TREATMENT' | 'LAB_RESULT' | 'IMAGING' | 'PRESCRIPTION';

  // Justificación del acceso
  accessReason: string;
  accessJustification?: string;

  // Metadatos técnicos
  timestamp: any; // Firestore ServerTimestamp
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;

  // Información de la aplicación
  applicationContext: 'WEB_APP' | 'DOCTORS_APP' | 'PATIENTS_APP' | 'ADMIN_APP' | 'COMPANIES_APP';

  // Compliance flags
  hipaaCompliant: boolean;
  dataClassification: 'PHI' | 'PII' | 'PUBLIC' | 'INTERNAL';
  encryptionUsed: boolean;

  // Alertas de seguridad
  securityFlags?: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class MedicalAuditService {
  private static instance: MedicalAuditService;
  private firestore = getFirebaseFirestore();

  private constructor() {}

  public static getInstance(): MedicalAuditService {
    if (!MedicalAuditService.instance) {
      MedicalAuditService.instance = new MedicalAuditService();
    }
    return MedicalAuditService.instance;
  }

  /**
   * Registra un acceso a datos médicos PHI
   */
  public async logMedicalAccess(
    user: {
      uid: string;
      email: string;
      displayName?: string;
      role: string;
    },
    access: {
      action: MedicalAuditLog['action'];
      resourceType: MedicalAuditLog['resourceType'];
      resourceId: string;
      patientId?: string;
      reason: string;
      justification?: string;
    },
    context: {
      app: MedicalAuditLog['applicationContext'];
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
    },
  ): Promise<void> {
    try {
      // Determinar clasificación de datos
      const dataClassification = this.determineDataClassification(access.resourceType);

      // Evaluar nivel de riesgo
      const riskLevel = this.evaluateRiskLevel(access, user);

      // Detectar flags de seguridad
      const securityFlags = this.detectSecurityFlags(access, user, context);

      const auditLog: MedicalAuditLog = {
        // Usuario
        userId: user.uid,
        userRole: user.role as any,
        userEmail: user.email,
        userName: user.displayName || user.email.split('@')[0],

        // Acceso
        action: access.action,
        resourceType: access.resourceType,
        resourceId: access.resourceId,
        resourcePath: this.buildResourcePath(
          access.resourceType,
          access.resourceId,
          access.patientId,
        ),

        // Médico
        patientId: access.patientId,
        medicalRecordType: this.determineMedicalRecordType(access.resourceType),

        // Justificación
        accessReason: access.reason,
        accessJustification: access.justification,

        // Metadatos
        timestamp: serverTimestamp(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        sessionId: context.sessionId,

        // Aplicación
        applicationContext: context.app,

        // Compliance
        hipaaCompliant: this.isHIPAACompliant(access, user),
        dataClassification,
        encryptionUsed: true, // Siempre encriptado en Firestore

        // Seguridad
        securityFlags: securityFlags.length > 0 ? securityFlags : undefined,
        riskLevel,
      };

      // Guardar en colección de auditoría
      await addDoc(collection(this.firestore, 'auditLogs'), auditLog);

      // Si hay flags de seguridad, enviar alerta
      if (securityFlags.length > 0 || riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
        await this.sendSecurityAlert(auditLog);
      }

      logger.info(
        `🔍 Medical access logged: ${access.action} on ${access.resourceType} by ${user.role}`,
      );
    } catch (error) {
      logger.error('❌ Error logging medical access:', error);
      // En caso de error, no bloqueamos la operación pero la reportamos
      await this.reportAuditFailure(error, { user, access, context });
    }
  }

  /**
   * Genera información de auditoría para usar en reglas de Firestore
   */
  public generateAuditInfo(userId: string, reason: string): object {
    return {
      auditInfo: {
        accessedBy: userId,
        accessedAt: serverTimestamp(),
        reason: reason,
        timestamp: new Date().toISOString(), // Para debug
      },
    };
  }

  private determineDataClassification(resourceType: string): MedicalAuditLog['dataClassification'] {
    switch (resourceType) {
      case 'MEDICAL_RECORD':
      case 'PRESCRIPTION':
      case 'VITAL_SIGNS':
        return 'PHI'; // Protected Health Information
      case 'PATIENT':
        return 'PII'; // Personally Identifiable Information
      case 'APPOINTMENT':
        return 'PHI'; // Contains medical context
      default:
        return 'INTERNAL';
    }
  }

  private evaluateRiskLevel(
    access: { action: string; resourceType: string; patientId?: string },
    user: { role: string },
  ): MedicalAuditLog['riskLevel'] {
    let riskScore = 0;

    // Acciones más riesgosas
    if (access.action === 'DELETE') riskScore += 3;
    if (access.action === 'UPDATE') riskScore += 2;
    if (access.action === 'CREATE') riskScore += 1;

    // Recursos más sensibles
    if (access.resourceType === 'MEDICAL_RECORD') riskScore += 2;
    if (access.resourceType === 'PRESCRIPTION') riskScore += 2;

    // Roles menos privilegiados accediendo a datos sensibles
    if (user.role === 'PATIENT' && access.resourceType === 'MEDICAL_RECORD') riskScore += 1;

    // Acceso cross-patient (si no es el propio paciente)
    // Esta lógica se implementaría con más contexto

    if (riskScore >= 5) return 'CRITICAL';
    if (riskScore >= 3) return 'HIGH';
    if (riskScore >= 1) return 'MEDIUM';
    return 'LOW';
  }

  private detectSecurityFlags(access: any, user: any, context: any): string[] {
    const flags: string[] = [];

    // Acceso fuera de horario laboral
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      flags.push('AFTER_HOURS_ACCESS');
    }

    // Múltiples pacientes en corto tiempo
    // Esta lógica requeriría cache de accesos recientes

    // IP sospechosa o cambio de ubicación
    // Requeriría integración con servicio de geolocalización

    // User-Agent inusual
    if (context.userAgent && context.userAgent.includes('bot')) {
      flags.push('AUTOMATED_ACCESS');
    }

    // Acceso administrativo
    if (user.role === 'ADMIN') {
      flags.push('ADMIN_ACCESS');
    }

    return flags;
  }

  private buildResourcePath(resourceType: string, resourceId: string, patientId?: string): string {
    if (patientId && resourceType !== 'PATIENT') {
      return `/patients/${patientId}/${resourceType.toLowerCase()}/${resourceId}`;
    }
    return `/${resourceType.toLowerCase()}/${resourceId}`;
  }

  private determineMedicalRecordType(
    resourceType: string,
  ): MedicalAuditLog['medicalRecordType'] | undefined {
    switch (resourceType) {
      case 'MEDICAL_RECORD':
        return 'DIAGNOSIS';
      case 'PRESCRIPTION':
        return 'PRESCRIPTION';
      case 'VITAL_SIGNS':
        return 'LAB_RESULT';
      default:
        return undefined;
    }
  }

  private isHIPAACompliant(access: any, user: any): boolean {
    // Verificar que el acceso cumple con HIPAA
    // - Usuario autenticado
    // - Justificación médica
    // - Acceso autorizado por rol
    return !!(user.uid && access.reason && user.role);
  }

  private async sendSecurityAlert(auditLog: MedicalAuditLog): Promise<void> {
    try {
      // Enviar alerta al sistema de notificaciones
      await addDoc(collection(this.firestore, 'securityAlerts'), {
        type: 'MEDICAL_ACCESS_ALERT',
        severity: auditLog.riskLevel,
        message: `${auditLog.riskLevel} risk access detected`,
        auditLogId: auditLog.resourceId,
        userId: auditLog.userId,
        timestamp: serverTimestamp(),
        flags: auditLog.securityFlags,
        requiresReview: auditLog.riskLevel === 'HIGH' || auditLog.riskLevel === 'CRITICAL',
      });

      logger.info(`🚨 Security alert sent for ${auditLog.riskLevel} risk access`);
    } catch (error) {
      logger.error('❌ Error sending security alert:', error);
    }
  }

  private async reportAuditFailure(error: any, context: any): Promise<void> {
    try {
      // Reportar falla de auditoría (esto es crítico para compliance)
      await addDoc(collection(this.firestore, 'systemLogs'), {
        type: 'AUDIT_FAILURE',
        error: error.message,
        context: JSON.stringify(context),
        timestamp: serverTimestamp(),
        severity: 'CRITICAL', // Fallas de auditoría son siempre críticas
      });
    } catch (reportError) {
      logger.error('❌❌ CRITICAL: Could not report audit failure:', reportError);
      // En este punto podríamos enviar a un servicio externo de logging
    }
  }
}

// Export singleton instance
export const medicalAudit = MedicalAuditService.getInstance();

// Hook para React components
export function useAuditInfo(userId: string | undefined, reason: string) {
  if (!userId || !reason) {
    return {};
  }

  return medicalAudit.generateAuditInfo(userId, reason);
}
