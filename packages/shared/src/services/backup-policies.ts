import { BackupPolicy, BackupSchedule, RetentionPolicy, BackupTarget, EncryptionConfig, NotificationConfig } from './backup.service';

/**
 * Políticas de Backup Predefinidas
 * Cumple con requisitos HIPAA y mejores prácticas médicas
 */

// Política de retención HIPAA estándar
const HIPAA_RETENTION: RetentionPolicy = {
  daily: 7,       // 7 días de backups diarios
  weekly: 4,      // 4 semanas de backups semanales
  monthly: 12,    // 12 meses de backups mensuales
  yearly: 7,      // 7 años según HIPAA
  minimumBackups: 3 // Mínimo 3 backups siempre
};

// Política de retención Argentina (Ley 26.529)
const ARGENTINA_RETENTION: RetentionPolicy = {
  daily: 7,       // 7 días de backups diarios
  weekly: 4,      // 4 semanas de backups semanales
  monthly: 12,    // 12 meses de backups mensuales
  yearly: 10,     // 10 años según Ley 26.529
  minimumBackups: 3
};

// Encriptación estándar para datos médicos
const MEDICAL_ENCRYPTION: EncryptionConfig = {
  enabled: true,
  algorithm: 'aes-256-gcm',
  keyRotation: true,
  keyRotationDays: 90 // Rotar llaves cada 90 días
};

/**
 * Política de Backup Crítico (Tiempo Real)
 * Para datos críticos que requieren backup inmediato
 */
export const CRITICAL_BACKUP_POLICY: Omit<BackupPolicy, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Critical Medical Data',
  enabled: true,
  schedule: {
    type: 'hourly',
    frequency: 1, // Cada hora
    timezone: 'America/Argentina/Buenos_Aires'
  },
  retention: {
    daily: 7,
    weekly: 4,
    monthly: 6,
    yearly: 7,
    minimumBackups: 24 // 24 horas de backups mínimo
  },
  targets: [
    {
      type: 'firestore',
      collections: [
        'patients',
        'medical_records',
        'prescriptions',
        'emergency_contacts',
        'vital_signs'
      ]
    }
  ],
  encryption: MEDICAL_ENCRYPTION,
  notification: {
    onSuccess: false, // No notificar en cada backup exitoso (muy frecuente)
    onFailure: true,   // Siempre notificar fallos
    emails: ['it@altamedica.com', 'compliance@altamedica.com']
  }
};

/**
 * Política de Backup Diario
 * Para datos operacionales y administrativos
 */
export const DAILY_BACKUP_POLICY: Omit<BackupPolicy, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Daily Operational Backup',
  enabled: true,
  schedule: {
    type: 'daily',
    time: '03:00', // 3 AM
    timezone: 'America/Argentina/Buenos_Aires'
  },
  retention: HIPAA_RETENTION,
  targets: [
    {
      type: 'firestore',
      collections: [
        'users',
        'appointments',
        'invoices',
        'payments',
        'companies',
        'audit_logs',
        'notifications',
        'telemedicine_sessions'
      ]
    },
    {
      type: 'storage',
      buckets: ['medical-documents', 'lab-results', 'imaging']
    }
  ],
  encryption: MEDICAL_ENCRYPTION,
  notification: {
    onSuccess: true,
    onFailure: true,
    emails: ['it@altamedica.com'],
    webhookUrl: process.env.BACKUP_WEBHOOK_URL
  }
};

/**
 * Política de Backup Semanal Completo
 * Backup completo de toda la plataforma
 */
export const WEEKLY_FULL_BACKUP_POLICY: Omit<BackupPolicy, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Weekly Full Platform Backup',
  enabled: true,
  schedule: {
    type: 'weekly',
    dayOfWeek: 0, // Domingo
    time: '02:00', // 2 AM
    timezone: 'America/Argentina/Buenos_Aires'
  },
  retention: ARGENTINA_RETENTION, // Usar retención más estricta (10 años)
  targets: [
    {
      type: 'firestore',
      collections: ['*'], // Todas las colecciones
      excludePatterns: ['temp_*', 'cache_*']
    },
    {
      type: 'storage',
      buckets: ['*'] // Todos los buckets
    },
    {
      type: 'database',
      tables: ['*'] // Todas las tablas si se usa SQL
    }
  ],
  encryption: MEDICAL_ENCRYPTION,
  notification: {
    onSuccess: true,
    onFailure: true,
    emails: [
      'it@altamedica.com',
      'compliance@altamedica.com',
      'cto@altamedica.com'
    ]
  }
};

/**
 * Política de Backup de Cumplimiento Mensual
 * Para auditorías y cumplimiento regulatorio
 */
export const COMPLIANCE_BACKUP_POLICY: Omit<BackupPolicy, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Monthly Compliance Backup',
  enabled: true,
  schedule: {
    type: 'monthly',
    dayOfMonth: 1, // Primer día del mes
    time: '00:00',
    timezone: 'America/Argentina/Buenos_Aires'
  },
  retention: {
    daily: 0,      // No aplica
    weekly: 0,     // No aplica
    monthly: 12,   // 12 meses
    yearly: 10,    // 10 años para cumplimiento
    minimumBackups: 12
  },
  targets: [
    {
      type: 'firestore',
      collections: [
        'audit_logs',
        'business_associate_agreements',
        'consent_forms',
        'hipaa_compliance',
        'data_breach_logs',
        'access_logs',
        'security_events'
      ]
    }
  ],
  encryption: {
    ...MEDICAL_ENCRYPTION,
    keyRotation: false // No rotar llaves para backups de cumplimiento
  },
  notification: {
    onSuccess: true,
    onFailure: true,
    emails: [
      'compliance@altamedica.com',
      'legal@altamedica.com',
      'cto@altamedica.com'
    ]
  }
};

