/**
 * Datos de prueba para los tests E2E de AltaMedica
 */

export interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'company';
  expectedRedirect: string;
}

// Generar emails únicos usando timestamp para evitar conflictos
const timestamp = Date.now();

export const testUsers: Record<string, TestUser> = {
  patient: {
    email: `test.patient.${timestamp}@altamedica.test`,
    password: 'TestPassword123!',
    firstName: 'Juan',
    lastName: 'Paciente',
    role: 'patient',
    expectedRedirect: 'http://localhost:3003'
  },
  
  doctor: {
    email: `test.doctor.${timestamp}@altamedica.test`,
    password: 'TestPassword123!',
    firstName: 'Dra. María',
    lastName: 'Médico',
    role: 'doctor',
    expectedRedirect: 'http://localhost:3002'
  },
  
  company: {
    email: `test.company.${timestamp}@altamedica.test`,
    password: 'TestPassword123!',
    firstName: 'Carlos',
    lastName: 'Empresa',
    role: 'company',
    expectedRedirect: 'http://localhost:3004'
  }
};

export const formSelectors = {
  // Campos del formulario
  firstName: 'input[placeholder="Juan"]',
  lastName: 'input[placeholder="Pérez"]',
  email: 'input[placeholder="tu@email.com"]',
  password: 'input[placeholder="••••••••"]',
  confirmPassword: 'input[placeholder="••••••••"]', // Segundo campo de password
  termsCheckbox: 'input[name="terms"]',
  
  // Botones de rol
  patientRole: 'input[value="patient"]',
  doctorRole: 'input[value="doctor"]',
  companyRole: 'input[value="company"]',
  
  // Botones de acción
  submitButton: 'button[type="submit"]',
  googleButton: 'button:has-text("Continuar con Google")',
  
  // Estados
  loadingState: 'text=Creando cuenta...',
  successMessage: 'text=¡Registro exitoso!',
  errorMessage: '[class*="bg-red-50"]'
};

export const expectedTexts = {
  patient: {
    roleLabel: 'Paciente',
    roleDescription: 'Accede a consultas médicas y gestiona tu salud'
  },
  doctor: {
    roleLabel: 'Médico', 
    roleDescription: 'Proporciona consultas y gestiona pacientes'
  },
  company: {
    roleLabel: 'Empresa',
    roleDescription: 'Gestiona salud ocupacional de empleados'
  }
};

export const urls = {
  register: 'http://localhost:3000',
  login: 'http://localhost:3000/login',
  patients: 'http://localhost:3003',
  doctors: 'http://localhost:3002', 
  companies: 'http://localhost:3004',
  admin: 'http://localhost:3005'
};