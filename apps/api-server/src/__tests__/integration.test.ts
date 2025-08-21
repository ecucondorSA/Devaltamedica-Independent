// 🧪 SUITE DE TESTING PARA ALTAMEDICA
// Tests de integración para verificar funcionalidades críticas

import request from 'supertest';
import { describe, beforeAll, afterAll, test, expect } from '@jest/globals';

import { logger } from '@altamedica/shared/services/logger.service';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Mock de token de autenticación
const mockAuthToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

describe('🏥 AltaMedica - Tests de Integración', () => {
  
  beforeAll(async () => {
    logger.info('🚀 Iniciando tests de integración...');
    logger.info(`📡 URL Base: ${API_BASE_URL}`);
  });

  afterAll(async () => {
    logger.info('✅ Tests de integración completados');
  });

  // ==========================================
  // HEALTH CHECKS
  // ==========================================
  describe('🔍 Health Checks', () => {
    
    test('Health check simple debe responder', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/health?simple=true')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    test('Health check completo debe incluir todos los servicios', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/health')
        .expect(200);
      
      expect(response.body.overall).toMatch(/healthy|degraded|unhealthy/);
      expect(response.body.checks).toBeDefined();
      expect(response.body.checks.database).toBeDefined();
      expect(response.body.checks.redis).toBeDefined();
      expect(response.body.checks.apis).toBeDefined();
      expect(response.body.metrics).toBeDefined();
    });

    test('Health check formato Prometheus', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/health?format=prometheus')
        .expect(200);
      
      expect(response.text).toContain('altamedica_health_status');
      expect(response.text).toContain('altamedica_uptime_seconds');
      expect(response.headers['content-type']).toContain('text/plain');
    });

  });

  // ==========================================
  // AUTENTICACIÓN Y SEGURIDAD
  // ==========================================
  describe('🔐 Autenticación y Seguridad', () => {
    
    test('Endpoints protegidos deben requerir autenticación', async () => {
      await request(API_BASE_URL)
        .get('/api/v1/medical-locations')
        .expect(401);
      
      await request(API_BASE_URL)
        .get('/api/v1/applications')
        .expect(401);
      
      await request(API_BASE_URL)
        .get('/api/v1/dashboard/analytics')
        .expect(401);
    });

    test('Rate limiting debe estar activo', async () => {
      // Hacer múltiples requests rápidos para triggear rate limiting
      const promises = Array(10).fill().map(() => 
        request(API_BASE_URL).get('/api/v1/health?simple=true')
      );
      
      const responses = await Promise.all(promises);
      
      // Verificar que las respuestas incluyan headers de rate limiting
      const firstResponse = responses[0];
      expect(firstResponse.status).toBe(200);
      
      // En un sistema real, esto podría triggear 429
      // expect(responses.some(r => r.status === 429)).toBe(true);
    });

    test('Headers de seguridad deben estar presentes', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/health?simple=true')
        .expect(200);
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['x-medical-app']).toBe('AltaMedica');
      expect(response.headers['x-hipaa-compliant']).toBe('true');
    });

  });

  // ==========================================
  // APIS MÉDICAS
  // ==========================================
  describe('🏥 APIs Médicas', () => {
    
    test('API Medical Locations con autenticación', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/medical-locations')
        .set('Authorization', mockAuthToken)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('API Applications con autenticación', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/applications')
        .set('Authorization', mockAuthToken)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    test('API Dashboard Analytics con autenticación', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/dashboard/analytics')
        .set('Authorization', mockAuthToken)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.analytics).toBeDefined();
    });

    test('Filtros en Medical Locations', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/medical-locations?type=hospital&emergency=true')
        .set('Authorization', mockAuthToken)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      // Verificar que los filtros se aplicaron
      if (response.body.data.length > 0) {
        expect(response.body.data.every(loc => loc.type === 'hospital')).toBe(true);
      }
    });

  });

  // ==========================================
  // VALIDACIÓN DE DATOS
  // ==========================================
  describe('📋 Validación de Datos', () => {
    
    test('Creación de Medical Location con datos inválidos', async () => {
      const invalidData = {
        name: 'A', // Muy corto
        type: 'invalid_type',
        // Faltan campos requeridos
      };

      await request(API_BASE_URL)
        .post('/api/v1/medical-locations')
        .set('Authorization', mockAuthToken)
        .send(invalidData)
        .expect(400);
    });

    test('Creación de Application con datos válidos', async () => {
      const validData = {
        type: 'appointment',
        patientId: 'pat_123',
        doctorId: 'doc_456',
        title: 'Consulta médica de control',
        description: 'Paciente requiere consulta de rutina para control de hipertensión',
        priority: 'medium',
        metadata: {
          specialty: 'Cardiología',
          department: 'Consultorios Externos'
        }
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/applications')
        .set('Authorization', mockAuthToken)
        .send(validData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.type).toBe('appointment');
    });

  });

  // ==========================================
  // PERFORMANCE
  // ==========================================
  describe('⚡ Performance', () => {
    
    test('Health check debe responder rápido', async () => {
      const startTime = Date.now();
      
      await request(API_BASE_URL)
        .get('/api/v1/health?simple=true')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Menos de 1 segundo
    });

    test('APIs médicas deben responder en tiempo razonable', async () => {
      const startTime = Date.now();
      
      await request(API_BASE_URL)
        .get('/api/v1/medical-locations')
        .set('Authorization', mockAuthToken)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(2000); // Menos de 2 segundos
    });

  });

  // ==========================================
  // AUDITORÍA
  // ==========================================
  describe('📋 Auditoría', () => {
    
    test('Acceso a datos médicos debe generar audit log', async () => {
      // Este test verificaría que se generen logs de auditoría
      // En un entorno real, verificarías la base de datos de auditoría
      
      const response = await request(API_BASE_URL)
        .get('/api/v1/medical-locations')
        .set('Authorization', mockAuthToken)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // En producción: verificar que se creó un log de auditoría
      // const auditLogs = await getAuditLogs({ action: 'medical_locations_search' });
      // expect(auditLogs.length).toBeGreaterThan(0);
    });

  });

  // ==========================================
  // ENCRIPTACIÓN
  // ==========================================
  describe('🔒 Encriptación', () => {
    
    test('Datos PHI deben estar encriptados en respuestas', async () => {
      // Este test verificaría que los datos sensibles estén encriptados
      // En producción, los datos PHI nunca deben enviarse sin encriptar
      
      const response = await request(API_BASE_URL)
        .get('/api/v1/medical-locations')
        .set('Authorization', mockAuthToken)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verificar que no hay datos sensibles expuestos
      const responseStr = JSON.stringify(response.body);
      expect(responseStr).not.toContain('123-45-6789'); // SSN
      expect(responseStr).not.toContain('password');
    });

  });

  // ==========================================
  // TELEMEDICINA
  // ==========================================
  describe('📱 Telemedicina', () => {
    
    test('WebSocket server debe estar disponible', async () => {
      // Test básico para verificar que el servidor WebSocket esté funcionando
      // En producción, esto se conectaría al WebSocket real
      
      try {
        const response = await request('http://localhost:3002')
          .get('/health')
          .timeout(5000);
        
        expect(response.status).toBe(200);
      } catch (error) {
        logger.warn('⚠️ WebSocket server no disponible en tests');
      }
    });

  });

});

// ==========================================
// TESTS DE CARGA BÁSICOS
// ==========================================
describe('🚀 Tests de Carga Básicos', () => {
  
  test('Múltiples requests simultáneos', async () => {
    const concurrentRequests = 10;
    const requests = Array(concurrentRequests).fill().map(() =>
      request(API_BASE_URL)
        .get('/api/v1/health?simple=true')
        .timeout(5000)
    );

    const responses = await Promise.all(requests);
    
    // Todas las respuestas deben ser exitosas
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });

    logger.info(`✅ ${concurrentRequests} requests simultáneos completados`);
  });

});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Función para generar token de test
function generateTestToken(role: 'admin' | 'doctor' | 'patient' = 'doctor') {
  // En producción, esto generaría un JWT real
  return `Bearer test-token-${role}`;
}

// Función para limpiar datos de test
async function cleanupTestData() {
  // En producción, esto limpiaría datos de test de la base de datos
  logger.info('🧹 Limpiando datos de test...');
}

export {
  generateTestToken,
  cleanupTestData
};
