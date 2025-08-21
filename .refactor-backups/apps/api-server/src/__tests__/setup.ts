import { config } from 'dotenv';
import { afterAll, afterEach, beforeAll } from 'vitest';

// Cargar variables de entorno para testing
config({ path: '.env.test' });

// Mock de variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/altamedica_test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.STRIPE_SECRET_KEY = 'sk_test_...';
process.env.MERCADOPAGO_ACCESS_TOKEN = 'test-token';

// Setup global para tests
beforeAll(async () => {
  // Configuración global antes de todos los tests
  console.log('🧪 Setting up test environment...');
});

afterEach(async () => {
  // Limpieza después de cada test
  console.log('🧹 Cleaning up after test...');
});

afterAll(async () => {
  // Limpieza final después de todos los tests
  console.log('🏁 Test environment cleanup completed');
});

// Mock de console para tests silenciosos
if (process.env.NODE_ENV === 'test') {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}
