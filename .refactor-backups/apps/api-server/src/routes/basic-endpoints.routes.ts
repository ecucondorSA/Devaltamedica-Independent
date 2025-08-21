import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';

const router = Router();

// Mock data para pruebas
const mockDoctors = [
  {
    id: '1',
    firstName: 'Dr. Juan',
    lastName: 'Pérez',
    email: 'juan.perez@altamedica.com',
    specialization: 'Cardiología',
    licenseNumber: 'MED123456',
    experience: 10,
    rating: 4.8,
    status: 'active',
  },
  {
    id: '2',
    firstName: 'Dra. María',
    lastName: 'González',
    email: 'maria.gonzalez@altamedica.com',
    specialization: 'Pediatría',
    licenseNumber: 'MED789012',
    experience: 15,
    rating: 4.9,
    status: 'active',
  },
];

const mockPatients = [
  {
    id: '1',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    email: 'carlos.rodriguez@email.com',
    phone: '+54 11 1234-5678',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    status: 'active',
  },
  {
    id: '2',
    firstName: 'Ana',
    lastName: 'Martínez',
    email: 'ana.martinez@email.com',
    phone: '+54 11 8765-4321',
    dateOfBirth: '1990-07-22',
    gender: 'female',
    status: 'active',
  },
];

const mockCompanies = [
  {
    id: '1',
    name: 'TechCorp Argentina',
    email: 'rrhh@techcorp.com.ar',
    phone: '+54 11 4000-1234',
    address: 'Av. Corrientes 1234, CABA',
    employeeCount: 250,
    planType: 'premium',
    status: 'active',
  },
  {
    id: '2',
    name: 'Industrias del Sur',
    email: 'contacto@industriassur.com',
    phone: '+54 11 4000-5678',
    address: 'San Martín 567, La Plata',
    employeeCount: 150,
    planType: 'standard',
    status: 'active',
  },
];

// 👨‍⚕️ DOCTORS ENDPOINTS
router.get('/doctors', authMiddleware, authorize(['ADMIN', 'DOCTOR', 'COMPANY']), (req, res) => {
  const { limit = '10', offset = '0', specialization } = req.query;

  let filteredDoctors = mockDoctors;

  if (specialization) {
    filteredDoctors = mockDoctors.filter((d) =>
      d.specialization.toLowerCase().includes((specialization as string).toLowerCase()),
    );
  }

  const start = parseInt(offset as string);
  const end = start + parseInt(limit as string);
  const paginatedDoctors = filteredDoctors.slice(start, end);

  res.json({
    data: paginatedDoctors,
    pagination: {
      total: filteredDoctors.length,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
      hasMore: end < filteredDoctors.length,
    },
    timestamp: new Date().toISOString(),
  });
});

router.get(
  '/doctors/:id',
  authMiddleware,
  authorize(['ADMIN', 'DOCTOR', 'COMPANY']),
  (req, res) => {
    const doctor = mockDoctors.find((d) => d.id === req.params.id);

    if (!doctor) {
      return res.status(404).json({
        error: 'Doctor not found',
        message: `Doctor with ID ${req.params.id} does not exist`,
      });
    }

    return res.json({
      data: doctor,
      timestamp: new Date().toISOString(),
    });
  },
);

// 👥 PATIENTS ENDPOINTS
router.get('/patients', authMiddleware, authorize(['ADMIN', 'DOCTOR']), (req, res) => {
  const { limit = '10', offset = '0', search } = req.query;

  let filteredPatients = mockPatients;

  if (search) {
    const searchTerm = (search as string).toLowerCase();
    filteredPatients = mockPatients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(searchTerm) ||
        p.lastName.toLowerCase().includes(searchTerm) ||
        p.email.toLowerCase().includes(searchTerm),
    );
  }

  const start = parseInt(offset as string);
  const end = start + parseInt(limit as string);
  const paginatedPatients = filteredPatients.slice(start, end);

  res.json({
    data: paginatedPatients,
    pagination: {
      total: filteredPatients.length,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
      hasMore: end < filteredPatients.length,
    },
    timestamp: new Date().toISOString(),
  });
});

router.get(
  '/patients/:id',
  authMiddleware,
  authorize(['ADMIN', 'DOCTOR', 'PATIENT']),
  (req, res) => {
    const patient = mockPatients.find((p) => p.id === req.params.id);

    if (!patient) {
      return res.status(404).json({
        error: 'Patient not found',
        message: `Patient with ID ${req.params.id} does not exist`,
      });
    }

    return res.json({
      data: patient,
      timestamp: new Date().toISOString(),
    });
  },
);

// 🏢 COMPANIES ENDPOINTS
router.get('/companies', authMiddleware, authorize(['ADMIN']), (req, res) => {
  const { limit = '10', offset = '0', planType } = req.query;

  let filteredCompanies = mockCompanies;

  if (planType) {
    filteredCompanies = mockCompanies.filter((c) => c.planType === planType);
  }

  const start = parseInt(offset as string);
  const end = start + parseInt(limit as string);
  const paginatedCompanies = filteredCompanies.slice(start, end);

  res.json({
    data: paginatedCompanies,
    pagination: {
      total: filteredCompanies.length,
      offset: parseInt(offset as string),
      limit: parseInt(limit as string),
      hasMore: end < filteredCompanies.length,
    },
    timestamp: new Date().toISOString(),
  });
});

router.get('/companies/:id', authMiddleware, authorize(['ADMIN', 'COMPANY']), (req, res) => {
  const company = mockCompanies.find((c) => c.id === req.params.id);

  if (!company) {
    return res.status(404).json({
      error: 'Company not found',
      message: `Company with ID ${req.params.id} does not exist`,
    });
  }

  return res.json({
    data: company,
    timestamp: new Date().toISOString(),
  });
});

// 📋 APPOINTMENTS ENDPOINTS (basic)
router.get(
  '/appointments',
  authMiddleware,
  authorize(['ADMIN', 'DOCTOR', 'PATIENT']),
  (req, res) => {
    res.json({
      data: [
        {
          id: '1',
          patientId: '1',
          doctorId: '1',
          dateTime: '2025-08-09T10:00:00Z',
          type: 'consultation',
          status: 'scheduled',
        },
        {
          id: '2',
          patientId: '2',
          doctorId: '2',
          dateTime: '2025-08-09T14:30:00Z',
          type: 'follow-up',
          status: 'confirmed',
        },
      ],
      pagination: {
        total: 2,
        offset: 0,
        limit: 10,
        hasMore: false,
      },
      timestamp: new Date().toISOString(),
    });
  },
);

export default router;
