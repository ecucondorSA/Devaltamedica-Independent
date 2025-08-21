/**
 * 🏥 POSTGRESQL MIGRATION 001 - AUDIT LOGS
 * Crea la estructura de audit logs para compliance Ley 26.529 Argentina
 * Incluye: tabla, índices, triggers, funciones y vistas especializadas
 */

import { Pool } from 'pg';
import { POSTGRES_AUDIT_SCHEMA } from '../schemas/audit.schema';

import { logger } from '@altamedica/shared/services/logger.service';
export interface PostgreSQLMigration {
  version: string;
  description: string;
  up: (pool: Pool) => Promise<void>;
  down: (pool: Pool) => Promise<void>;
  verify: (pool: Pool) => Promise<boolean>;
}

export const migration_001_create_audit_logs: PostgreSQLMigration = {
  version: '001',
  description: 'Crear tabla audit_logs conforme Ley 26.529 Argentina',

  /**
   * Aplicar migración: crear tabla, índices, triggers y funciones
   */
  async up(pool: Pool): Promise<void> {
    const client = await pool.connect();
    
    try {
      logger.info('🔄 Aplicando migración PostgreSQL 001: audit_logs...');
      
      // Iniciar transacción para atomicidad
      await client.query('BEGIN');

      // 1. Crear tabla de migraciones si no existe
      await client.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
          version VARCHAR(10) PRIMARY KEY,
          description TEXT NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          status VARCHAR(20) NOT NULL DEFAULT 'applied'
        );
      `);

      // 2. Ejecutar el schema completo de audit_logs
      logger.info('   📋 Creando tabla audit_logs...');
      await client.query(POSTGRES_AUDIT_SCHEMA);

      // 3. Insertar registro de migración
      await client.query(`
        INSERT INTO _migrations (version, description, applied_at, status)
        VALUES ('001', 'Crear tabla audit_logs conforme Ley 26.529 Argentina', NOW(), 'applied')
        ON CONFLICT (version) DO UPDATE SET
          applied_at = NOW(),
          status = 'applied';
      `);

      // 4. Crear entrada de prueba para verificar funcionalidad
      await client.query(`
        INSERT INTO audit_logs (
          actor_id, actor_type, action, resource, success, metadata
        ) VALUES (
          'system', 'system', 'create', 'system', true, 
          '{"type": "migration", "description": "Inicialización tabla audit_logs", "version": "001"}'::jsonb
        );
      `);

      // 5. Verificar que los índices se crearon correctamente
      const indexCheck = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'audit_logs' 
        AND indexname LIKE 'idx_audit_logs_%';
      `);

      logger.info(`   ✅ Creados ${indexCheck.rows.length} índices especializados`);

      // 6. Verificar que las funciones se crearon
      const functionCheck = await client.query(`
        SELECT proname 
        FROM pg_proc 
        WHERE proname IN ('cleanup_old_audit_logs', 'validate_medical_audit_entry');
      `);

      logger.info(`   ✅ Creadas ${functionCheck.rows.length} funciones de auditoría`);

      // 7. Verificar que las vistas se crearon
      const viewCheck = await client.query(`
        SELECT viewname 
        FROM pg_views 
        WHERE viewname IN ('audit_summary', 'patient_access_history');
      `);

      logger.info(`   ✅ Creadas ${viewCheck.rows.length} vistas de consulta`);

      // Confirmar transacción
      await client.query('COMMIT');
      
      logger.info('✅ Migración PostgreSQL 001 aplicada exitosamente');
      logger.info('📊 Sistema de auditoría Ley 26.529 Argentina completamente configurado');
      
    } catch (error) {
      // Revertir en caso de error
      await client.query('ROLLBACK');
      logger.error('❌ Error aplicando migración PostgreSQL 001:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Revertir migración: eliminar tabla y estructura completa
   */
  async down(pool: Pool): Promise<void> {
    const client = await pool.connect();
    
    try {
      logger.info('🔄 Revirtiendo migración PostgreSQL 001: audit_logs...');
      
      await client.query('BEGIN');

      // 1. Eliminar vistas
      await client.query('DROP VIEW IF EXISTS patient_access_history CASCADE;');
      await client.query('DROP VIEW IF EXISTS audit_summary CASCADE;');
      logger.info('   🗑️  Vistas eliminadas');

      // 2. Eliminar triggers
      await client.query('DROP TRIGGER IF EXISTS trigger_validate_medical_audit ON audit_logs;');
      logger.info('   🗑️  Triggers eliminados');

      // 3. Eliminar funciones
      await client.query('DROP FUNCTION IF EXISTS validate_medical_audit_entry() CASCADE;');
      await client.query('DROP FUNCTION IF EXISTS cleanup_old_audit_logs() CASCADE;');
      logger.info('   🗑️  Funciones eliminadas');

      // 4. Eliminar tabla audit_logs
      await client.query('DROP TABLE IF EXISTS audit_logs CASCADE;');
      logger.info('   🗑️  Tabla audit_logs eliminada');

      // 5. Actualizar registro de migración
      await client.query(`
        UPDATE _migrations 
        SET status = 'rolled_back', applied_at = NOW() 
        WHERE version = '001';
      `);

      await client.query('COMMIT');
      
      logger.info('✅ Migración PostgreSQL 001 revertida exitosamente');
      logger.info('⚠️  Sistema de auditoría completamente removido');
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('❌ Error revirtiendo migración PostgreSQL 001:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Verificar que la migración se aplicó correctamente
   */
  async verify(pool: Pool): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      // 1. Verificar que la tabla existe
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'audit_logs'
        );
      `);

      if (!tableCheck.rows[0].exists) {
        logger.info('❌ Verificación fallida: tabla audit_logs no existe');
        return false;
      }

      // 2. Verificar índices críticos
      const indexCheck = await client.query(`
        SELECT count(*) as count
        FROM pg_indexes 
        WHERE tablename = 'audit_logs' 
        AND indexname LIKE 'idx_audit_logs_%';
      `);

      const expectedIndexes = 6; // Según schema definido
      if (parseInt(indexCheck.rows[0].count) < expectedIndexes) {
        logger.info(`❌ Verificación fallida: solo ${indexCheck.rows[0].count}/${expectedIndexes} índices encontrados`);
        return false;
      }

      // 3. Verificar funciones críticas
      const functionCheck = await client.query(`
        SELECT count(*) as count
        FROM pg_proc 
        WHERE proname IN ('cleanup_old_audit_logs', 'validate_medical_audit_entry');
      `);

      if (parseInt(functionCheck.rows[0].count) < 2) {
        logger.info('❌ Verificación fallida: funciones de auditoría no encontradas');
        return false;
      }

      // 4. Verificar vistas
      const viewCheck = await client.query(`
        SELECT count(*) as count
        FROM pg_views 
        WHERE viewname IN ('audit_summary', 'patient_access_history');
      `);

      if (parseInt(viewCheck.rows[0].count) < 2) {
        logger.info('❌ Verificación fallida: vistas de consulta no encontradas');
        return false;
      }

      // 5. Verificar constraints y triggers
      const triggerCheck = await client.query(`
        SELECT count(*) as count
        FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_validate_medical_audit';
      `);

      if (parseInt(triggerCheck.rows[0].count) < 1) {
        logger.info('❌ Verificación fallida: trigger de validación no encontrado');
        return false;
      }

      // 6. Verificar que se puede insertar datos válidos
      const insertTest = await client.query(`
        INSERT INTO audit_logs (
          actor_id, actor_type, action, resource, success, metadata
        ) VALUES (
          'test_verification', 'system', 'create', 'system', true, 
          '{"type": "verification", "test": true}'::jsonb
        ) RETURNING id;
      `);

      if (!insertTest.rows[0]?.id) {
        logger.info('❌ Verificación fallida: no se puede insertar en audit_logs');
        return false;
      }

      // Limpiar datos de prueba
      await client.query('DELETE FROM audit_logs WHERE actor_id = \'test_verification\';');

      // 7. Verificar registro de migración
      const migrationCheck = await client.query(`
        SELECT status FROM _migrations WHERE version = '001';
      `);

      if (migrationCheck.rows[0]?.status !== 'applied') {
        logger.info('❌ Verificación fallida: migración no registrada correctamente');
        return false;
      }

      logger.info('✅ Verificación migración PostgreSQL 001: exitosa');
      logger.info('📊 Sistema de auditoría Ley 26.529 completamente funcional');
      return true;
      
    } catch (error) {
      logger.error('❌ Error verificando migración PostgreSQL 001:', error);
      return false;
    } finally {
      client.release();
    }
  }
};

/**
 * Función auxiliar para ejecutar la migración
 */
export async function runPostgreSQLAuditMigration(pool: Pool): Promise<void> {
  await migration_001_create_audit_logs.up(pool);
}

/**
 * Función auxiliar para verificar la migración
 */
export async function verifyPostgreSQLAuditMigration(pool: Pool): Promise<boolean> {
  return await migration_001_create_audit_logs.verify(pool);
}

/**
 * Función auxiliar para revertir la migración
 */
export async function rollbackPostgreSQLAuditMigration(pool: Pool): Promise<void> {
  await migration_001_create_audit_logs.down(pool);
}