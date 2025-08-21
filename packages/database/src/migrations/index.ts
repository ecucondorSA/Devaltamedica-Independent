/**
 * 🏥 DATABASE MIGRATIONS INDEX
 * Gestión centralizada de migraciones para AltaMedica Platform
 * Soporte para Firestore y PostgreSQL
 */

import { Firestore } from 'firebase-admin/firestore';
import { Pool } from 'pg';

import { logger } from '@altamedica/shared/services/logger.service';
// Importar migraciones individuales
import {
  migration_001_create_audit_logs as firestoreMigration001,
  type FirestoreMigration
} from './001_create_audit_logs.firestore';

import {
  migration_001_create_audit_logs as postgresqlMigration001,
  type PostgreSQLMigration
} from './001_create_audit_logs.postgresql';

// ==================== TIPOS Y INTERFACES ====================

export interface MigrationResult {
  version: string;
  description: string;
  success: boolean;
  error?: string;
  duration: number;
}

export interface MigrationStatus {
  appliedMigrations: string[];
  pendingMigrations: string[];
  errors: string[];
}

// ==================== REGISTRY DE MIGRACIONES ====================

/**
 * Registry de migraciones Firestore
 */
export const FIRESTORE_MIGRATIONS: Record<string, FirestoreMigration> = {
  '001': firestoreMigration001
};

/**
 * Registry de migraciones PostgreSQL
 */
export const POSTGRESQL_MIGRATIONS: Record<string, PostgreSQLMigration> = {
  '001': postgresqlMigration001
};

// ==================== MIGRATION MANAGER ====================

export class MigrationManager {
  private firestore: Firestore | null = null;
  private postgresql: Pool | null = null;

  constructor(firestore?: Firestore, postgresql?: Pool) {
    this.firestore = firestore || null;
    this.postgresql = postgresql || null;
  }

