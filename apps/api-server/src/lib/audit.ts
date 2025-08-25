import { z } from 'zod';

import { logger } from '@altamedica/shared';
// Interfaces para auditoría
interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success: boolean;
  error?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'medical' | 'compliance';
  containsPHI: boolean;
  retentionPeriod: number; // días
}

interface AuditConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retentionDays: number;
  logPHI: boolean;
  destinations: ('database' | 'file' | 'syslog' | 'webhook')[];
  encryptLogs: boolean;
  realTimeAlerts: boolean;
}

// Esquema de validación para audit log
const auditLogSchema = z.object({
  action: z.string().min(1).max(100),
  userId: z.string().min(1),
  resource: z.string().min(1).max(50),
  resourceId: z.string().optional(),
  details: z.any(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  sessionId: z.string().optional(),
  success: z.boolean().optional().default(true),
  error: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  category: z.enum(['authentication', 'authorization', 'data_access', 'data_modification', 'system', 'medical', 'compliance']).optional().default('system'),
  containsPHI: z.boolean().optional().default(false)
});

// Configuración de auditoría
const auditConfig: AuditConfig = {
  enabled: true,
  logLevel: 'info',
  retentionDays: 2555, // 7 años para compliance médico
  logPHI: true,
  destinations: ['database', 'file'],
  encryptLogs: true,
  realTimeAlerts: true
};

// Acciones críticas que requieren auditoría
const criticalActions = [
  'login',
  'login_failed',
  'logout',
  'password_changed',
  'account_locked',
  'patient_data_accessed',
  'patient_data_modified',
  'medical_record_accessed',
  'medical_record_modified',
  'prescription_created',
  'prescription_modified',
  'appointment_created',
  'appointment_modified',
  'telemedicine_session_started',
  'telemedicine_session_ended',
  'admin_action',
  'system_configuration_changed',
  'backup_created',
  'backup_restored',
  'user_created',
  'user_deleted',
  'role_assigned',
  'permission_granted',
  'data_export',
  'data_import',
  'compliance_report_generated'
];

// Función principal para logging de auditoría
export async function auditLog(entry: {
  action: string;
  userId: string;
  resource: string;
  resourceId?: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  success?: boolean;
  error?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'medical' | 'compliance';
  containsPHI?: boolean;
}): Promise<void> {
  try {
    if (!auditConfig.enabled) {
      return;
    }

    // Validar entrada
    const validation = auditLogSchema.safeParse(entry);
    if (!validation.success) {
      logger.error('Invalid audit log entry', undefined, validation.error);
      return;
    }

    const validEntry = validation.data;

    // Obtener información del usuario
    const userInfo = await getUserInfo(validEntry.userId);

    // Determinar categoría y severidad automáticamente
    const { category, severity, containsPHI } = categorizeAction(validEntry.action);

    // Crear entrada de auditoría
    const auditEntry: AuditLogEntry = {
      id: generateAuditId(),
      timestamp: new Date().toISOString(),
      action: validEntry.action,
      userId: validEntry.userId,
      userEmail: userInfo?.email,
      userRole: userInfo?.roles?.join(','),
      resource: validEntry.resource,
      resourceId: validEntry.resourceId,
      details: validEntry.details,
      ipAddress: validEntry.ipAddress,
      userAgent: validEntry.userAgent,
      sessionId: validEntry.sessionId,
      success: validEntry.success ?? true,
      error: validEntry.error,
      severity: (validEntry.severity || severity) as 'low' | 'medium' | 'high' | 'critical',
      category: (validEntry.category || category) as 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'medical' | 'compliance',
      containsPHI: validEntry.containsPHI || containsPHI,
      retentionPeriod: getRetentionPeriod(category, containsPHI)
    };

    // Encriptar logs si está habilitado
    if (auditConfig.encryptLogs) {
      auditEntry.details = await encryptSensitiveData(auditEntry.details);
    }

    // Enviar a destinos configurados
    await writeToDestinations(auditEntry);

    // Alertas en tiempo real para acciones críticas
    if (auditConfig.realTimeAlerts && isCriticalAction(validEntry.action)) {
      await sendRealTimeAlert(auditEntry);
    }

    // Logging en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      logger.info(`[AUDIT] ${auditEntry.action} by ${auditEntry.userEmail} on ${auditEntry.resource}`, undefined, {
        details: auditEntry.details,
        severity: auditEntry.severity
      });
    }

  } catch (error) {
    logger.error('Audit logging failed', undefined, error);
    // En caso de error, loguear en sistema de emergencia
    await emergencyAuditLog(entry, error instanceof Error ? error : new Error(String(error)));
  }
}

