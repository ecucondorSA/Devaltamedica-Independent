// 🧪 TESTS INTEGRACIÓN: Appointment Booking - Flujo Completo de Reservas
// Tests críticos para el sistema de citas médicas con validación temporal y disponibilidad

import request from 'supertest';
import { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect, vi } from 'vitest';

import { logger } from '@altamedica/shared/services/logger.service';
// Mock de dependencias
vi.mock('firebase-admin', () => ({
  default: {
    apps: [],
    initializeApp: vi.fn(),
    credential: { cert: vi.fn() }
  },
  auth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user-123',
      email: 'test@example.com',
      role: 'patient'
    })
  }),
  firestore: () => ({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ id: 'test-123', available: true })
    }),
    set: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    startAfter: vi.fn().mockReturnThis()
  })
}));

// Configuración del test
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

// Headers de autenticación
const patientAuthHeaders = {
  'Authorization': 'Bearer mock-jwt-token-patient',
  'Content-Type': 'application/json',
  'X-Test-User': 'integration-test-patient'
};

const doctorAuthHeaders = {
  'Authorization': 'Bearer mock-jwt-token-doctor',
  'Content-Type': 'application/json', 
  'X-Test-User': 'integration-test-doctor'
};

const adminAuthHeaders = {
  'Authorization': 'Bearer mock-jwt-token-admin',
  'Content-Type': 'application/json',
  'X-Test-User': 'integration-test-admin'
};

// 📊 DATOS DE PRUEBA
const testDoctor = {
  id: 'doctor-test-123',
  firstName: 'Dr. Ana',
  lastName: 'García',
  email: 'ana.garcia@altamedica.com',
  specialization: 'Cardiología',
  licenseNumber: 'MED987654',
  schedule: {
    monday: { start: '09:00', end: '17:00', slots: 30 },
    tuesday: { start: '09:00', end: '17:00', slots: 30 },
    wednesday: { start: '09:00', end: '13:00', slots: 30 },
    thursday: { start: '09:00', end: '17:00', slots: 30 },
    friday: { start: '09:00', end: '17:00', slots: 30 },
    saturday: { start: '09:00', end: '13:00', slots: 30 },
    sunday: { available: false }
  },
  consultationTypes: [
    { type: 'consultation', duration: 30, price: 5000 },
    { type: 'follow-up', duration: 20, price: 3000 },
    { type: 'emergency', duration: 45, price: 8000 }
  ]
};

const testPatient = {
  id: 'patient-test-456',
  firstName: 'Carlos',
  lastName: 'Rodríguez',
  email: 'carlos.rodriguez@email.com',
  phone: '+54 11 1234-5678',
  dateOfBirth: '1985-03-15',
  healthInsurance: {
    provider: 'OSDE',
    planNumber: '123456',
    memberNumber: 'MEM789012'
  }
};

const testAppointmentRequest = {
  doctorId: 'doctor-test-123',
  patientId: 'patient-test-456',
  appointmentType: 'consultation',
  preferredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 días
  preferredTime: '10:00',
  reason: 'Dolor en el pecho y palpitaciones',
  symptoms: ['chest_pain', 'palpitations', 'shortness_of_breath'],
  urgency: 'normal',
  notes: 'Paciente refiere síntomas desde hace 3 días',
  insuranceCoverage: true
};

const emergencyAppointmentRequest = {
  doctorId: 'doctor-test-123',
  patientId: 'patient-test-456',
  appointmentType: 'emergency',
  preferredDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2 horas
  reason: 'Dolor de pecho severo con irradiación',
  symptoms: ['severe_chest_pain', 'nausea', 'sweating'],
  urgency: 'high',
  notes: 'Posible síndrome coronario agudo'
};