  /**
   * Ejecutar todas las migraciones pendientes para Firestore
   */
  async runFirestoreMigrations(): Promise<MigrationResult[]> {
    if (!this.firestore) {
      throw new Error('Firestore connection not provided');
    }

    const results: MigrationResult[] = [];
    const appliedMigrations = await this.getAppliedFirestoreMigrations();

    logger.info('🔄 Ejecutando migraciones Firestore...');

    for (const [version, migration] of Object.entries(FIRESTORE_MIGRATIONS)) {
      if (appliedMigrations.includes(version)) {
        logger.info(`⏭️  Migración ${version} ya aplicada, saltando...`);
        continue;
      }

      const startTime = Date.now();
      
      try {
        logger.info(`🚀 Aplicando migración Firestore ${version}: ${migration.description}`);
        
        await migration.up(this.firestore);
        
        const duration = Date.now() - startTime;
        const result: MigrationResult = {
          version,
          description: migration.description,
          success: true,
          duration
        };
        
        results.push(result);
        logger.info(`✅ Migración ${version} aplicada exitosamente (${duration}ms)`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        const result: MigrationResult = {
          version,
          description: migration.description,
          success: false,
          error: errorMessage,
          duration
        };
        
        results.push(result);
        logger.error(`❌ Error aplicando migración ${version}: ${errorMessage}`);
        
        // Detener en caso de error crítico
        break;
      }
    }

    return results;
  }

  /**
   * Ejecutar todas las migraciones pendientes para PostgreSQL
   */
  async runPostgreSQLMigrations(): Promise<MigrationResult[]> {
    if (!this.postgresql) {
      throw new Error('PostgreSQL connection not provided');
    }

    const results: MigrationResult[] = [];
    const appliedMigrations = await this.getAppliedPostgreSQLMigrations();

    logger.info('🔄 Ejecutando migraciones PostgreSQL...');

    for (const [version, migration] of Object.entries(POSTGRESQL_MIGRATIONS)) {
      if (appliedMigrations.includes(version)) {
        logger.info(`⏭️  Migración ${version} ya aplicada, saltando...`);
        continue;
      }

      const startTime = Date.now();
      
      try {
        logger.info(`🚀 Aplicando migración PostgreSQL ${version}: ${migration.description}`);
        
        await migration.up(this.postgresql);
        
        const duration = Date.now() - startTime;
        const result: MigrationResult = {
          version,
          description: migration.description,
          success: true,
          duration
        };
        
        results.push(result);
        logger.info(`✅ Migración ${version} aplicada exitosamente (${duration}ms)`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        const result: MigrationResult = {
          version,
          description: migration.description,
          success: false,
          error: errorMessage,
          duration
        };
        
        results.push(result);
        logger.error(`❌ Error aplicando migración ${version}: ${errorMessage}`);
        
        // Detener en caso de error crítico
        break;
      }
    }

    return results;
  }

  /**
   * Verificar estado de migraciones
   */
  async checkMigrationStatus(): Promise<{ firestore: MigrationStatus; postgresql: MigrationStatus }> {
    const firestoreStatus: MigrationStatus = {
      appliedMigrations: [],
      pendingMigrations: [],
      errors: []
    };

    const postgresqlStatus: MigrationStatus = {
      appliedMigrations: [],
      pendingMigrations: [],
      errors: []
    };

    // Verificar Firestore
    if (this.firestore) {
      try {
        firestoreStatus.appliedMigrations = await this.getAppliedFirestoreMigrations();
        firestoreStatus.pendingMigrations = Object.keys(FIRESTORE_MIGRATIONS)
          .filter(version => !firestoreStatus.appliedMigrations.includes(version));
      } catch (error) {
        firestoreStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Verificar PostgreSQL
    if (this.postgresql) {
      try {
        postgresqlStatus.appliedMigrations = await this.getAppliedPostgreSQLMigrations();
        postgresqlStatus.pendingMigrations = Object.keys(POSTGRESQL_MIGRATIONS)
          .filter(version => !postgresqlStatus.appliedMigrations.includes(version));
      } catch (error) {
        postgresqlStatus.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return {
      firestore: firestoreStatus,
      postgresql: postgresqlStatus
    };
  }

  /**
   * Obtener migraciones aplicadas en Firestore
   */
  private async getAppliedFirestoreMigrations(): Promise<string[]> {
    if (!this.firestore) return [];

    try {
      const snapshot = await this.firestore
        .collection('_migrations')
        .where('status', '==', 'applied')
        .get();

      return snapshot.docs.map(doc => doc.id);
    } catch (error) {
      logger.warn('No se pudieron obtener migraciones aplicadas de Firestore:', error);
      return [];
    }
  }

  /**
   * Obtener migraciones aplicadas en PostgreSQL
   */
  private async getAppliedPostgreSQLMigrations(): Promise<string[]> {
    if (!this.postgresql) return [];

    const client = await this.postgresql.connect();
    
    try {
      const result = await client.query(`
        SELECT version FROM _migrations 
        WHERE status = 'applied' 
        ORDER BY version;
      `);

      return result.rows.map(row => row.version);
    } catch (error) {
      logger.warn('No se pudieron obtener migraciones aplicadas de PostgreSQL:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Verificar que todas las migraciones críticas estén aplicadas
   */
  async verifyCriticalMigrations(): Promise<boolean> {
    const criticalMigrations = ['001']; // Audit logs es crítico para compliance
    
    try {
      let allCriticalApplied = true;

      // Verificar Firestore
      if (this.firestore) {
        const appliedFirestore = await this.getAppliedFirestoreMigrations();
        const missingFirestore = criticalMigrations.filter(v => !appliedFirestore.includes(v));
        
        if (missingFirestore.length > 0) {
          logger.error(`❌ Migraciones críticas faltantes en Firestore: ${missingFirestore.join(', ')}`);
          allCriticalApplied = false;
        }
      }

      // Verificar PostgreSQL
      if (this.postgresql) {
        const appliedPostgreSQL = await this.getAppliedPostgreSQLMigrations();
        const missingPostgreSQL = criticalMigrations.filter(v => !appliedPostgreSQL.includes(v));
        
        if (missingPostgreSQL.length > 0) {
          logger.error(`❌ Migraciones críticas faltantes en PostgreSQL: ${missingPostgreSQL.join(', ')}`);
          allCriticalApplied = false;
        }
      }

      if (allCriticalApplied) {
        logger.info('✅ Todas las migraciones críticas están aplicadas');
      }

      return allCriticalApplied;
      
    } catch (error) {
      logger.error('Error verificando migraciones críticas:', error);
      return false;
    }
  }
}

// ==================== FUNCIONES DE CONVENIENCIA ====================

/**
 * Ejecutar migraciones automáticamente según conexiones disponibles
 */
export async function runAutoMigrations(firestore?: Firestore, postgresql?: Pool): Promise<void> {
  const manager = new MigrationManager(firestore, postgresql);
  
  logger.info('🚀 Iniciando migraciones automáticas...');
  
  // Ejecutar migraciones Firestore
  if (firestore) {
    const firestoreResults = await manager.runFirestoreMigrations();
    const successCount = firestoreResults.filter(r => r.success).length;
    logger.info(`📊 Firestore: ${successCount}/${firestoreResults.length} migraciones exitosas`);
  }

  // Ejecutar migraciones PostgreSQL
  if (postgresql) {
    const postgresqlResults = await manager.runPostgreSQLMigrations();
    const successCount = postgresqlResults.filter(r => r.success).length;
    logger.info(`📊 PostgreSQL: ${successCount}/${postgresqlResults.length} migraciones exitosas`);
  }

  // Verificar migraciones críticas
  const criticalVerified = await manager.verifyCriticalMigrations();
  if (!criticalVerified) {
    throw new Error('❌ Migraciones críticas no completadas - Sistema no puede continuar');
  }

  logger.info('✅ Migraciones automáticas completadas exitosamente');
}

// Exportar migraciones individuales para uso directo
export {
  firestoreMigration001,
  postgresqlMigration001
};

// Exportar funciones auxiliares
export {
  runFirestoreAuditMigration,
  verifyFirestoreAuditMigration,
  rollbackFirestoreAuditMigration
} from './001_create_audit_logs.firestore';

export {
  runPostgreSQLAuditMigration,
  verifyPostgreSQLAuditMigration,
  rollbackPostgreSQLAuditMigration
} from './001_create_audit_logs.postgresql';