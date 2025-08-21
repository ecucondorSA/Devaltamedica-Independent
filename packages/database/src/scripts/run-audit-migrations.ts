#!/usr/bin/env node
/**
 * 🏥 AUDIT MIGRATIONS RUNNER
 * Script para ejecutar migraciones de auditoría manualmente
 * Útil para configuración inicial y troubleshooting
 */

import { dbConnection } from '../core/DatabaseConnection';
import { MigrationManager, runAutoMigrations } from '../migrations';

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
async function main() {
  logger.info('🚀 AltaMedica - Ejecutor de Migraciones de Auditoría');
  logger.info('📋 Configurando sistema de auditoría para Ley 26.529 Argentina\n');

  try {
    // 1. Inicializar conexiones
    logger.info('🔌 Inicializando conexiones de base de datos...');
    const firestore = await dbConnection.getFirestore();
    
    if (!firestore) {
      throw new Error('❌ No se pudo conectar a Firestore');
    }
    
    logger.info('✅ Firestore conectado exitosamente');

    // 2. Verificar estado actual de migraciones
    logger.info('\n📊 Verificando estado actual de migraciones...');
    const manager = new MigrationManager(firestore || undefined);
    const status = await manager.checkMigrationStatus();
    
    logger.info('📋 Estado de migraciones Firestore:');
    logger.info(`   ✅ Aplicadas: ${status.firestore.appliedMigrations.length}`);
    logger.info(`   ⏳ Pendientes: ${status.firestore.pendingMigrations.length}`);
    
    if (status.firestore.errors.length > 0) {
      logger.info(`   ❌ Errores: ${status.firestore.errors.length}`);
      status.firestore.errors.forEach(error => logger.info(`      - ${error}`));
    }

    // 3. Ejecutar migraciones automáticas
    logger.info('\n🔄 Ejecutando migraciones automáticas...');
    await runAutoMigrations(firestore);

    // 4. Verificar migraciones críticas
    logger.info('\n🔍 Verificando migraciones críticas...');
    const criticalVerified = await manager.verifyCriticalMigrations();
    
    if (!criticalVerified) {
      logger.error('❌ Algunas migraciones críticas fallaron');
      process.exit(1);
    }

    // 5. Verificar estado final
    logger.info('\n📊 Estado final de migraciones:');
    const finalStatus = await manager.checkMigrationStatus();
    
    logger.info('✅ Firestore:');
    logger.info(`   Aplicadas: ${finalStatus.firestore.appliedMigrations.join(', ')}`);
    logger.info(`   Pendientes: ${finalStatus.firestore.pendingMigrations.join(', ') || 'Ninguna'}`);

    // 6. Probar funcionalidad básica del sistema de auditoría
    logger.info('\n🧪 Probando funcionalidad básica de auditoría...');
    await testAuditFunctionality(firestore);

    logger.info('\n🎉 ¡Migraciones de auditoría completadas exitosamente!');
    logger.info('📋 Sistema de auditoría Ley 26.529 Argentina está listo para usar');
    
  } catch (error) {
    logger.error('\n❌ Error ejecutando migraciones de auditoría:', error);
    
    if (error instanceof Error) {
      logger.error('📋 Detalles del error:', error.message);
      if (error.stack) {
        logger.error('🔍 Stack trace:', error.stack);
      }
    }
    
    process.exit(1);
  }
}

/**
 * Probar funcionalidad básica del sistema de auditoría
 */