/**
 * Política de Backup de Desarrollo
 * Para entornos de desarrollo y staging
 */
export const DEVELOPMENT_BACKUP_POLICY: Omit<BackupPolicy, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Development Environment Backup',
  enabled: false, // Deshabilitado por defecto
  schedule: {
    type: 'daily',
    time: '22:00',
    timezone: 'America/Argentina/Buenos_Aires'
  },
  retention: {
    daily: 3,
    weekly: 1,
    monthly: 1,
    yearly: 0,
    minimumBackups: 1
  },
  targets: [
    {
      type: 'firestore',
      collections: ['*'],
      excludePatterns: ['test_*', 'debug_*']
    }
  ],
  encryption: {
    enabled: false, // Opcional para desarrollo
    algorithm: 'aes-256-gcm',
    keyRotation: false,
    keyRotationDays: 0
  },
  notification: {
    onSuccess: false,
    onFailure: true,
    emails: ['dev@altamedica.com']
  }
};

/**
 * Obtiene la política apropiada según el entorno
 */
export function getDefaultPolicies(): Array<Omit<BackupPolicy, 'id' | 'createdAt' | 'updatedAt'>> {
  const environment = process.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return [
        CRITICAL_BACKUP_POLICY,
        DAILY_BACKUP_POLICY,
        WEEKLY_FULL_BACKUP_POLICY,
        COMPLIANCE_BACKUP_POLICY
      ];
    
    case 'staging':
      return [
        DAILY_BACKUP_POLICY,
        WEEKLY_FULL_BACKUP_POLICY
      ];
    
    case 'development':
    default:
      return [
        DEVELOPMENT_BACKUP_POLICY
      ];
  }
}

/**
 * Valida que una política cumple con requisitos HIPAA
 */
export function validateHIPAACompliance(policy: BackupPolicy): {
  isCompliant: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Verificar encriptación
  if (!policy.encryption.enabled) {
    issues.push('Encriptación debe estar habilitada para cumplimiento HIPAA');
  }

  // Verificar retención mínima (6 años para HIPAA)
  if (policy.retention.yearly < 6) {
    issues.push('Retención anual debe ser mínimo 6 años para HIPAA');
  }

  // Verificar que incluya audit logs
  const hasAuditLogs = policy.targets.some(target => 
    target.type === 'firestore' && 
    target.collections?.includes('audit_logs')
  );
  
  if (!hasAuditLogs) {
    issues.push('Debe incluir backup de audit_logs para cumplimiento');
  }

  // Verificar notificaciones de fallo
  if (!policy.notification.onFailure) {
    issues.push('Notificación de fallos debe estar habilitada');
  }

  // Verificar frecuencia mínima
  if (policy.schedule.type === 'custom' && policy.schedule.frequency && policy.schedule.frequency > 24) {
    issues.push('Frecuencia de backup no debe exceder 24 horas para datos críticos');
  }

  return {
    isCompliant: issues.length === 0,
    issues
  };
}

/**
 * Calcula el espacio estimado requerido para una política
 */
export function estimateStorageRequirement(
  policy: BackupPolicy,
  averageBackupSize: number // en MB
): {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  total: number;
} {
  const retention = policy.retention;
  
  // Calcular número de backups según frecuencia
  let backupsPerDay = 1;
  
  if (policy.schedule.type === 'hourly') {
    backupsPerDay = 24 / (policy.schedule.frequency || 1);
  }

  const daily = retention.daily * backupsPerDay * averageBackupSize;
  const weekly = retention.weekly * averageBackupSize;
  const monthly = retention.monthly * averageBackupSize;
  const yearly = retention.yearly * averageBackupSize;
  
  const total = daily + weekly + monthly + yearly;

  return {
    daily,
    weekly,
    monthly,
    yearly,
    total
  };
}

/**
 * Genera recomendaciones de políticas basadas en el tipo de organización
 */
export function recommendPolicies(organizationType: 'hospital' | 'clinic' | 'laboratory' | 'pharmacy'): string[] {
  const recommendations: string[] = [];

  switch (organizationType) {
    case 'hospital':
      recommendations.push(
        'Use política CRITICAL para datos de emergencia',
        'Configure backup horario para UCI y emergencias',
        'Implemente política COMPLIANCE mensual obligatoria',
        'Considere backup en tiempo real para quirófanos'
      );
      break;
    
    case 'clinic':
      recommendations.push(
        'Use política DAILY para datos operacionales',
        'Configure backup semanal completo',
        'Implemente retención de 10 años para historias clínicas'
      );
      break;
    
    case 'laboratory':
      recommendations.push(
        'Priorice backup de resultados de laboratorio',
        'Configure retención extendida para estudios críticos',
        'Implemente backup inmediato para resultados urgentes'
      );
      break;
    
    case 'pharmacy':
      recommendations.push(
        'Configure backup diario de recetas',
        'Implemente retención según normativa de psicotrópicos',
        'Priorice backup de inventario y dispensación'
      );
      break;
  }

  // Recomendaciones generales
  recommendations.push(
    'Pruebe restauración mensualmente',
    'Mantenga al menos una copia offsite',
    'Documente procedimientos de recuperación',
    'Capacite al personal en procedimientos de emergencia'
  );

  return recommendations;
}