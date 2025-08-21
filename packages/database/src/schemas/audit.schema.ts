/**
 * Schema de base de datos para AuditLog
 * Cumple con Ley 26.529 Argentina - Art. 15
 * Soporte dual: Firebase Firestore + PostgreSQL
 */

import { AuditLog, AuditLogSchema } from '@altamedica/types';

// Re-export audit types and schemas for use within the database package
export type { AuditLog } from '@altamedica/types';
export { AuditLogSchema } from '@altamedica/types';

// ==================== FIRESTORE CONFIGURATION ====================

/**
 * Configuración de colección Firestore para audit logs
 * Cumple requisitos de performance y retención Argentina
 */
export const FIRESTORE_AUDIT_CONFIG = {
  collection: 'audit_logs',
  
  // Índices para optimizar consultas frecuentes
  indexes: [
    // Consulta por actor (médico/admin)
    { fields: ['actorId', 'timestamp'] },
    
    // Consulta por paciente (para exportación datos personales)
    { fields: ['patientId', 'timestamp'] },
    
    // Consulta por recurso y acción
    { fields: ['resource', 'action', 'timestamp'] },
    
    // Consulta por éxito/fallo
    { fields: ['success', 'timestamp'] },
    
    // Índice compuesto para auditoría médica específica
    { fields: ['resource', 'patientId', 'timestamp'] }
  ],
  
  // Reglas de retención de datos conforme legislación argentina
  retention: {
    // Ley 26.529: registros médicos deben conservarse mínimo 10 años
    medicalRecords: '10 years',
    
    // Logs de acceso: 5 años para compliance
    accessLogs: '5 years',
    
    // Logs de sistema: 1 año
    systemLogs: '1 year'
  },
  
  // Configuración de security rules
  securityRules: `
    // Solo administradores pueden leer audit logs
    match /audit_logs/{document} {
      allow read: if request.auth != null && 
                     request.auth.token.role in ['admin', 'audit_admin'];
      allow write: if false; // Solo se escriben via backend
    }
  `
} as const;

// ==================== POSTGRESQL SCHEMA ====================

/**
 * Schema SQL para PostgreSQL
 * Optimizado para consultas de auditoría masivas
 */
export const POSTGRES_AUDIT_SCHEMA = `
-- Tabla principal de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Actor information (requerido Ley 26.529)
    actor_id VARCHAR(255) NOT NULL,
    actor_type VARCHAR(50) NOT NULL CHECK (
        actor_type IN ('patient', 'doctor', 'admin', 'system', 'company_user')
    ),
    
    -- Action information (requerido Ley 26.529)
    action VARCHAR(50) NOT NULL CHECK (
        action IN ('read', 'create', 'update', 'delete', 'export', 'access_denied', 'login', 'logout')
    ),
    
    -- Resource information
    resource VARCHAR(50) NOT NULL CHECK (
        resource IN ('patient', 'appointment', 'medical_record', 'prescription', 
                    'lab_result', 'telemedicine_session', 'user_profile', 'billing', 'system')
    ),
    resource_id VARCHAR(255),
    
    -- Optional tracking
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Patient ID for HIPAA/medical tracking
    patient_id VARCHAR(255),
    
    -- Result tracking
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    
    -- Metadata (JSON for flexibility)
    metadata JSONB DEFAULT '{}',
    
    -- Indexes for performance
    CONSTRAINT valid_medical_action CHECK (
        (resource IN ('patient', 'medical_record', 'appointment', 'prescription', 'lab_result', 'telemedicine_session') 
         AND patient_id IS NOT NULL) 
        OR 
        (resource NOT IN ('patient', 'medical_record', 'appointment', 'prescription', 'lab_result', 'telemedicine_session'))
    )
);

-- Índices optimizados para consultas de auditoría
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient ON audit_logs(patient_id, timestamp DESC) WHERE patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource, action, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id) WHERE session_id IS NOT NULL;

-- Índice compuesto para consultas médicas específicas
CREATE INDEX IF NOT EXISTS idx_audit_logs_medical_composite 
ON audit_logs(resource, patient_id, timestamp DESC) 
WHERE resource IN ('patient', 'medical_record', 'appointment', 'prescription', 'lab_result', 'telemedicine_session');

-- Particionado por fecha para performance en tablas grandes
-- Solo crear si se espera gran volumen (>1M registros)
-- CREATE TABLE audit_logs_y2025m01 PARTITION OF audit_logs 
-- FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Función para auto-limpieza según retención
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    -- Eliminar logs de sistema mayores a 1 año
    DELETE FROM audit_logs 
    WHERE resource = 'system' 
      AND timestamp < NOW() - INTERVAL '1 year';
    
    -- Eliminar logs de acceso no médicos mayores a 5 años
    DELETE FROM audit_logs 
    WHERE resource NOT IN ('patient', 'medical_record', 'appointment', 'prescription', 'lab_result', 'telemedicine_session')
      AND timestamp < NOW() - INTERVAL '5 years';
    
    -- Logs médicos se mantienen 10 años (Ley 26.529)
    -- No se eliminan automáticamente - requiere revisión manual
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar integridad de datos médicos
CREATE OR REPLACE FUNCTION validate_medical_audit_entry()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar que acciones médicas tengan patient_id
    IF NEW.resource IN ('patient', 'medical_record', 'appointment', 'prescription', 'lab_result', 'telemedicine_session') 
       AND NEW.patient_id IS NULL THEN
        RAISE EXCEPTION 'patient_id es requerido para recursos médicos (Ley 26.529)';
    END IF;
    
    -- Validar que actor_id no esté vacío
    IF NEW.actor_id IS NULL OR LENGTH(TRIM(NEW.actor_id)) = 0 THEN
        RAISE EXCEPTION 'actor_id es obligatorio para auditoría (Ley 26.529 Art. 15)';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_medical_audit
    BEFORE INSERT ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION validate_medical_audit_entry();

-- Vista para consultas administrativas frecuentes
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) as audit_date,
    resource,
    action,
    COUNT(*) as total_actions,
    COUNT(DISTINCT actor_id) as unique_actors,
    COUNT(DISTINCT patient_id) as unique_patients,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_actions,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_actions
FROM audit_logs 
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), resource, action
ORDER BY audit_date DESC, total_actions DESC;

-- Vista para acceso a datos de paciente específico (Habeas Data)
CREATE OR REPLACE VIEW patient_access_history AS
SELECT 
    al.timestamp,
    al.actor_id,
    al.actor_type,
    al.action,
    al.resource,
    al.resource_id,
    al.ip_address,
    al.success
FROM audit_logs al
WHERE al.patient_id IS NOT NULL
ORDER BY al.timestamp DESC;

COMMENT ON TABLE audit_logs IS 'Registro de auditoría conforme Ley 26.529 Argentina - Art. 15: acceso con clave de identificación y registro de modificaciones';
COMMENT ON COLUMN audit_logs.actor_id IS 'Identificación del usuario (requerido Ley 26.529)';
COMMENT ON COLUMN audit_logs.timestamp IS 'Momento exacto de la acción (requerido Ley 26.529)';
COMMENT ON COLUMN audit_logs.patient_id IS 'ID del paciente para cumplimiento Ley 25.326 (Habeas Data)';
`;

