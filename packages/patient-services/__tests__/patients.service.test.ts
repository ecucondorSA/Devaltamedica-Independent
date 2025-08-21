import { ApiClient, CreatePatientRequest, createPatientsService, UpdatePatientRequest } from '../src/patients.service';

describe('PatientsService (unit/integration with mocked ApiClient)', () => {
  let apiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    apiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    } as any;
  });

  describe('getPatients', () => {
    it('solicita /api/v1/patients sin params cuando no se pasan page/limit', async () => {
      apiClient.get.mockResolvedValue({ success: true, data: { patients: [], total: 0 } });
      const svc = createPatientsService(apiClient);
      const res = await svc.getPatients();
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/patients');
      expect(res.success).toBe(true);
    });

    it('agrega query params page y limit cuando se especifican', async () => {
      apiClient.get.mockResolvedValue({ success: true, data: { patients: [], total: 0, page: 2, limit: 50 } });
      const svc = createPatientsService(apiClient);
      await svc.getPatients(2, 50);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/patients?page=2&limit=50');
    });
  });

  describe('getPatientsSimple', () => {
    it('solicita /api/v1/patients/simple', async () => {
      apiClient.get.mockResolvedValue({ success: true, data: [] });
      const svc = createPatientsService(apiClient);
      await svc.getPatientsSimple();
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/patients/simple');
    });
  });

  describe('getPatientById', () => {
    it('solicita el endpoint con el id', async () => {
      apiClient.get.mockResolvedValue({ success: true, data: { id: 'p1', name: 'John Doe', email: 'j@e.com', age: 30, lastVisit: '2024-01-01', status: 'active', createdAt: '', updatedAt: '' } });
      const svc = createPatientsService(apiClient);
      await svc.getPatientById('p1');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/patients/p1');
    });
  });

  describe('createPatient', () => {
    beforeAll(() => {
      // Fijar fecha del sistema para calcular edades de forma determinista
      jest.useFakeTimers().setSystemTime(new Date('2025-08-11T12:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('mapea CreatePatientRequest a payload del backend incluyendo age calculada', async () => {
      apiClient.post.mockResolvedValue({ success: true, data: { id: 'new', name: 'Jane Roe', email: 'jane@e.com', age: 35, lastVisit: '2025-01-01', status: 'active', createdAt: '', updatedAt: '' } });
      const svc = createPatientsService(apiClient);
      const payload: CreatePatientRequest = {
        firstName: 'Jane',
        lastName: 'Roe',
        email: 'jane@e.com',
        phone: '+57 300 123 4567',
        dateOfBirth: '1990-08-11', // en 2025-08-11 debe dar 35
        gender: 'female',
        bloodType: 'O+',
        allergies: ['pollen'],
        emergencyContactName: 'John',
        emergencyContactPhone: '+57 301 000 0000',
        emergencyContactRelationship: 'Husband',
        insuranceProvider: 'ACME',
        insurancePolicyNumber: 'ABC-123',
      };

      await svc.createPatient(payload);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      const [endpoint, body] = apiClient.post.mock.calls[0];
      expect(endpoint).toBe('/api/v1/patients');
      expect(body).toMatchObject({
        name: 'Jane Roe',
        email: 'jane@e.com',
        phone: '+57 300 123 4567',
        age: 35,
        gender: 'female',
        bloodType: 'O+',
        allergies: ['pollen'],
        emergencyContact: {
          name: 'John',
          phone: '+57 301 000 0000',
          relationship: 'Husband',
        },
        insurance: {
          provider: 'ACME',
          policyNumber: 'ABC-123',
        },
        dateOfBirth: '1990-08-11',
        status: 'active',
      });
    });
  });

  describe('updatePatient', () => {
    it('agrega name si vienen firstName y lastName', async () => {
      apiClient.put.mockResolvedValue({ success: true, data: { id: 'p1', name: 'Mary Jane', email: 'm@e.com', age: 32, lastVisit: '2025-01-01', status: 'active', createdAt: '', updatedAt: '' } });
      const svc = createPatientsService(apiClient);
      const updates: UpdatePatientRequest = { firstName: 'Mary', lastName: 'Jane', phone: '+57 300 000 0000' };
      await svc.updatePatient('p1', updates);
      expect(apiClient.put).toHaveBeenCalledTimes(1);
      const [endpoint, body] = apiClient.put.mock.calls[0];
      expect(endpoint).toBe('/api/v1/patients/p1');
      expect(body).toMatchObject({ firstName: 'Mary', lastName: 'Jane', phone: '+57 300 000 0000', name: 'Mary Jane' });
    });
  });

  describe('deletePatient', () => {
    it('llama DELETE al endpoint correcto', async () => {
      apiClient.delete.mockResolvedValue({ success: true, data: { success: true, message: 'ok' } });
      const svc = createPatientsService(apiClient);
      await svc.deletePatient('p1');
      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/patients/p1');
    });
  });

  describe('búsquedas y agregados', () => {
    it('searchPatients codifica el query', async () => {
      apiClient.get.mockResolvedValue({ success: true, data: [] });
      const svc = createPatientsService(apiClient);
      await svc.searchPatients('john doe');
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/patients?search=john%20doe');
    });

    it('updateCommunicationPreferences usa PATCH con payload correcto', async () => {
      apiClient.patch.mockResolvedValue({ success: true, data: { success: true } });
      const svc = createPatientsService(apiClient);
      await svc.updateCommunicationPreferences('p2', { email: true, sms: false, phone: true });
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/api/v1/patients/p2/preferences',
        { communicationPreferences: { email: true, sms: false, phone: true } }
      );
    });
  });

  describe('validatePatientData', () => {
    it('devuelve errores para email/phone inválidos y fecha futura', () => {
      const svc = createPatientsService(apiClient);
      const errors = svc.validatePatientData({
        email: 'bad-email',
        phone: 'xxx',
        dateOfBirth: '2999-01-01',
        firstName: 'A',
        lastName: 'B',
      } as any);
      expect(errors).toEqual(expect.arrayContaining([
        'Email no válido',
        'Teléfono no válido',
        'Fecha de nacimiento no puede ser futura',
      ]));
    });

    it('sin errores cuando los datos son válidos', () => {
      const svc = createPatientsService(apiClient);
      const errors = svc.validatePatientData({
        email: 'ok@example.com',
        phone: '+57 300 123 4567',
        dateOfBirth: '1990-01-01',
        firstName: 'Ok',
        lastName: 'User',
      } as any);
      expect(errors.length).toBe(0);
    });
  });
});
