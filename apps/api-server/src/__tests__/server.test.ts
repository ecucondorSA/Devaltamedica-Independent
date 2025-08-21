import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer } from '../server';

describe('🚀 API Server', () => {
  let server: any;

  beforeAll(async () => {
    // Crear servidor para testing
    server = await createServer();
  });

  afterAll(async () => {
    // Cerrar servidor después de los tests
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(server).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/version', () => {
    it('should return API version information', async () => {
      const response = await request(server).get('/api/version');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('name');
      expect(response.body.name).toBe('AltaMedica API');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(server).get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Route not found');
    });
  });
});
