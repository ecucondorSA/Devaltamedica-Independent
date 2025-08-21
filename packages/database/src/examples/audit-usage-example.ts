/**
 * 🏥 EJEMPLO DE USO - SISTEMA DE AUDITORÍA LEY 26.529
 * Demostración práctica del sistema de audit logs
 * Para integración en middleware del api-server
 */

import { auditLogRepository } from '../repositories/AuditLogRepository';
import { AUDIT_ACTIONS, AUDIT_RESOURCES, createAuditLogEntry, AuditAction } from '@altamedica/types';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
/**
 * EJEMPLO 1: Auditar acceso a historia clínica de paciente
 * Cumple con Ley 26.529 Art. 15 - "acceso con clave de identificación"
 */
export async function auditPatientRecordAccess(
  doctorId: string,
  patientId: string,
  medicalRecordId: string,
  request: {
    ip?: string;
    userAgent?: string;
    sessionId?: string;
  }
) {
  try {
    const auditEntry = await auditLogRepository.create({
      // OBLIGATORIO - Identificación del actor (Art. 15)
      actorId: doctorId,
      actorType: 'doctor',
      
      // OBLIGATORIO - Registro de la acción (Art. 15)
      action: AUDIT_ACTIONS.READ,
      resource: AUDIT_RESOURCES.MEDICAL_RECORD,
      resourceId: medicalRecordId,
      
      // OBLIGATORIO - Para logs médicos según compliance
      patientId: patientId,
      
      // Información adicional para trazabilidad
      ip: request.ip,
      userAgent: request.userAgent,
      sessionId: request.sessionId,
      
      // Estado de la operación
      success: true,
      
      // Metadatos contextuales (sin PHI)
      metadata: {
        module: 'doctors_app',
        feature: 'patient_history_view',
        accessTime: new Date().toISOString()
      }
    });

    logger.info('✅ Acceso a historia clínica auditado:', auditEntry.id);
    return auditEntry;
    
  } catch (error) {
    logger.error('❌ Error auditando acceso a historia clínica:', error);
    
    // CRÍTICO: Crear log de emergencia si falla auditoría principal
    try {
      await auditLogRepository.create({
        actorId: 'system_emergency',
        actorType: 'system',
        action: AUDIT_ACTIONS.ACCESS_DENIED,
        resource: AUDIT_RESOURCES.SYSTEM,
        success: false,
        errorMessage: `Failed to audit medical record access: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: {
          originalDoctorId: doctorId,
          originalPatientId: patientId,
          originalRecordId: medicalRecordId,
          errorType: 'audit_failure'
        }
      });
    } catch (emergencyError) {
      logger.error('🚨 CRÍTICO: Emergency audit también falló:', emergencyError);
    }
    
    throw error;
  }
}

/**
 * EJEMPLO 2: Auditar modificación de datos médicos
 * Cumple con Ley 26.529 Art. 15 - "registro de modificaciones"
 */
export async function auditMedicalDataUpdate(
  actorId: string,
  actorType: 'doctor' | 'admin',
  patientId: string,
  resource: 'prescription' | 'lab_result' | 'appointment',
  resourceId: string,
  changes: string[],
  request: { ip?: string; userAgent?: string; sessionId?: string }
) {
  try {
    const auditEntry = await auditLogRepository.create({
      actorId,
      actorType,
      action: AUDIT_ACTIONS.UPDATE,
      resource: resource as any,
      resourceId,
      patientId,
      ip: request.ip,
      userAgent: request.userAgent,
      sessionId: request.sessionId,
      success: true,
      metadata: {
        modifiedFields: changes,
        updateTimestamp: new Date().toISOString(),
        complianceNote: 'Modificación registrada según Ley 26.529 Art. 15'
      }
    });

    logger.info('✅ Modificación de datos médicos auditada:', auditEntry.id);
    return auditEntry;
    
  } catch (error) {
    logger.error('❌ Error auditando modificación:', error);
    throw error;
  }
}

/**
 * EJEMPLO 3: Auditar exportación de datos (Habeas Data)
 * Cumple con Ley 25.326 - Derecho de acceso a datos personales
 */
export async function auditDataExport(
  requestorId: string,
  requestorType: 'patient' | 'admin',
  patientId: string,
  exportType: 'full_history' | 'medical_records' | 'audit_trail',
  request: { ip?: string; userAgent?: string; sessionId?: string }
) {
  try {
    const auditEntry = await auditLogRepository.create({
      actorId: requestorId,
      actorType: requestorType,
      action: AUDIT_ACTIONS.EXPORT,
      resource: AUDIT_RESOURCES.PATIENT,
      resourceId: patientId,
      patientId: patientId, // Mismo paciente en este caso
      ip: request.ip,
      userAgent: request.userAgent,
      sessionId: request.sessionId,
      success: true,
      metadata: {
        exportType,
        legalBasis: 'Ley 25.326 - Habeas Data',
        exportTimestamp: new Date().toISOString(),
        retentionPeriod: '10_years' // Según Ley 26.529
      }
    });

    logger.info('✅ Exportación de datos auditada:', auditEntry.id);
    return auditEntry;
    
  } catch (error) {
    logger.error('❌ Error auditando exportación:', error);
    throw error;
  }
}

/**
 * EJEMPLO 4: Auditar intento de acceso no autorizado
 * Importante para detectar posibles violaciones de seguridad
 */
export async function auditUnauthorizedAccess(
  attemptedActorId: string,
  attemptedResource: string,
  resourceId: string,
  reason: string,
  request: { ip?: string; userAgent?: string; sessionId?: string }
) {
  try {
    const auditEntry = await auditLogRepository.create({
      actorId: attemptedActorId || 'unknown',
      actorType: 'system', // Sistema detectó el intento
      action: AUDIT_ACTIONS.ACCESS_DENIED,
      resource: attemptedResource as any,
      resourceId,
      ip: request.ip,
      userAgent: request.userAgent,
      sessionId: request.sessionId,
      success: false,
      errorMessage: reason,
      metadata: {
        securityEvent: true,
        alertLevel: 'medium',
        investigationRequired: true,
        detectionTime: new Date().toISOString()
      }
    });

    logger.info('⚠️ Intento de acceso no autorizado auditado:', auditEntry.id);
    return auditEntry;
    
  } catch (error) {
    logger.error('❌ Error auditando acceso no autorizado:', error);
    throw error;
  }
}

/**
 * EJEMPLO 5: Consultar historial de auditoría de un paciente
 * Para cumplimiento de solicitudes Habeas Data
 */
export async function getPatientAuditReport(patientId: string) {
  try {
    logger.info(`📋 Generando reporte de auditoría para paciente: ${patientId}`);
    
    // Obtener historial completo del paciente
    const auditHistory = await auditLogRepository.exportPatientAuditHistory(patientId);
    
    // Agrupar por tipo de acción
    const actionSummary = auditHistory.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Obtener estadísticas del último mes
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const monthlyStats = await auditLogRepository.getStats({
      start: lastMonth,
      end: new Date()
    });
    
    const report = {
      patientId,
      reportGeneratedAt: new Date().toISOString(),
      legalCompliance: 'Ley 25.326 (Habeas Data) y Ley 26.529 (Derechos del Paciente)',
      totalAuditEntries: auditHistory.length,
      actionSummary,
      timeRange: {
        oldest: auditHistory[auditHistory.length - 1]?.timestamp,
        newest: auditHistory[0]?.timestamp
      },
      monthlyActivity: {
        totalAccesses: monthlyStats.totalEntries,
        uniqueActors: monthlyStats.uniqueActors,
        failedAttempts: monthlyStats.failedActions
      },
      auditTrail: auditHistory.map(log => ({
        timestamp: log.timestamp,
        actor: log.actorId,
        actorType: log.actorType,
        action: log.action,
        resource: log.resource,
        success: log.success,
        ip: log.ip?.replace(/\.\d+$/, '.***'), // Parcial para privacidad
        sessionId: log.sessionId
      }))
    };
    
    logger.info('✅ Reporte de auditoría generado exitosamente');
    return report;
    
  } catch (error) {
    logger.error('❌ Error generando reporte de auditoría:', error);
    throw error;
  }
}

/**
 * EJEMPLO 6: Middleware para api-server
 * Integración automática con rutas de API
 */
export function createAuditMiddleware() {
  return async (req: any, res: any, next: any) => {
    try {
      // Extraer información del request
      const actorId = req.user?.id || req.headers['x-actor-id'] || 'anonymous';
      const actorType = req.user?.role || 'unknown';
      const action = mapHttpMethodToAuditAction(req.method);
      const resource = extractResourceFromPath(req.path);
      const resourceId = req.params?.id;
      const patientId = req.params?.patientId || req.body?.patientId;
      
      // Información de la sesión
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const sessionId = req.sessionID || req.headers['x-session-id'];
      
      // Crear audit log antes de procesar la request
      const auditPromise = auditLogRepository.create({
        actorId,
        actorType,
        action,
        resource,
        resourceId,
        patientId,
        ip,
        userAgent,
        sessionId,
        success: true, // Se actualizará en caso de error
        metadata: {
          method: req.method,
          path: req.path,
          timestamp: new Date().toISOString()
        }
      });
      
      // Continuar con el procesamiento
      next();
      
      // Await audit log en background (no bloquear response)
      auditPromise.catch(error => {
        logger.error('❌ Error en audit middleware:', error);
      });
      
    } catch (error) {
      logger.error('❌ Error crítico en audit middleware:', error);
      // No bloquear la request por errores de auditoría
      next();
    }
  };
}

/**
 * Utilidades auxiliares para el middleware
 */
function mapHttpMethodToAuditAction(method: string): AuditAction {
  const mapping: Record<string, AuditAction> = {
    'GET': AUDIT_ACTIONS.READ,
    'POST': AUDIT_ACTIONS.CREATE,
    'PUT': AUDIT_ACTIONS.UPDATE,
    'PATCH': AUDIT_ACTIONS.UPDATE,
    'DELETE': AUDIT_ACTIONS.DELETE
  };
  
  return mapping[method.toUpperCase()] || AUDIT_ACTIONS.READ;
}

function extractResourceFromPath(path: string) {
  // Mapear rutas de API a recursos de auditoría
  if (path.includes('/patients')) return AUDIT_RESOURCES.PATIENT;
  if (path.includes('/medical-records')) return AUDIT_RESOURCES.MEDICAL_RECORD;
  if (path.includes('/appointments')) return AUDIT_RESOURCES.APPOINTMENT;
  if (path.includes('/prescriptions')) return AUDIT_RESOURCES.PRESCRIPTION;
  if (path.includes('/lab-results')) return AUDIT_RESOURCES.LAB_RESULT;
  if (path.includes('/telemedicine')) return AUDIT_RESOURCES.TELEMEDICINE_SESSION;
  if (path.includes('/users')) return AUDIT_RESOURCES.USER_PROFILE;
  if (path.includes('/billing')) return AUDIT_RESOURCES.BILLING;
  
  return AUDIT_RESOURCES.SYSTEM;
}

// Exportar ejemplos de uso para documentación
export const AUDIT_USAGE_EXAMPLES = {
  patientRecordAccess: auditPatientRecordAccess,
  medicalDataUpdate: auditMedicalDataUpdate,
  dataExport: auditDataExport,
  unauthorizedAccess: auditUnauthorizedAccess,
  patientReport: getPatientAuditReport,
  middleware: createAuditMiddleware
};

/**
 * EJEMPLO COMPLETO DE INTEGRACIÓN
 * Cómo usar el sistema de auditoría en una ruta típica
 */
export async function exampleDoctorPatientView(
  doctorId: string,
  patientId: string,
  request: { ip: string; userAgent: string; sessionId: string }
) {
  try {
    logger.info('🏥 Procesando acceso a vista de paciente...');
    
    // 1. Auditar el acceso
    await auditPatientRecordAccess(
      doctorId,
      patientId,
      `medical_record_${patientId}`,
      request
    );
    
    // 2. Procesar la lógica de negocio
    // ... obtener datos del paciente ...
    
    // 3. Si todo va bien, el audit log ya está registrado
    logger.info('✅ Vista de paciente procesada y auditada exitosamente');
    
    return {
      success: true,
      auditCompliance: 'Ley 26.529 Art. 15',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    // 4. Si hay error, auditar el intento fallido
    await auditUnauthorizedAccess(
      doctorId,
      AUDIT_RESOURCES.PATIENT,
      patientId,
      `Error accessing patient view: ${error instanceof Error ? error.message : 'Unknown error'}`,
      request
    );
    
    throw error;
  }
}