describe('📅 Appointment Booking - Sistema Completo de Citas', () => {
  let testAppointmentId: string;
  let testDoctorId: string;
  let testPatientId: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    logger.info('🚀 Iniciando tests de integración de citas médicas...');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    logger.info('✅ Tests de citas médicas completados');
  });

  beforeEach(async () => {
    testAppointmentId = `appointment-test-${Date.now()}`;
    testDoctorId = `doctor-test-${Date.now()}`;
    testPatientId = `patient-test-${Date.now()}`;

    // Crear doctor y paciente de prueba
    await request(API_BASE_URL)
      .post('/api/v1/doctors')
      .set(adminAuthHeaders)
      .send({
        ...testDoctor,
        id: testDoctorId
      });

    await request(API_BASE_URL)
      .post('/api/v1/patients')
      .set(doctorAuthHeaders)
      .send({
        ...testPatient,
        id: testPatientId
      });
  });

  afterEach(async () => {
    // Cleanup
    try {
      await request(API_BASE_URL)
        .delete(`/api/v1/appointments/${testAppointmentId}`)
        .set(adminAuthHeaders);
        
      await request(API_BASE_URL)
        .delete(`/api/v1/doctors/${testDoctorId}`)
        .set(adminAuthHeaders);
        
      await request(API_BASE_URL)
        .delete(`/api/v1/patients/${testPatientId}`)
        .set(adminAuthHeaders);
    } catch (error) {
      // Ignorar errores de cleanup
    }
  });

  describe('🗓️ Disponibilidad de Doctores', () => {
    
    test('Debe obtener slots disponibles para un doctor específico', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const tomorrowISO = tomorrow.toISOString().split('T')[0];

      const response = await request(API_BASE_URL)
        .get(`/api/v1/doctors/${testDoctorId}/availability`)
        .set(patientAuthHeaders)
        .query({
          date: tomorrowISO,
          appointmentType: 'consultation'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.availableSlots).toBeDefined();
      expect(response.body.data.date).toBe(tomorrowISO);
      
      // Verificar estructura de slots
      response.body.data.availableSlots.forEach(slot => {
        expect(slot.time).toMatch(/^\d{2}:\d{2}$/);
        expect(slot.available).toBe(true);
        expect(slot.duration).toBe(30); // Para consultation
      });
    }, TEST_TIMEOUT);

    test('Debe filtrar slots ocupados correctamente', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      // Crear una cita existente
      await request(API_BASE_URL)
        .post('/api/v1/appointments')
        .set(patientAuthHeaders)
        .send({
          ...testAppointmentRequest,
          id: `existing-appointment-${Date.now()}`,
          doctorId: testDoctorId,
          patientId: testPatientId,
          appointmentDate: `${tomorrowDate}T10:00:00Z`,
          status: 'confirmed'
        })
        .expect(201);

      // Verificar disponibilidad
      const response = await request(API_BASE_URL)
        .get(`/api/v1/doctors/${testDoctorId}/availability`)
        .set(patientAuthHeaders)
        .query({
          date: tomorrowDate,
          appointmentType: 'consultation'
        })
        .expect(200);

      // El slot 10:00 debe estar ocupado
      const slot10am = response.body.data.availableSlots.find(slot => slot.time === '10:00');
      expect(slot10am.available).toBe(false);
      expect(slot10am.reason).toBe('booked');
    }, TEST_TIMEOUT);

    test('Debe manejar horarios especiales y excepciones', async () => {
      // Crear excepción de horario (doctor no disponible)
      const exceptionDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const exceptionDateISO = exceptionDate.toISOString().split('T')[0];

      await request(API_BASE_URL)
        .post(`/api/v1/doctors/${testDoctorId}/schedule-exceptions`)
        .set(doctorAuthHeaders)
        .send({
          date: exceptionDateISO,
          type: 'unavailable',
          reason: 'Congreso médico',
          allDay: true
        })
        .expect(201);

      // Verificar que no hay disponibilidad
      const response = await request(API_BASE_URL)
        .get(`/api/v1/doctors/${testDoctorId}/availability`)
        .set(patientAuthHeaders)
        .query({
          date: exceptionDateISO,
          appointmentType: 'consultation'
        })
        .expect(200);

      expect(response.body.data.availableSlots).toHaveLength(0);
      expect(response.body.data.reason).toBe('Congreso médico');
    }, TEST_TIMEOUT);

    test('Debe calcular tiempo de viaje entre citas para doctores itinerantes', async () => {
      // Este test sería para doctores que atienden en múltiples ubicaciones
      const response = await request(API_BASE_URL)
        .get(`/api/v1/doctors/${testDoctorId}/availability`)
        .set(patientAuthHeaders)
        .query({
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          appointmentType: 'consultation',
          location: 'clinic_branch_2'
        })
        .expect(200);

      expect(response.body.data.travelTimeBuffer).toBeDefined();
      // Los slots deben incluir tiempo de buffer para viajes
    }, TEST_TIMEOUT);
  });

  describe('📝 Creación de Citas', () => {
    
    test('Debe crear cita médica normal exitosamente', async () => {
      const appointmentData = {
        ...testAppointmentRequest,
        id: testAppointmentId,
        doctorId: testDoctorId,
        patientId: testPatientId
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/appointments')
        .set(patientAuthHeaders)
        .send(appointmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAppointmentId);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.confirmationCode).toBeDefined();
      expect(response.body.data.estimatedPrice).toBe(5000); // Consultation price
      
      // Verificar notificaciones generadas
      expect(response.body.data.notificationsSent).toBeDefined();
      expect(response.body.data.notificationsSent.patient).toBe(true);
      expect(response.body.data.notificationsSent.doctor).toBe(true);
    }, TEST_TIMEOUT);

    test('Debe manejar citas de emergencia con prioridad alta', async () => {
      const emergencyData = {
        ...emergencyAppointmentRequest,
        id: testAppointmentId,
        doctorId: testDoctorId,
        patientId: testPatientId
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/appointments')
        .set(patientAuthHeaders)
        .send(emergencyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.urgency).toBe('high');
      expect(response.body.data.status).toBe('confirmed'); // Emergencias se confirman automáticamente
      expect(response.body.data.priorityScore).toBeGreaterThan(80);
      
      // Verificar alertas de emergencia
      expect(response.body.data.emergencyAlerts).toBeDefined();
      expect(response.body.data.emergencyAlerts.doctorNotified).toBe(true);
      expect(response.body.data.emergencyAlerts.escalationTriggered).toBe(false);
    }, TEST_TIMEOUT);

    test('Debe validar conflictos de horario', async () => {
      const appointmentTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      appointmentTime.setHours(10, 0, 0, 0);

      // Crear primera cita
      await request(API_BASE_URL)
        .post('/api/v1/appointments')
        .set(patientAuthHeaders)
        .send({
          ...testAppointmentRequest,
          id: `first-appointment-${Date.now()}`,
          doctorId: testDoctorId,
          patientId: testPatientId,
          appointmentDate: appointmentTime.toISOString()
        })
        .expect(201);

      // Intentar crear segunda cita en el mismo horario
      const conflictResponse = await request(API_BASE_URL)
        .post('/api/v1/appointments')
        .set(patientAuthHeaders)
        .send({
          ...testAppointmentRequest,
          id: `conflict-appointment-${Date.now()}`,
          doctorId: testDoctorId,
          patientId: 'another-patient-123',
          appointmentDate: appointmentTime.toISOString()
        })
        .expect(409);

      expect(conflictResponse.body.success).toBe(false);
      expect(conflictResponse.body.error).toBe('time_slot_unavailable');
      expect(conflictResponse.body.conflictingAppointment).toBeDefined();
      
      // Debe sugerir horarios alternativos
      expect(conflictResponse.body.suggestedAlternatives).toBeDefined();
      expect(conflictResponse.body.suggestedAlternatives.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('Debe validar información del seguro médico', async () => {
      const appointmentWithInsurance = {
        ...testAppointmentRequest,
        id: testAppointmentId,
        doctorId: testDoctorId,
        patientId: testPatientId,
        insurancePreauthorization: {
          required: true,
          providerCode: 'OSDE001',
          procedureCode: '99213',
          estimatedCoverage: 80
        }
      };

      const response = await request(API_BASE_URL)
        .post('/api/v1/appointments')
        .set(patientAuthHeaders)
        .send(appointmentWithInsurance)
        .expect(201);

      expect(response.body.data.insuranceVerification).toBeDefined();
      expect(response.body.data.insuranceVerification.status).toBe('verified');
      expect(response.body.data.insuranceVerification.coverage).toBe(80);
      expect(response.body.data.patientPayment).toBe(1000); // 20% of 5000
    }, TEST_TIMEOUT);

    test('Debe rechazar citas fuera del horario permitido', async () => {
      const invalidTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      invalidTime.setHours(20, 0, 0, 0); // 8 PM - fuera de horario

      const response = await request(API_BASE_URL)
        .post('/api/v1/appointments')
        .set(patientAuthHeaders)
        .send({
          ...testAppointmentRequest,
          id: testAppointmentId,
          doctorId: testDoctorId,
          patientId: testPatientId,
          appointmentDate: invalidTime.toISOString()
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('outside_working_hours');
      expect(response.body.doctorSchedule).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('🔄 Gestión de Estados de Citas', () => {
    
    beforeEach(async () => {
      // Crear cita base para tests de estado
      await request(API_BASE_URL)
        .post('/api/v1/appointments')
        .set(patientAuthHeaders)
        .send({
          ...testAppointmentRequest,
          id: testAppointmentId,
          doctorId: testDoctorId,
          patientId: testPatientId
        })
        .expect(201);
    });

    test('Debe confirmar cita pendiente', async () => {
      const response = await request(API_BASE_URL)
        .patch(`/api/v1/appointments/${testAppointmentId}/confirm`)
        .set(doctorAuthHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('confirmed');
      expect(response.body.data.confirmedAt).toBeDefined();
      expect(response.body.data.confirmedBy).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe cancelar cita con razón válida', async () => {
      const cancellationData = {
        reason: 'patient_request',
        notes: 'Paciente tuvo que viajar por trabajo',
        refundRequested: true
      };

      const response = await request(API_BASE_URL)
        .patch(`/api/v1/appointments/${testAppointmentId}/cancel`)
        .set(patientAuthHeaders)
        .send(cancellationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.cancellationReason).toBe('patient_request');
      expect(response.body.data.refundProcessing).toBe(true);
      
      // Verificar notificaciones
      expect(response.body.data.notificationsSent.doctor).toBe(true);
    }, TEST_TIMEOUT);

    test('Debe reprogramar cita manteniendo historial', async () => {
      const newTime = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      newTime.setHours(14, 0, 0, 0);

      const rescheduleData = {
        newAppointmentDate: newTime.toISOString(),
        reason: 'doctor_unavailable',
        notes: 'Doctor tiene emergencia médica'
      };

      const response = await request(API_BASE_URL)
        .patch(`/api/v1/appointments/${testAppointmentId}/reschedule`)
        .set(doctorAuthHeaders)
        .send(rescheduleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rescheduled');
      expect(response.body.data.newAppointmentDate).toBe(newTime.toISOString());
      
      // Verificar historial
      expect(response.body.data.rescheduleHistory).toBeDefined();
      expect(response.body.data.rescheduleHistory.length).toBe(1);
    }, TEST_TIMEOUT);

    test('Debe marcar cita como completada con notas', async () => {
      // Primero confirmar la cita
      await request(API_BASE_URL)
        .patch(`/api/v1/appointments/${testAppointmentId}/confirm`)
        .set(doctorAuthHeaders)
        .expect(200);

      const completionData = {
        consultationNotes: 'Paciente evaluado, síntomas relacionados con ansiedad',
        diagnosis: 'Trastorno de ansiedad generalizada',
        treatmentPlan: 'Terapia cognitivo-conductual y seguimiento en 2 semanas',
        prescriptions: [
          {
            medication: 'Escitalopram',
            dose: '10mg',
            frequency: '1 vez al día',
            duration: '30 días'
          }
        ],
        followUpRequired: true,
        followUpIn: 14 // días
      };

      const response = await request(API_BASE_URL)
        .patch(`/api/v1/appointments/${testAppointmentId}/complete`)
        .set(doctorAuthHeaders)
        .send(completionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.completedAt).toBeDefined();
      expect(response.body.data.medicalRecordCreated).toBe(true);
      expect(response.body.data.followUpScheduled).toBe(true);
    }, TEST_TIMEOUT);

    test('Debe manejar no-show de pacientes', async () => {
      // Simular que pasó el tiempo de la cita
      const pastTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hora atrás
      
      const response = await request(API_BASE_URL)
        .patch(`/api/v1/appointments/${testAppointmentId}/no-show`)
        .set(doctorAuthHeaders)
        .send({
          notes: 'Paciente no se presentó, se intentó contactar sin éxito',
          chargeNoShowFee: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('no_show');
      expect(response.body.data.noShowFeeCharged).toBe(true);
      expect(response.body.data.slotReleased).toBe(true);
    }, TEST_TIMEOUT);
  });

  describe('🔍 Búsqueda y Filtrado de Citas', () => {
    
    test('Debe buscar citas por paciente con filtros', async () => {
      // Crear múltiples citas
      const baseDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await Promise.all([
        request(API_BASE_URL)
          .post('/api/v1/appointments')
          .set(patientAuthHeaders)
          .send({
            ...testAppointmentRequest,
            id: `${testAppointmentId}-1`,
            doctorId: testDoctorId,
            patientId: testPatientId,
            appointmentDate: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000).toISOString(),
            appointmentType: 'consultation'
          }),
        
        request(API_BASE_URL)
          .post('/api/v1/appointments')
          .set(patientAuthHeaders)
          .send({
            ...testAppointmentRequest,
            id: `${testAppointmentId}-2`,
            doctorId: testDoctorId,
            patientId: testPatientId,
            appointmentDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            appointmentType: 'follow-up'
          })
      ]);

      // Buscar todas las citas del paciente
      const response = await request(API_BASE_URL)
        .get(`/api/v1/patients/${testPatientId}/appointments`)
        .set(patientAuthHeaders)
        .query({
          status: 'pending',
          appointmentType: 'consultation'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toHaveLength(1);
      expect(response.body.data.appointments[0].appointmentType).toBe('consultation');
    }, TEST_TIMEOUT);

    test('Debe obtener citas del doctor con detalles del paciente', async () => {
      // Crear cita
      await request(API_BASE_URL)
        .post('/api/v1/appointments')
        .set(patientAuthHeaders)
        .send({
          ...testAppointmentRequest,
          id: testAppointmentId,
          doctorId: testDoctorId,
          patientId: testPatientId
        })
        .expect(201);

      const response = await request(API_BASE_URL)
        .get(`/api/v1/doctors/${testDoctorId}/appointments`)
        .set(doctorAuthHeaders)
        .query({
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.appointments).toBeDefined();
      
      if (response.body.data.appointments.length > 0) {
        const appointment = response.body.data.appointments[0];
        expect(appointment.patient).toBeDefined();
        expect(appointment.patient.firstName).toBe('Carlos');
        expect(appointment.reason).toBeDefined();
      }
    }, TEST_TIMEOUT);

    test('Debe generar agenda diaria del doctor', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await request(API_BASE_URL)
        .get(`/api/v1/doctors/${testDoctorId}/daily-schedule`)
        .set(doctorAuthHeaders)
        .query({ date: tomorrow })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.date).toBe(tomorrow);
      expect(response.body.data.totalSlots).toBeDefined();
      expect(response.body.data.bookedSlots).toBeDefined();
      expect(response.body.data.availableSlots).toBeDefined();
      expect(response.body.data.schedule).toBeDefined();
      
      // Verificar estructura de schedule
      response.body.data.schedule.forEach(slot => {
        expect(slot.time).toBeDefined();
        expect(slot.status).toMatch(/available|booked|blocked/);
      });
    }, TEST_TIMEOUT);
  });

  describe('📊 Reportes y Analytics', () => {
    
    test('Debe generar estadísticas de citas por período', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/appointments/analytics')
        .set(adminAuthHeaders)
        .query({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          groupBy: 'doctor'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary.totalAppointments).toBeDefined();
      expect(response.body.data.summary.completedAppointments).toBeDefined();
      expect(response.body.data.summary.cancelledAppointments).toBeDefined();
      expect(response.body.data.summary.noShowRate).toBeDefined();
      expect(response.body.data.breakdown).toBeDefined();
    }, TEST_TIMEOUT);

    test('Debe calcular tiempo promedio de consulta por especialidad', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/appointments/analytics/consultation-times')
        .set(adminAuthHeaders)
        .query({
          period: 'last_month',
          groupBy: 'specialization'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.averageConsultationTime).toBeDefined();
      expect(response.body.data.specializations).toBeDefined();
      
      response.body.data.specializations.forEach(spec => {
        expect(spec.name).toBeDefined();
        expect(spec.averageTime).toBeGreaterThan(0);
        expect(spec.appointmentCount).toBeGreaterThanOrEqual(0);
      });
    }, TEST_TIMEOUT);

    test('Debe identificar patrones de cancelación', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/appointments/analytics/cancellation-patterns')
        .set(adminAuthHeaders)
        .query({
          period: 'last_quarter'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.cancellationRate).toBeDefined();
      expect(response.body.data.commonReasons).toBeDefined();
      expect(response.body.data.timePatterns).toBeDefined();
      expect(response.body.data.recommendations).toBeDefined();
    }, TEST_TIMEOUT);
  });

  describe('⚡ Rendimiento y Concurrencia', () => {
    
    test('Debe manejar múltiples reservas simultáneas sin conflictos', async () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const baseTime = new Date(tomorrow.setHours(9, 0, 0, 0));
      
      // Crear múltiples pacientes
      const patients = await Promise.all(
        Array(5).fill(null).map(async (_, i) => {
          const patientId = `concurrent-patient-${i}-${Date.now()}`;
          await request(API_BASE_URL)
            .post('/api/v1/patients')
            .set(doctorAuthHeaders)
            .send({
              ...testPatient,
              id: patientId,
              email: `patient${i}@test.com`
            });
          return patientId;
        })
      );

      // Intentar reservar el mismo slot simultáneamente
      const simultaneousRequests = patients.map((patientId, i) => 
        request(API_BASE_URL)
          .post('/api/v1/appointments')
          .set(patientAuthHeaders)
          .send({
            ...testAppointmentRequest,
            id: `concurrent-appointment-${i}-${Date.now()}`,
            doctorId: testDoctorId,
            patientId: patientId,
            appointmentDate: baseTime.toISOString()
          })
      );

      const responses = await Promise.all(
        simultaneousRequests.map(req => req.catch(err => err.response))
      );

      // Solo una reserva debe ser exitosa
      const successfulResponses = responses.filter(res => res.status === 201);
      const conflictResponses = responses.filter(res => res.status === 409);
      
      expect(successfulResponses).toHaveLength(1);
      expect(conflictResponses).toHaveLength(4);

      logger.info(`✅ Concurrencia manejada: 1 exitosa, 4 rechazadas por conflicto`);
    }, TEST_TIMEOUT);

    test('Debe responder rápidamente en búsquedas de disponibilidad', async () => {
      const startTime = Date.now();
      
      const response = await request(API_BASE_URL)
        .get(`/api/v1/doctors/${testDoctorId}/availability`)
        .set(patientAuthHeaders)
        .query({
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          appointmentType: 'consultation'
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(1000); // Menos de 1 segundo
      
      logger.info(`⚡ Búsqueda de disponibilidad para 30 días: ${responseTime}ms`);
    }, TEST_TIMEOUT);
  });
});