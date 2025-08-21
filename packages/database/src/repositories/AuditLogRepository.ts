/**
 * 🏥 AUDIT LOG REPOSITORY - ARGENTINA LEY 26.529 COMPLIANCE
 * Repository especializado para logs de auditoría médica
 * Cumple con Art. 15: "acceso con clave de identificación y registro de modificaciones"
 */

import { Firestore, Query, DocumentData, Timestamp } from 'firebase-admin/firestore';
import { Pool } from 'pg';
import { AuditLog, CreateAuditLog, AuditLogFilter, AuditStats, AuditLogSchema, CreateAuditLogSchema, AuditLogFilterSchema } from '@altamedica/types';
import { IAuditLogRepository } from '../schemas/audit.schema';
import { dbConnection } from '../core/DatabaseConnection';
import { v4 as uuidv4 } from 'uuid';

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
export class AuditLogRepository implements IAuditLogRepository {
  private firestore: Firestore | null = null;
  private postgres: Pool | null = null;
  public readonly collectionName = 'audit_logs';

  constructor() {
    this.initializeConnections();
  }

  /**
   * Inicializar conexiones a las bases de datos
   */
  private async initializeConnections(): Promise<void> {
    try {
      this.firestore = await dbConnection.getFirestore();
      // PostgreSQL se inicializa bajo demanda cuando esté disponible
      // this.postgres = await dbConnection.getPostgreSQL();
    } catch (error) {
      logger.error('Error inicializando conexiones AuditLogRepository:', error);
    }
  }

  /**
   * Asegurar que Firestore esté disponible
   */
  private async ensureFirestore(): Promise<Firestore> {
    if (!this.firestore) {
      this.firestore = await dbConnection.getFirestore();
    }
    if (!this.firestore) {
      throw new Error('Firestore no disponible para audit logs');
    }
    return this.firestore;
  }

  /**
   * CRÍTICO: Crear nuevo log de auditoría
   * NUNCA debe fallar - es esencial para compliance Ley 26.529
   */
  public async create(auditLogData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const startTime = Date.now();
    
    try {
      // 1. Validar datos de entrada con Zod
      const validatedData = CreateAuditLogSchema.parse(auditLogData);
      
      // 2. Crear el log completo con ID y timestamp
      const auditLog: AuditLog = {
        id: uuidv4(),
        timestamp: new Date(),
        ...validatedData
      };

      // 3. Validar el log completo
      const finalValidatedLog = AuditLogSchema.parse(auditLog);

      // 4. Persistir en Firestore (principal)
      await this.createInFirestore(finalValidatedLog);

      // 5. Intentar persistir en PostgreSQL si está disponible (respaldo)
      if (this.postgres) {
        try {
          await this.createInPostgreSQL(finalValidatedLog);
        } catch (pgError) {
          // No fallar si PostgreSQL falla - Firestore es suficiente
          logger.warn('PostgreSQL audit log insert failed (non-critical):', pgError);
        }
      }

      // 6. Registrar métricas
      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_create', duration, true);

      return finalValidatedLog;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_create', duration, false);
      
      // CRÍTICO: Log de auditoría NUNCA debe fallar completamente
      // Intentar log mínimo de emergencia
      await this.createEmergencyLog(auditLogData, error as Error);
      
      throw new Error(`Error crítico creando audit log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crear audit log en Firestore
   */
  private async createInFirestore(auditLog: AuditLog): Promise<void> {
    const firestore = await this.ensureFirestore();
    
    // Convertir Date a Timestamp para Firestore
    const firestoreData = {
      ...auditLog,
      timestamp: Timestamp.fromDate(auditLog.timestamp)
    };

    await firestore
      .collection(this.collectionName)
      .doc(auditLog.id)
      .set(firestoreData);
  }

  /**
   * Crear audit log en PostgreSQL
   */
  private async createInPostgreSQL(auditLog: AuditLog): Promise<void> {
    if (!this.postgres) return;

    const client = await this.postgres.connect();
    
    try {
      await client.query(`
        INSERT INTO audit_logs (
          id, timestamp, actor_id, actor_type, action, resource, 
          resource_id, ip_address, user_agent, session_id, patient_id, 
          success, error_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        auditLog.id,
        auditLog.timestamp,
        auditLog.actorId,
        auditLog.actorType,
        auditLog.action,
        auditLog.resource,
        auditLog.resourceId || null,
        auditLog.ip || null,
        auditLog.userAgent || null,
        auditLog.sessionId || null,
        auditLog.patientId || null,
        auditLog.success,
        auditLog.errorMessage || null,
        JSON.stringify(auditLog.metadata || {})
      ]);
    } finally {
      client.release();
    }
  }

