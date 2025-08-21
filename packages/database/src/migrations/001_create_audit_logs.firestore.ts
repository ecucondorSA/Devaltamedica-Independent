/**
 * 🏥 FIRESTORE MIGRATION 001 - AUDIT LOGS
 * Crea la estructura de audit logs para compliance Ley 26.529 Argentina
 * Configuración: índices, reglas de seguridad y estructura de datos
 */

import { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE_AUDIT_CONFIG } from '../schemas/audit.schema';

import { logger } from '@altamedica/shared/services/logger.service';
export interface FirestoreMigration {
  version: string;
  description: string;
  up: (firestore: Firestore) => Promise<void>;
  down: (firestore: Firestore) => Promise<void>;
  verify: (firestore: Firestore) => Promise<boolean>;
}

export const migration_001_create_audit_logs: FirestoreMigration = {
  version: '001',
  description: 'Crear estructura audit_logs conforme Ley 26.529 Argentina',

  /**
   * Aplicar migración: crear colección y configurar índices
   */
  async up(firestore: Firestore): Promise<void> {
    try {
      logger.info('🔄 Aplicando migración 001: audit_logs estructura Firestore...');

      // 1. Crear documento de configuración para la colección
      const configDoc = firestore.collection('_migrations').doc('001_audit_logs');
      await configDoc.set({
        version: '001',
        description: 'Audit logs para compliance Ley 26.529',
        appliedAt: new Date(),
        collectionName: FIRESTORE_AUDIT_CONFIG.collection,
        indexes: FIRESTORE_AUDIT_CONFIG.indexes,
        retentionPolicies: FIRESTORE_AUDIT_CONFIG.retention,
        status: 'applied'
      });

      // 2. Crear un documento de ejemplo para inicializar la colección
      // (Firestore crea colecciones automáticamente al insertar el primer documento)
      const sampleAuditLog = {
        id: 'migration_001_sample',
        timestamp: new Date(),
        actorId: 'system',
        actorType: 'system',
        action: 'create',
        resource: 'system',
        resourceId: 'audit_logs_collection',
        success: true,
        metadata: {
          type: 'migration',
          description: 'Inicialización de colección audit_logs',
          version: '001'
        },
        // Marcado para limpieza posterior
        _isMigrationSample: true
      };

      await firestore
        .collection(FIRESTORE_AUDIT_CONFIG.collection)
        .doc('migration_001_sample')
        .set(sampleAuditLog);

      // 3. Crear documento de índices requeridos
      // Nota: Los índices compuestos en Firestore deben crearse manualmente 
      // en la consola de Firebase o usando el CLI. Este documento sirve como referencia.
      const indexDoc = firestore.collection('_system').doc('audit_logs_indexes');
      await indexDoc.set({
        collection: FIRESTORE_AUDIT_CONFIG.collection,
        requiredIndexes: FIRESTORE_AUDIT_CONFIG.indexes,
        instructions: [
          'Los siguientes índices deben crearse manualmente en Firebase Console:',
          'firebase firestore:indexes --project YOUR_PROJECT_ID',
          'O usar la consola web: https://console.firebase.google.com'
        ],
        createdAt: new Date()
      });

      logger.info('✅ Migración 001 aplicada exitosamente');
      logger.info('ℹ️  Recordatorio: Crear índices compuestos manualmente en Firebase Console');
    } catch (error) {
      logger.error('❌ Error aplicando migración 001:', error);
      throw error;
    }
  },

  /**
   * Revertir migración: eliminar colección y configuración
   */
  async down(firestore: Firestore): Promise<void> {
    try {
      logger.info('🔄 Revirtiendo migración 001: audit_logs...');

      // 1. Eliminar documento de configuración
      const configDoc = firestore.collection('_migrations').doc('001_audit_logs');
      await configDoc.delete();

      // 2. Eliminar documento de índices
      const indexDoc = firestore.collection('_system').doc('audit_logs_indexes');
      await indexDoc.delete();

      // 3. Eliminar documento de ejemplo
      const sampleDoc = firestore
        .collection(FIRESTORE_AUDIT_CONFIG.collection)
        .doc('migration_001_sample');
      await sampleDoc.delete();

      // Nota: No eliminamos toda la colección por seguridad
      // Si hay datos reales, deben manejarse manualmente

      logger.info('✅ Migración 001 revertida exitosamente');
      logger.info('⚠️  Colección audit_logs no eliminada por seguridad');
    } catch (error) {
      logger.error('❌ Error revirtiendo migración 001:', error);
      throw error;
    }
  },

  /**
   * Verificar que la migración se aplicó correctamente
   */
  async verify(firestore: Firestore): Promise<boolean> {
    try {
      // 1. Verificar que existe el documento de configuración
      const configDoc = await firestore
        .collection('_migrations')
        .doc('001_audit_logs')
        .get();

      if (!configDoc.exists) {
        logger.info('❌ Verificación fallida: documento de configuración no existe');
        return false;
      }

      // 2. Verificar que la colección existe
      const sampleDoc = await firestore
        .collection(FIRESTORE_AUDIT_CONFIG.collection)
        .doc('migration_001_sample')
        .get();

      if (!sampleDoc.exists) {
        logger.info('❌ Verificación fallida: colección audit_logs no inicializada');
        return false;
      }

      // 3. Verificar estructura del documento de ejemplo
      const sampleData = sampleDoc.data();
      const requiredFields = ['timestamp', 'actorId', 'actorType', 'action', 'resource'];
      
      for (const field of requiredFields) {
        if (!(field in sampleData!)) {
          logger.info(`❌ Verificación fallida: campo requerido ${field} no encontrado`);
          return false;
        }
      }

      logger.info('✅ Verificación migración 001: exitosa');
      return true;
    } catch (error) {
      logger.error('❌ Error verificando migración 001:', error);
      return false;
    }
  }
};

/**
 * Función auxiliar para ejecutar la migración
 */
export async function runFirestoreAuditMigration(firestore: Firestore): Promise<void> {
  await migration_001_create_audit_logs.up(firestore);
}

/**
 * Función auxiliar para verificar la migración
 */
export async function verifyFirestoreAuditMigration(firestore: Firestore): Promise<boolean> {
  return await migration_001_create_audit_logs.verify(firestore);
}

/**
 * Función auxiliar para revertir la migración
 */
export async function rollbackFirestoreAuditMigration(firestore: Firestore): Promise<void> {
  await migration_001_create_audit_logs.down(firestore);
}