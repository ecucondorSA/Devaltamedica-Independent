/**
 * 🧪 PRUEBAS UNITARIAS PARA PATIENTS SERVICE
 *
 * @group unit
 */
import { PatientsService, createPatientsService } from '../patients.service';
import type { ApiClient, Patient, ApiResponse } from '../patients.service';

// Mock del ApiClient para aislar el servicio
const mockApiClient: jest.Mocked<ApiClient> = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

// Datos de prueba
const mockPatients: Patient[] = [
  { 
    id: '1', 
    name: 'Juan Perez', 
    email: 'juan@test.com', 
    status: 'active', 
    age: 30, 
    lastVisit: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '2', 
    name: 'Ana Gomez', 
    email: 'ana@test.com', 
    status: 'inactive', 
    age: 45, 
    lastVisit: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
];

describe('PatientsService', () => {
  let service: PatientsService;

  beforeEach(() => {
    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
    // Crear una nueva instancia del servicio
    service = createPatientsService(mockApiClient);
  });

  it('debe ser creado correctamente', () => {
    expect(service).toBeDefined();
  });

  // Pruebas para getPatientById
  describe('getPatientById', () => {
    it('debe retornar un paciente si la API lo encuentra', async () => {
      const mockResponse: ApiResponse<Patient> = {
        success: true,
        data: mockPatients[0],
        message: 'Paciente encontrado',
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

  const result = await service.getPatientById('1');

  expect(result).toEqual(mockResponse);
  expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/patients/1');
    });

    it('debe lanzar un error si el paciente no existe', async () => {
      const mockResponse: ApiResponse<null> = {
        success: false,
        error: 'Paciente no encontrado',
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

  const result = await service.getPatientById('999');
  expect(result).toEqual(mockResponse);
  expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/patients/999');
    });
  });

  // Pruebas para getAllPatients
  describe('getAllPatients', () => {
    it('debe retornar una lista de pacientes', async () => {
      const mockResponse: ApiResponse<Patient[]> = {
        success: true,
        data: mockPatients,
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

  const result = await service.getPatients();

  expect(result).toEqual(mockResponse);
  expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/patients');
    });
  });

  // Pruebas para createPatient
  describe('createPatient', () => {
    it('debe crear y retornar un nuevo paciente', async () => {
      const newPatientData = { 
        firstName: 'Carlos', 
        lastName: 'Ruiz', 
        email: 'carlos@test.com', 
        dateOfBirth: '1998-01-01'
      };
      const createdPatient: Patient = { 
        id: '3', 
        name: 'Carlos Ruiz',
        email: 'carlos@test.com',
        age: 25,
        status: 'active', 
        lastVisit: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const mockResponse: ApiResponse<Patient> = {
        success: true,
        data: createdPatient,
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

  const result = await service.createPatient(newPatientData);

  expect(result).toEqual(mockResponse);
      // El servicio transforma los datos al formato backend
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/api/v1/patients',
        expect.objectContaining({
          name: expect.any(String),
          email: newPatientData.email,
        })
      );
    });
  });

  // Pruebas para updatePatient
  describe('updatePatient', () => {
    it('debe actualizar y retornar los datos del paciente', async () => {
      const updates = { firstName: 'Juan Carlos', lastName: 'Perez Garcia' };
      const updatedPatient: Patient = { 
        ...mockPatients[0], 
        name: 'Juan Carlos Perez Garcia' 
      };
      const mockResponse: ApiResponse<Patient> = {
        success: true,
        data: updatedPatient,
      };
      mockApiClient.put.mockResolvedValue(mockResponse);

  const result = await service.updatePatient('1', updates);

  expect(result).toEqual(mockResponse);
  expect(mockApiClient.put).toHaveBeenCalledWith('/api/v1/patients/1', expect.any(Object));
    });
  });

  // Pruebas para deletePatient
  describe('deletePatient', () => {
    it('debe eliminar un paciente y retornar true', async () => {
      const mockResponse: ApiResponse<void> = {
        success: true,
      };
      mockApiClient.delete.mockResolvedValue(mockResponse);

  const result = await service.deletePatient('1');

  expect(result).toEqual(mockResponse);
  expect(mockApiClient.delete).toHaveBeenCalledWith('/api/v1/patients/1');
    });

    it('debe retornar false si la eliminación falla', async () => {
        const mockResponse: ApiResponse<void> = {
          success: false,
          error: 'No se pudo eliminar'
        };
        mockApiClient.delete.mockResolvedValue(mockResponse);
  
  const result = await service.deletePatient('1');
  
  expect(result).toEqual(mockResponse);
      });
  });

  // Pruebas para searchPatients
  describe('searchPatients', () => {
    it('debe buscar pacientes por un término y retornar una lista', async () => {
        const searchTerm = 'Juan';
        const mockResponse: ApiResponse<Patient[]> = {
            success: true,
            data: [mockPatients[0]],
        };
        mockApiClient.get.mockResolvedValue(mockResponse);

  const result = await service.searchPatients(searchTerm);

  expect(result).toEqual(mockResponse);
  expect(mockApiClient.get).toHaveBeenCalledWith('/api/v1/patients?search=' + encodeURIComponent(searchTerm));
    });
  });
});