async function testAuditFunctionality(firestore: any) {
  try {
    // Test 1: Verificar que la colección existe
    const testCollection = firestore.collection('audit_logs');
    const sampleDoc = await testCollection.doc('migration_001_sample').get();
    
    if (!sampleDoc.exists) {
      throw new Error('Documento de prueba de migración no encontrado');
    }
    
    logger.info('   ✅ Colección audit_logs creada correctamente');

    // Test 2: Verificar estructura del documento
    const sampleData = sampleDoc.data();
    const requiredFields = ['timestamp', 'actorId', 'actorType', 'action', 'resource'];
    
    for (const field of requiredFields) {
      if (!(field in sampleData)) {
        throw new Error(`Campo obligatorio ${field} no encontrado en documento de prueba`);
      }
    }
    
    logger.info('   ✅ Estructura de documentos conforme a Ley 26.529');

    // Test 3: Verificar configuración de migración
    const migrationConfig = await firestore
      .collection('_migrations')
      .doc('001_audit_logs')
      .get();
    
    if (!migrationConfig.exists) {
      throw new Error('Configuración de migración no encontrada');
    }
    
    const configData = migrationConfig.data();
    if (configData.status !== 'applied') {
      throw new Error(`Estado de migración inválido: ${configData.status}`);
    }
    
    logger.info('   ✅ Configuración de migración registrada correctamente');

    // Test 4: Verificar índices requeridos
    const indexDoc = await firestore
      .collection('_system')
      .doc('audit_logs_indexes')
      .get();
    
    if (!indexDoc.exists) {
      throw new Error('Configuración de índices no encontrada');
    }
    
    logger.info('   ✅ Configuración de índices documentada');
    logger.info('   ℹ️  Recordatorio: Crear índices compuestos manualmente en Firebase Console');

  } catch (error) {
    logger.error('   ❌ Fallo en prueba de funcionalidad:', error);
    throw error;
  }
}

/**
 * Mostrar ayuda de uso
 */
function showHelp() {
  logger.info(`
🏥 AltaMedica - Ejecutor de Migraciones de Auditoría

DESCRIPCIÓN:
  Script para configurar el sistema de auditoría conforme Ley 26.529 Argentina.
  Ejecuta las migraciones necesarias para crear la infraestructura de audit logs.

USO:
  npx tsx run-audit-migrations.ts [opciones]
  node run-audit-migrations.js [opciones]

OPCIONES:
  --help, -h          Mostrar esta ayuda
  --status, -s        Solo mostrar estado de migraciones (no ejecutar)
  --verify, -v        Solo verificar migraciones críticas
  --rollback, -r      Revertir última migración (¡PELIGROSO!)

EJEMPLOS:
  npx tsx run-audit-migrations.ts                    # Ejecutar migraciones
  npx tsx run-audit-migrations.ts --status           # Ver estado
  npx tsx run-audit-migrations.ts --verify           # Verificar críticas

NOTAS:
  - Este script requiere conexión activa a Firestore
  - Las migraciones son idempotentes (seguras de re-ejecutar)
  - Los índices compuestos deben crearse manualmente en Firebase Console
  - El sistema cumple con Ley 26.529 Argentina Art. 15

SOPORTE:
  Para ayuda adicional, consultar packages/database/src/schemas/audit.schema.ts
  `);
}

// Manejar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--status') || args.includes('-s')) {
  // Solo mostrar estado
  (async () => {
    try {
      const firestore = await dbConnection.getFirestore();
      const manager = new MigrationManager(firestore || undefined);
      const status = await manager.checkMigrationStatus();
      
      logger.info('📊 Estado de Migraciones de Auditoría:');
      logger.info(`✅ Firestore - Aplicadas: ${status.firestore.appliedMigrations.join(', ') || 'Ninguna'}`);
      logger.info(`⏳ Firestore - Pendientes: ${status.firestore.pendingMigrations.join(', ') || 'Ninguna'}`);
      
      if (status.firestore.errors.length > 0) {
        logger.info(`❌ Errores: ${status.firestore.errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error obteniendo estado:', error);
      process.exit(1);
    }
  })();
} else if (args.includes('--verify') || args.includes('-v')) {
  // Solo verificar críticas
  (async () => {
    try {
      const firestore = await dbConnection.getFirestore();
      const manager = new MigrationManager(firestore || undefined);
      const verified = await manager.verifyCriticalMigrations();
      
      if (verified) {
        logger.info('✅ Todas las migraciones críticas verificadas');
        process.exit(0);
      } else {
        logger.error('❌ Faltan migraciones críticas');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Error verificando migraciones:', error);
      process.exit(1);
    }
  })();
} else if (args.includes('--rollback') || args.includes('-r')) {
  logger.error('❌ Rollback no implementado por seguridad');
  logger.error('   Para revertir migraciones, usar herramientas administrativas específicas');
  process.exit(1);
} else {
  // Ejecutar migraciones normalmente
  main();
}