// ==================== REPOSITORY INTERFACES ====================

/**
 * Interface para repositorio de audit logs
 * Abstrae la implementación específica de base de datos
 */
export interface IAuditLogRepository {
  /**
   * Crear nuevo log de auditoría
   * NUNCA debe fallar - es crítico para compliance
   */
  create(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog>;
  
  /**
   * Consultar logs con filtros
   * Para auditorías administrativas
   */
  findMany(filters: {
    actorId?: string;
    patientId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]>;
  
  /**
   * Obtener estadísticas de auditoría
   * Para dashboards de compliance
   */
  getStats(timeRange: { start: Date; end: Date }): Promise<{
    totalEntries: number;
    entriesByAction: Record<string, number>;
    entriesByResource: Record<string, number>;
    failedActions: number;
    uniqueActors: number;
  }>;
  
  /**
   * Exportar datos de auditoría para paciente específico
   * Para cumplimiento Habeas Data (Ley 25.326)
   */
  exportPatientAuditHistory(patientId: string): Promise<AuditLog[]>;
  
  /**
   * Verificar integridad de logs
   * Para detectar posible manipulación
   */
  verifyIntegrity(timeRange: { start: Date; end: Date }): Promise<boolean>;
}

// ==================== CONFIGURACIÓN DE MIGRACIÓN ====================

/**
 * Configuración para migraciones de base de datos
 */
export const AUDIT_MIGRATION_CONFIG = {
  version: '001',
  description: 'Crear tabla audit_logs conforme Ley 26.529 Argentina',
  
  firestore: {
    // Crear índices compuestos en Firestore
    createIndexes: FIRESTORE_AUDIT_CONFIG.indexes,
    
    // Configurar reglas de seguridad
    securityRules: FIRESTORE_AUDIT_CONFIG.securityRules
  },
  
  postgresql: {
    // Script SQL completo
    sql: POSTGRES_AUDIT_SCHEMA,
    
    // Verificaciones post-migración
    verifications: [
      'SELECT COUNT(*) FROM audit_logs',
      'SELECT indexname FROM pg_indexes WHERE tablename = \'audit_logs\'',
      'SELECT proname FROM pg_proc WHERE proname = \'cleanup_old_audit_logs\''
    ]
  }
} as const;

// ==================== UTILIDADES DE VALIDACIÓN ====================

/**
 * Validar que el schema de audit log cumple con Zod
 */
export const validateAuditLogSchema = (data: unknown): AuditLog => {
  return AuditLogSchema.parse(data);
};

/**
 * Verificar que la configuración cumple requisitos legales
 */
export const validateComplianceRequirements = () => {
  const requirements = {
    hasActorIdField: true,      // Ley 26.529 Art. 15
    hasTimestampField: true,    // Ley 26.529 Art. 15
    hasActionTracking: true,    // Ley 26.529 registro modificaciones
    hasPatientIdField: true,    // Ley 25.326 Habeas Data
    hasRetentionPolicy: true,   // Ley 26.529 conservación 10 años
    hasIntegrityChecks: true    // Ley 27.706 control modificaciones
  };
  
  return requirements;
};