  /**
   * Log de emergencia cuando el sistema principal falla
   */
  private async createEmergencyLog(originalData: any, error: Error): Promise<void> {
    try {
      const firestore = await this.ensureFirestore();
      
      const emergencyLog = {
        id: uuidv4(),
        timestamp: Timestamp.fromDate(new Date()),
        actorId: 'system_emergency',
        actorType: 'system',
        action: 'emergency_log',
        resource: 'system',
        success: false,
        errorMessage: `Failed to create audit log: ${error.message}`,
        metadata: {
          originalData: JSON.stringify(originalData),
          errorStack: error.stack?.substring(0, 500), // Limitar tamaño
          emergencyCreatedAt: new Date().toISOString()
        }
      };

      await firestore
        .collection('emergency_audit_logs')
        .doc(emergencyLog.id)
        .set(emergencyLog);
        
    } catch (emergencyError) {
      logger.error('CRITICAL: Emergency audit log also failed:', emergencyError);
      // En este punto, usar logging externo o alertas críticas
    }
  }

  /**
   * Consultar logs con filtros (para auditorías administrativas)
   */
  public async findMany(filters: {
    actorId?: string;
    patientId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    try {
      const logs = await this.findManyInternal({
        where: {
          ...(filters.actorId && { actorId: filters.actorId }),
          ...(filters.patientId && { patientId: filters.patientId }),
          ...(filters.resource && { resource: filters.resource }),
          ...(filters.action && { action: filters.action }),
          ...(filters.startDate && { timestamp: { gte: filters.startDate } }),
          ...(filters.endDate && { timestamp: { lte: filters.endDate } })
        },
        limit: filters.limit,
        offset: filters.offset
      });
      return logs;
    } catch (error) {
      logger.error('Error finding audit logs:', error);
      return [];
    }
  }

  private async findManyInternal(options?: any): Promise<AuditLog[]> {
    const firestore = await this.ensureFirestore();
    let query: Query<DocumentData> = firestore.collection(this.collectionName);

    // Apply where filters
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && '$gte' in value) {
            query = query.where(key, '>=', value.$gte);
          } else if (typeof value === 'object' && '$lte' in value) {
            query = query.where(key, '<=', value.$lte);
          } else {
            query = query.where(key, '==', value);
          }
        }
      });
    }

    // Apply orderBy
    if (options?.orderBy) {
      Object.entries(options.orderBy).forEach(([field, direction]) => {
        query = query.orderBy(field, direction as 'asc' | 'desc');
      });
    } else {
      query = query.orderBy('timestamp', 'desc');
    }

    // Apply cursor-based pagination
    if (options?.cursor) {
      const cursorDoc = await firestore.collection(this.collectionName).doc(options.cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    // Apply limit
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => this.firestoreDocToAuditLog(doc));
  }

  private async findManyLegacy(filters: AuditLogFilter): Promise<AuditLog[]> {
    const startTime = Date.now();
    
    try {
      // Validar filtros
      const validatedFilters = AuditLogFilterSchema.parse(filters);
      
      const firestore = await this.ensureFirestore();
      let query: Query<DocumentData> = firestore.collection(this.collectionName);

      // Aplicar filtros
      if (validatedFilters.actorId) {
        query = query.where('actorId', '==', validatedFilters.actorId);
      }
      
      if (validatedFilters.patientId) {
        query = query.where('patientId', '==', validatedFilters.patientId);
      }
      
      if (validatedFilters.resource) {
        query = query.where('resource', '==', validatedFilters.resource);
      }
      
      if (validatedFilters.action) {
        query = query.where('action', '==', validatedFilters.action);
      }
      
      if (validatedFilters.success !== undefined) {
        query = query.where('success', '==', validatedFilters.success);
      }

      // Filtros de fecha
      if (validatedFilters.startDate) {
        query = query.where('timestamp', '>=', Timestamp.fromDate(validatedFilters.startDate));
      }
      
      if (validatedFilters.endDate) {
        query = query.where('timestamp', '<=', Timestamp.fromDate(validatedFilters.endDate));
      }

      // Ordenamiento y paginación
      query = query.orderBy('timestamp', 'desc');
      
      if (validatedFilters.offset) {
        // Para offset, necesitamos usar cursor-based pagination en Firestore
        const offsetQuery = firestore
          .collection(this.collectionName)
          .orderBy('timestamp', 'desc')
          .limit(validatedFilters.offset);
        
        const offsetSnapshot = await offsetQuery.get();
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }
      
      query = query.limit(validatedFilters.limit);

      const snapshot = await query.get();
      const auditLogs = snapshot.docs.map(doc => this.firestoreDocToAuditLog(doc));

      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_findMany', duration, true);

      return auditLogs;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_findMany', duration, false);
      throw new Error(`Error consultando audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count audit logs matching filters
   */
  public async count(options?: { where?: any }): Promise<{ success: boolean; data?: number; error?: string }> {
    try {
      const firestore = await this.ensureFirestore();
      let query: Query<DocumentData> = firestore.collection(this.collectionName);

      // Apply filters if provided
      if (options?.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'object' && '$gte' in value) {
              query = query.where(key, '>=', value.$gte);
            } else if (typeof value === 'object' && '$lte' in value) {
              query = query.where(key, '<=', value.$lte);
            } else {
              query = query.where(key, '==', value);
            }
          }
        });
      }

      const snapshot = await query.count().get();
      return { success: true, data: snapshot.data().count };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to count audit logs' 
      };
    }
  }

  /**
   * Obtener estadísticas de auditoría para dashboards de compliance
   */
  public async getStats(timeRange: {
    start: Date;
    end: Date;
  }): Promise<{
    totalEntries: number;
    entriesByAction: Record<string, number>;
    entriesByResource: Record<string, number>;
    failedActions: number;
    uniqueActors: number;
  }> {
    try {
      const stats = await this.getStatsInternal({
        startDate: timeRange.start,
        endDate: timeRange.end
      });
      return stats;
    } catch (error) {
      // Retornar valores por defecto en caso de error
      return {
        totalEntries: 0,
        entriesByAction: {},
        entriesByResource: {},
        failedActions: 0,
        uniqueActors: 0
      };
    }
  }

  private async getStatsInternal(options?: any): Promise<any> {
    const firestore = await this.ensureFirestore();
    
    // Default date range to last 30 days if not provided
    const endDate = options?.endDate || new Date();
    const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    let query: Query<DocumentData> = firestore.collection(this.collectionName)
      .where('timestamp', '>=', Timestamp.fromDate(startDate))
      .where('timestamp', '<=', Timestamp.fromDate(endDate));

    if (options?.actorId) {
      query = query.where('actorId', '==', options.actorId);
    }
    
    if (options?.resource) {
      query = query.where('resource', '==', options.resource);
    }

    const snapshot = await query.get();
    const logs = snapshot.docs.map(doc => this.firestoreDocToAuditLog(doc));

    // Calculate statistics
    const actionCounts: Record<string, number> = {};
    const hourlyActivity: Record<string, number> = {};
    const uniqueActors = new Set<string>();

    logs.forEach(log => {
      // Count by action
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      
      // Track unique actors
      uniqueActors.add(log.actorId);
      
      // Hourly activity
      const hour = new Date(log.timestamp).toISOString().slice(0, 13) + ':00';
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    // Get top actions
    const topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));

    // Get recent activity (last 24 hours)
    const recentActivity = Object.entries(hourlyActivity)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-24)
      .map(([hour, count]) => ({ hour, count }));

    return {
      totalEvents: logs.length,
      uniqueActors: uniqueActors.size,
      topActions,
      recentActivity
    };
  }

  public async getStatsLegacy(timeRange: { start: Date; end: Date }): Promise<AuditStats> {
    const startTime = Date.now();
    
    try {
      const firestore = await this.ensureFirestore();
      
      // Consulta base con rango de tiempo
      const query = firestore
        .collection(this.collectionName)
        .where('timestamp', '>=', Timestamp.fromDate(timeRange.start))
        .where('timestamp', '<=', Timestamp.fromDate(timeRange.end));

      const snapshot = await query.get();
      const logs = snapshot.docs.map(doc => this.firestoreDocToAuditLog(doc));

      // Calcular estadísticas
      const stats: AuditStats = {
        totalEntries: logs.length,
        entriesByAction: {},
        entriesByResource: {},
        failedActions: 0,
        uniqueActors: new Set(logs.map(log => log.actorId)).size,
        dateRange: timeRange
      };

      // Procesar logs para estadísticas
      logs.forEach(log => {
        // Contar por acción
        stats.entriesByAction[log.action] = (stats.entriesByAction[log.action] || 0) + 1;
        
        // Contar por recurso
        stats.entriesByResource[log.resource] = (stats.entriesByResource[log.resource] || 0) + 1;
        
        // Contar fallos
        if (!log.success) {
          stats.failedActions++;
        }
      });

      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_getStats', duration, true);

      return stats;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_getStats', duration, false);
      throw new Error(`Error obteniendo estadísticas de auditoría: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Exportar historial de auditoría de un paciente específico
   * Para cumplimiento Habeas Data (Ley 25.326)
   */
  public async exportPatientAuditHistory(patientId: string): Promise<AuditLog[]> {
    const startTime = Date.now();
    
    try {
      const firestore = await this.ensureFirestore();
      
      const query = firestore
        .collection(this.collectionName)
        .where('patientId', '==', patientId)
        .orderBy('timestamp', 'desc');

      const snapshot = await query.get();
      const auditHistory = snapshot.docs.map(doc => this.firestoreDocToAuditLog(doc));

      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_exportPatient', duration, true);

      return auditHistory;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_exportPatient', duration, false);
      throw new Error(`Error exportando historial de paciente: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verificar integridad de logs (detección de manipulación)
   */
  public async verifyIntegrity(timeRange: { start: Date; end: Date }): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const firestore = await this.ensureFirestore();
      
      // Verificar secuencia temporal
      const query = firestore
        .collection(this.collectionName)
        .where('timestamp', '>=', Timestamp.fromDate(timeRange.start))
        .where('timestamp', '<=', Timestamp.fromDate(timeRange.end))
        .orderBy('timestamp', 'asc');

      const snapshot = await query.get();
      const logs = snapshot.docs.map(doc => this.firestoreDocToAuditLog(doc));

      // Verificaciones de integridad
      let isIntegrityValid = true;
      let previousTimestamp: Date | null = null;

      for (const log of logs) {
        // 1. Verificar que timestamps sean secuenciales
        if (previousTimestamp && log.timestamp < previousTimestamp) {
          logger.warn(`Integrity violation: timestamp out of order for log ${log.id}`, { logId: log.id });
          isIntegrityValid = false;
        }

        // 2. Verificar campos obligatorios según Ley 26.529
        if (!log.actorId || !log.timestamp || !log.action) {
          logger.warn(`Integrity violation: missing required fields in log ${log.id}`, { logId: log.id });
          isIntegrityValid = false;
        }

        // 3. Verificar que logs médicos tengan patientId
        const medicalResources = ['patient', 'medical_record', 'appointment', 'prescription', 'lab_result', 'telemedicine_session'];
        if (medicalResources.includes(log.resource) && !log.patientId) {
          logger.warn(`Integrity violation: medical log ${log.id} missing patientId`, { logId: log.id });
          isIntegrityValid = false;
        }

        previousTimestamp = log.timestamp;
      }

      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_verifyIntegrity', duration, true);

      return isIntegrityValid;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_verifyIntegrity', duration, false);
      throw new Error(`Error verificando integridad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Buscar audit logs por campo específico
   * Útil para consultas simples de testing
   */
  public async findByField(field: string, value: any): Promise<{ success: boolean; data?: AuditLog[] }> {
    const startTime = Date.now();
    
    try {
      const firestore = await this.ensureFirestore();
      
      const query = firestore
        .collection(this.collectionName)
        .where(field, '==', value)
        .orderBy('timestamp', 'desc')
        .limit(50);

      const snapshot = await query.get();
      const auditLogs = snapshot.docs.map(doc => this.firestoreDocToAuditLog(doc));

      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_findByField', duration, true);

      return { success: true, data: auditLogs };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      dbConnection.recordQuery('audit_log_findByField', duration, false);
      
      logger.error(`Error finding audit logs by ${field}:`, error);
      return { success: false };
    }
  }

  /**
   * Convertir documento de Firestore a AuditLog
   */
  private firestoreDocToAuditLog(doc: any): AuditLog {
    const data = doc.data();
    
    return {
      id: doc.id,
      timestamp: data.timestamp.toDate(),
      actorId: data.actorId,
      actorType: data.actorType,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || undefined,
      ip: data.ip || undefined,
      userAgent: data.userAgent || undefined,
      sessionId: data.sessionId || undefined,
      patientId: data.patientId || undefined,
      success: data.success,
      errorMessage: data.errorMessage || undefined,
      metadata: data.metadata || {},
      hash: data.hash || undefined,
      prevHash: data.prevHash || undefined,
      sequenceNumber: data.sequenceNumber || undefined
    };
  }

  /**
   * Find the last audit log entry (for hash chain)
   * Used by HashChainService to get the previous hash
   */
  public async findLast(): Promise<AuditLog | null> {
    try {
      const firestore = await this.ensureFirestore();
      
      // Query for the last entry by timestamp
      const snapshot = await firestore
        .collection(this.collectionName)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      return this.firestoreDocToAuditLog(snapshot.docs[0]);
    } catch (error) {
      logger.error('[AuditLogRepository] Error fetching last entry:', error);
      
      // Try with sequenceNumber if timestamp fails
      try {
        const firestore = await this.ensureFirestore();
        const snapshot = await firestore
          .collection(this.collectionName)
          .orderBy('sequenceNumber', 'desc')
          .limit(1)
          .get();
        
        if (snapshot.empty) {
          return null;
        }
        
        return this.firestoreDocToAuditLog(snapshot.docs[0]);
      } catch (fallbackError) {
        logger.error('[AuditLogRepository] Fallback query also failed:', fallbackError);
        return null;
      }
    }
  }

  /**
   * Get the maximum sequence number (for hash chain)
   * Used by HashChainService to calculate the next sequence number
   */
  public async getMaxSequenceNumber(): Promise<number | null> {
    try {
      const firestore = await this.ensureFirestore();
      
      // Query for the entry with highest sequence number
      const snapshot = await firestore
        .collection(this.collectionName)
        .orderBy('sequenceNumber', 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const lastEntry = this.firestoreDocToAuditLog(snapshot.docs[0]);
      return lastEntry.sequenceNumber || null;
    } catch (error) {
      logger.error('[AuditLogRepository] Error fetching max sequence number:', error);
      
      // If sequenceNumber field doesn't exist in index, fallback to counting
      try {
        const firestore = await this.ensureFirestore();
        const snapshot = await firestore
          .collection(this.collectionName)
          .select('sequenceNumber')
          .get();
        
        let maxSeq = 0;
        snapshot.docs.forEach(doc => {
          const seq = doc.data().sequenceNumber;
          if (typeof seq === 'number' && seq > maxSeq) {
            maxSeq = seq;
          }
        });
        
        return maxSeq > 0 ? maxSeq : null;
      } catch (fallbackError) {
        logger.error('[AuditLogRepository] Fallback counting also failed:', fallbackError);
        return null;
      }
    }
  }
}

// Instancia singleton para uso en toda la aplicación
export const auditLogRepository = new AuditLogRepository();