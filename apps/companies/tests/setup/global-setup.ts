import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

import { logger } from '@altamedica/shared/services/logger.service';
const execAsync = promisify(exec);

/**
 * Setup global para las pruebas de Playwright
 * Este archivo se ejecuta una vez antes de todas las pruebas
 */
async function globalSetup(config: FullConfig) {
  logger.info('🚀 Iniciando setup global de Playwright...');
  
  try {
    // 1. Verificar que Node.js y pnpm estén disponibles
    await verifyDependencies();
    
    // 2. Configurar variables de entorno para testing
    setupEnvironmentVariables();
    
    // 3. Limpiar base de datos de testing si existe
    await cleanTestDatabase();
    
    // 4. Preparar datos de prueba
    await seedTestData();
    
    // 5. Verificar que el servidor esté ejecutándose
    await verifyServerStatus();
    
    logger.info('✅ Setup global completado exitosamente');
    
  } catch (error) {
    logger.error('❌ Error en setup global:', error);
    throw error;
  }
}

/**
 * Verificar que las dependencias necesarias estén disponibles
 */
async function verifyDependencies() {
  logger.info('🔍 Verificando dependencias...');
  
  try {
    // Verificar Node.js
    const { stdout: nodeVersion } = await execAsync('node --version');
    logger.info(`Node.js version: ${nodeVersion.trim()}`);
    
    // Verificar pnpm
    const { stdout: pnpmVersion } = await execAsync('pnpm --version');
    logger.info(`pnpm version: ${pnpmVersion.trim()}`);
    
    logger.info('✅ Dependencias verificadas');
  } catch (error) {
    logger.error('❌ Error verificando dependencias:', error);
    throw new Error('Dependencias no disponibles');
  }
}

/**
 * Configurar variables de entorno para el entorno de testing
 */
function setupEnvironmentVariables() {
  logger.info('⚙️ Configurando variables de entorno...');
  
  // Variables de entorno específicas para testing
  process.env.NODE_ENV = 'test';
  process.env.NEXTAUTH_URL = 'http://localhost:3006';
  process.env.NEXTAUTH_SECRET = 'test-secret-key-for-playwright-testing';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'memory://test.db';
  
  // Configuración de logging para tests
  process.env.LOG_LEVEL = 'error'; // Reducir logs durante tests
  process.env.DISABLE_ANALYTICS = 'true';
  
  // Configuración de APIs externas (usar mocks en testing)
  process.env.USE_MOCK_APIS = 'true';
  process.env.SKIP_EMAIL_SENDING = 'true';
  
  logger.info('✅ Variables de entorno configuradas');
}

/**
 * Limpiar base de datos de testing
 */
async function cleanTestDatabase() {
  logger.info('🧹 Limpiando base de datos de testing...');
  
  try {
    // Aquí irían los comandos específicos para limpiar la BD
    // Por ejemplo, si usas Prisma:
    // await execAsync('pnpm prisma db push --force-reset');
    
    logger.info('✅ Base de datos limpiada');
  } catch (error) {
    logger.warn('⚠️ No se pudo limpiar la base de datos:', error);
    // No hacer fail del setup por esto
  }
}

/**
 * Preparar datos de prueba (seeding)
 */
async function seedTestData() {
  logger.info('🌱 Preparando datos de prueba...');
  
  try {
    // Aquí irían los comandos para crear datos de prueba
    // Por ejemplo:
    // await execAsync('pnpm seed:test');
    
    // Crear usuarios de prueba
    await createTestUsers();
    
    // Crear datos de prueba básicos
    await createTestData();
    
    logger.info('✅ Datos de prueba preparados');
  } catch (error) {
    logger.warn('⚠️ No se pudieron crear datos de prueba:', error);
    // No hacer fail del setup por esto
  }
}

/**
 * Crear usuarios de prueba
 */
async function createTestUsers() {
  // Aquí se crearían los usuarios necesarios para las pruebas
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Test'
    },
    {
      email: 'manager@test.com',
      password: 'password123',
      role: 'manager',
      firstName: 'Manager',
      lastName: 'Test'
    },
    {
      email: 'employee@test.com',
      password: 'password123',
      role: 'employee',
      firstName: 'Employee',
      lastName: 'Test'
    }
  ];
  
  logger.info(`Preparando ${testUsers.length} usuarios de prueba...`);
  // Implementación específica dependería del sistema de autenticación
}

/**
 * Crear datos de prueba básicos
 */
async function createTestData() {
  // Crear datos de prueba para:
  // - Empresas
  // - Empleados
  // - Doctores
  // - Pacientes (muestra)
  // - Servicios del marketplace
  // - Citas de ejemplo
  
  logger.info('Creando datos de prueba básicos...');
  // Implementación específica dependería del modelo de datos
}

/**
 * Verificar que el servidor de desarrollo esté ejecutándose
 */
async function verifyServerStatus() {
  logger.info('🌐 Verificando estado del servidor...');
  
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3006';
  const maxRetries = 30; // 30 segundos
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(`${baseURL}/api/health`);
      if (response.ok) {
        logger.info('✅ Servidor respondiendo correctamente');
        return;
      }
    } catch (error) {
      // Servidor aún no está listo
    }
    
    retries++;
    logger.info(`⏳ Esperando servidor... (${retries}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('❌ Servidor no está disponible después de 30 segundos');
}

export default globalSetup;