// Función para auditoría de autenticación
export async function auditAuthentication(action: string, userId: string, success: boolean, details: any, ipAddress?: string, userAgent?: string): Promise<void> {
  await auditLog({
    action,
    userId,
    resource: 'authentication',
    details,
    ipAddress,
    userAgent,
    success,
    category: 'authentication',
    severity: success ? 'low' : 'high',
    containsPHI: false
  });
}

// Función para auditoría de acceso a datos médicos
export async function auditMedicalDataAccess(action: string, userId: string, patientId: string, details: any, ipAddress?: string): Promise<void> {
  await auditLog({
    action,
    userId,
    resource: 'medical_data',
    resourceId: patientId,
    details,
    ipAddress,
    category: 'data_access',
    severity: 'high',
    containsPHI: true
  });
}

// Función para auditoría de modificación de datos médicos
export async function auditMedicalDataModification(action: string, userId: string, patientId: string, changes: any, ipAddress?: string): Promise<void> {
  await auditLog({
    action,
    userId,
    resource: 'medical_data',
    resourceId: patientId,
    details: { changes },
    ipAddress,
    category: 'data_modification',
    severity: 'critical',
    containsPHI: true
  });
}

// Función para auditoría de compliance
export async function auditCompliance(action: string, userId: string, complianceType: string, details: any): Promise<void> {
  await auditLog({
    action,
    userId,
    resource: 'compliance',
    resourceId: complianceType,
    details,
    category: 'compliance',
    severity: 'high',
    containsPHI: false
  });
}

// Función para consultar logs de auditoría
export async function getAuditLogs(filters: {
  userId?: string;
  resource?: string;
  action?: string;
  category?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  containsPHI?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  try {
    // Simular consulta a base de datos (reemplazar con consulta real)
    const mockLogs = await getMockAuditLogs(filters);
    return mockLogs;
  } catch (error) {
    logger.error('Error fetching audit logs:', undefined, error);
    return { logs: [], total: 0 };
  }
}

// Función para generar reporte de auditoría
export async function generateAuditReport(params: {
  startDate: string;
  endDate: string;
  userId?: string;
  category?: string;
  format: 'json' | 'csv' | 'pdf';
}): Promise<{ reportId: string; downloadUrl: string }> {
  try {
    const reportId = `audit-report-${Date.now()}`;

    // Obtener logs para el período
    const logs = await getAuditLogs({
      userId: params.userId,
      category: params.category,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: 10000
    });

    // Generar reporte según el formato
    const report = await generateReport(logs.logs, params.format);

    // Guardar reporte
    const downloadUrl = await saveReport(reportId, report, params.format);

    // Auditar la generación del reporte
    await auditLog({
      action: 'audit_report_generated',
      userId: params.userId || 'system',
      resource: 'audit_reports',
      resourceId: reportId,
      details: {
        period: { start: params.startDate, end: params.endDate },
        format: params.format,
        recordCount: logs.total
      },
      category: 'compliance',
      severity: 'medium'
    });

    return { reportId, downloadUrl };

  } catch (error) {
    logger.error('Error generating audit report:', undefined, error);
    throw error;
  }
}

// Funciones auxiliares
async function getUserInfo(userId: string): Promise<any> {
  // Simular obtener información del usuario
  const mockUsers: Record<string, { email: string; roles: string[] }> = {
    '1': { email: 'admin@altamedica.com', roles: ['admin'] },
    '2': { email: 'doctor@altamedica.com', roles: ['doctor'] },
    '3': { email: 'patient@altamedica.com', roles: ['patient'] }
  };

  return mockUsers[userId] || { email: 'unknown', roles: ['unknown'] };
}

function categorizeAction(action: string): { category: string; severity: string; containsPHI: boolean } {
  const actionCategories: Record<string, { category: string; severity: string; containsPHI: boolean }> = {
    'login': { category: 'authentication', severity: 'low', containsPHI: false },
    'login_failed': { category: 'authentication', severity: 'high', containsPHI: false },
    'logout': { category: 'authentication', severity: 'low', containsPHI: false },
    'patient_data_accessed': { category: 'data_access', severity: 'high', containsPHI: true },
    'patient_data_modified': { category: 'data_modification', severity: 'critical', containsPHI: true },
    'medical_record_accessed': { category: 'medical', severity: 'high', containsPHI: true },
    'medical_record_modified': { category: 'medical', severity: 'critical', containsPHI: true },
    'prescription_created': { category: 'medical', severity: 'high', containsPHI: true },
    'admin_action': { category: 'system', severity: 'high', containsPHI: false },
    'compliance_report_generated': { category: 'compliance', severity: 'medium', containsPHI: false }
  };

  return actionCategories[action] || { category: 'system', severity: 'medium', containsPHI: false };
}

function getRetentionPeriod(category: string, containsPHI: boolean): number {
  if (containsPHI || category === 'medical') {
    return 2555; // 7 años para datos médicos
  }

  if (category === 'compliance') {
    return 1825; // 5 años para compliance
  }

  return 1095; // 3 años para otros logs
}

async function encryptSensitiveData(data: any): Promise<any> {
  // Simular encriptación de datos sensibles
  if (typeof data === 'object' && data !== null) {
    const sensitiveFields = ['password', 'ssn', 'medical_record', 'diagnosis'];
    const encrypted = { ...data };

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = `[ENCRYPTED:${field}]`;
      }
    }

    return encrypted;
  }

  return data;
}

