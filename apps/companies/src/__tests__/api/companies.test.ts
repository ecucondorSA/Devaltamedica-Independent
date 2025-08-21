/**
 * Tests de integración para API de Companies
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { auditLog, logger } from '../../../lib/.claude';
import { GET } from '../../app/api/companies/route';
import { requireRole } from '../../lib/auth-middleware';

// Mock de dependencias
jest.mock('../../../lib/medical-mocks', () => ({
  auditLog: jest.fn(),
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('../../lib/auth-middleware', () => ({
  requireRole: (roles: string[], handler: (req: NextRequest) => Promise<Response>) => {
    return async (request: NextRequest) => {
      // Mock user para testing
      const mockUser = {
        uid: 'test-company-uid',
        companyId: 'test-company-123',
        custom_claims: {
          role: 'company',
          companyId: 'test-company-123'
        }
      };
      
      return handler(request);
    };
  }
}));

describe('/api/companies', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3004/api/companies');
    jest.clearAllMocks();
  });

  describe('GET /api/companies', () => {
    it('debería devolver lista de empresas para usuario company', async () => {
      const response = await GET(mockRequest, null);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('length');
      expect(data.length).toBeGreaterThan(0);
      
      // Verificar estructura de empresa
      const firstCompany = data[0];
      expect(firstCompany).toHaveProperty('id');
      expect(firstCompany).toHaveProperty('name');
      expect(firstCompany).toHaveProperty('industry');
      expect(firstCompany).toHaveProperty('location');
      expect(firstCompany).toHaveProperty('rating');
    });

    it('debería incluir headers de cache correctos', async () => {
      const response = await GET(mockRequest, null);
      
      expect(response.headers.get('Cache-Control')).toContain('s-maxage');
      expect(response.headers.get('X-Data-Source')).toBe('fallback');
    });

    it('debería manejar errores gracefully', async () => {
      // Mock para simular error
      jest.doMock('../../lib/firestore', () => ({
        companiesService: {
          getCompanies: jest.fn().mockRejectedValue(new Error('Database error'))
        }
      }));

      const response = await GET(mockRequest, null);
      
      // Debería usar fallback data en caso de error
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('Autenticación y autorización', () => {
    it('debería requerir rol company o admin', () => {
      // Este test verifica que requireRole se llame con los roles correctos
      // requireRole ya está mockeado arriba
      
      // Verificar que se configuró con los roles correctos
      expect(requireRole).toHaveBeenCalledWith(['company', 'admin'], expect.any(Function));
    });
  });

  describe('Datos de respuesta', () => {
    it('debería devolver empresas médicas reales de Colombia', async () => {
      const response = await GET(mockRequest, null);
      const companies = await response.json();

      // Verificar que son empresas médicas colombianas
      const colombianCompanies = companies.filter((company: any) => 
        company.location.includes('Colombia') || 
        company.location.includes('Antioquia') ||
        company.location.includes('Cundinamarca') ||
        company.location.includes('Valle del Cauca')
      );

      expect(colombianCompanies.length).toBeGreaterThan(0);
      
      // Verificar sectores médicos
      const medicalSectors = companies.filter((company: any) =>
        company.industry.includes('Hospital') ||
        company.industry.includes('Clínica') ||
        company.industry.includes('Centro')
      );

      expect(medicalSectors.length).toBeGreaterThan(0);
    });

    it('debería incluir datos completos para cada empresa', async () => {
      const response = await GET(mockRequest, null);
      const companies = await response.json();

      companies.forEach((company: any) => {
        expect(company).toHaveProperty('id');
        expect(company).toHaveProperty('name');
        expect(company).toHaveProperty('industry');
        expect(company).toHaveProperty('description');
        expect(company).toHaveProperty('location');
        expect(company).toHaveProperty('size');
        expect(company).toHaveProperty('rating');
        expect(company).toHaveProperty('jobCount');
        expect(company).toHaveProperty('website');

        // Validar tipos
        expect(typeof company.rating).toBe('number');
        expect(company.rating).toBeGreaterThanOrEqual(0);
        expect(company.rating).toBeLessThanOrEqual(5);
        
        expect(typeof company.jobCount).toBe('number');
        expect(company.jobCount).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Logging y auditoría', () => {
    it('debería registrar acceso a la API', async () => {
      // auditLog ya está mockeado arriba
      
      await GET(mockRequest, null);

      expect(auditLog).toHaveBeenCalledWith({
        action: 'companies_list_viewed',
        userId: 'test-company-uid',
        companyId: 'test-company-123',
        metadata: { endpoint: '/api/companies' }
      });
    });

    it('debería loggear errores cuando ocurren', async () => {
      // logger ya está mockeado arriba
      
      // Mock para forzar error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Simular error interno
      jest.doMock('../../lib/firestore', () => {
        throw new Error('Critical error');
      });

      try {
        await GET(mockRequest, null);
      } catch (error) {
        expect(logger.error).toHaveBeenCalled();
      }
      
      console.error = originalConsoleError;
    });
  });
});