async function writeToDestinations(entry: AuditLogEntry): Promise<void> {
  for (const destination of auditConfig.destinations) {
    try {
      switch (destination) {
        case 'database':
          await writeToDatabase(entry);
          break;
        case 'file':
          await writeToFile(entry);
          break;
        case 'syslog':
          await writeToSyslog(entry);
          break;
        case 'webhook':
          await writeToWebhook(entry);
          break;
      }
    } catch (error) {
      logger.error(`Failed to write audit log to ${destination}:`, undefined, error);
    }
  }
}

async function writeToDatabase(entry: AuditLogEntry): Promise<void> {
  // Simular inserción en base de datos
  logger.info(`[DB] Audit log saved: ${entry.id}`);
}

async function writeToFile(entry: AuditLogEntry): Promise<void> {
  // Simular escritura a archivo
  const logLine = `${entry.timestamp} [${entry.severity.toUpperCase()}] ${entry.action} by ${entry.userEmail} on ${entry.resource} - ${JSON.stringify(entry.details)}\n`;
  logger.info(`[FILE] ${logLine}`);
}

async function writeToSyslog(entry: AuditLogEntry): Promise<void> {
  // Simular envío a syslog
  logger.info(`[SYSLOG] Audit log sent: ${entry.id}`);
}

async function writeToWebhook(entry: AuditLogEntry): Promise<void> {
  // Simular envío a webhook
  logger.info(`[WEBHOOK] Audit log sent: ${entry.id}`);
}

function isCriticalAction(action: string): boolean {
  return criticalActions.includes(action);
}

async function sendRealTimeAlert(entry: AuditLogEntry): Promise<void> {
  // Simular envío de alerta en tiempo real
  logger.info(`[ALERT] Critical action detected: ${entry.action} by ${entry.userEmail}`);
}

async function emergencyAuditLog(entry: any, error: Error): Promise<void> {
  // Sistema de emergencia para audit logs
  logger.error('[EMERGENCY AUDIT]', undefined, {
    originalEntry: entry,
    error: error.message,
    timestamp: new Date().toISOString()
  });
}

async function getMockAuditLogs(filters: any): Promise<{ logs: AuditLogEntry[]; total: number }> {
  // Simular consulta de logs
  const mockLogs: AuditLogEntry[] = [
    {
      id: 'audit-1',
      timestamp: new Date().toISOString(),
      action: 'login',
      userId: '2',
      userEmail: 'doctor@altamedica.com',
      userRole: 'doctor',
      resource: 'authentication',
      details: { ipAddress: '192.168.1.100' },
      success: true,
      severity: 'low',
      category: 'authentication',
      containsPHI: false,
      retentionPeriod: 1095
    }
  ];

  return { logs: mockLogs, total: mockLogs.length };
}

async function generateReport(logs: AuditLogEntry[], format: string): Promise<any> {
  // Simular generación de reporte
  switch (format) {
    case 'json':
      return JSON.stringify(logs, null, 2);
    case 'csv':
      return convertToCSV(logs);
    case 'pdf':
      return generatePDF(logs);
    default:
      return logs;
  }
}

function convertToCSV(logs: AuditLogEntry[]): string {
  const headers = ['timestamp', 'action', 'userEmail', 'resource', 'severity', 'success'];
  const csv = [headers.join(',')];

  for (const log of logs) {
    const row = headers.map(header => {
      const key = header as keyof AuditLogEntry;
      // dynamic access of AuditLogEntry
      // @ts-ignore
      return (log[key] as any) || '';
    });
    csv.push(row.join(','));
  }

  return csv.join('\n');
}

function generatePDF(logs: AuditLogEntry[]): string {
  // Simular generación de PDF
  return `[PDF CONTENT] Audit Report with ${logs.length} entries`;
}

async function saveReport(reportId: string, report: any, format: string): Promise<string> {
  // Simular guardado de reporte
  return `/api/audit/reports/${reportId}/download?format=${format}`;
}

function generateAuditId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default {
  auditLog,
  auditAuthentication,
  auditMedicalDataAccess,
  auditMedicalDataModification,
  auditCompliance,
  getAuditLogs,
  generateAuditReport
};
