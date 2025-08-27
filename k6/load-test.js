/**
 * K6 Load Test - AltaMedica API
 * Performance and load testing for backend services
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const patientListDuration = new Trend('patient_list_duration');
const appointmentCreationDuration = new Trend('appointment_creation_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '10m', target: 100 }, // Stay at 100 users
    { duration: '5m', target: 200 },  // Ramp up to 200 users
    { duration: '10m', target: 200 }, // Stay at 200 users
    { duration: '5m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'],              // Error rate must be below 10%
    'login_duration': ['p(95)<1000'],
    'patient_list_duration': ['p(95)<800'],
    'appointment_creation_duration': ['p(95)<1200'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

// Test data
const testUsers = [
  { email: 'doctor1@altamedica.com', password: 'Test123!@#', role: 'DOCTOR' },
  { email: 'patient1@altamedica.com', password: 'Test123!@#', role: 'PATIENT' },
  { email: 'admin@altamedica.com', password: 'Test123!@#', role: 'ADMIN' },
];

// Helper function to get random user
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

// Helper function to handle response
function handleResponse(res, name) {
  const success = check(res, {
    [`${name}: status is 200`]: (r) => r.status === 200,
    [`${name}: response time < 500ms`]: (r) => r.timings.duration < 500,
    [`${name}: has success property`]: (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
  return success;
}

export default function () {
  const user = getRandomUser();
  let authToken = '';

  // Test 1: Authentication
  group('Authentication Flow', () => {
    const loginRes = http.post(
      `${BASE_URL}/auth/sso`,
      JSON.stringify({
        email: user.email,
        password: user.password,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'login' },
      }
    );
    
    loginDuration.add(loginRes.timings.duration);
    
    if (handleResponse(loginRes, 'Login')) {
      const body = JSON.parse(loginRes.body);
      authToken = body.data?.accessToken || '';
    }
    
    sleep(1);
  });

  // Skip further tests if auth failed
  if (!authToken) {
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  };

  // Test 2: Patient List (for doctors/admins)
  if (user.role !== 'PATIENT') {
    group('Patient Management', () => {
      const startTime = Date.now();
      const patientsRes = http.get(`${BASE_URL}/patients`, {
        headers: authHeaders,
        tags: { name: 'get_patients' },
      });
      
      patientListDuration.add(Date.now() - startTime);
      handleResponse(patientsRes, 'Get Patients');
      
      sleep(1);
      
      // Create a new patient
      const createPatientRes = http.post(
        `${BASE_URL}/patients`,
        JSON.stringify({
          firstName: `Test${Math.random()}`,
          lastName: 'Patient',
          email: `test${Date.now()}@altamedica.com`,
          dateOfBirth: '1990-01-01',
          phone: '+1234567890',
        }),
        {
          headers: authHeaders,
          tags: { name: 'create_patient' },
        }
      );
      
      handleResponse(createPatientRes, 'Create Patient');
      
      sleep(1);
    });
  }

  // Test 3: Appointments
  group('Appointment Management', () => {
    // Get appointments
    const appointmentsRes = http.get(`${BASE_URL}/appointments`, {
      headers: authHeaders,
      tags: { name: 'get_appointments' },
    });
    
    handleResponse(appointmentsRes, 'Get Appointments');
    
    sleep(1);
    
    // Create appointment
    const startTime = Date.now();
    const createAppointmentRes = http.post(
      `${BASE_URL}/appointments`,
      JSON.stringify({
        patientId: 'test-patient-id',
        doctorId: 'test-doctor-id',
        date: new Date(Date.now() + 86400000).toISOString(),
        time: '14:00',
        type: 'consultation',
        duration: 30,
        reason: 'Load test appointment',
      }),
      {
        headers: authHeaders,
        tags: { name: 'create_appointment' },
      }
    );
    
    appointmentCreationDuration.add(Date.now() - startTime);
    handleResponse(createAppointmentRes, 'Create Appointment');
    
    sleep(2);
  });

  // Test 4: Medical Records (for doctors)
  if (user.role === 'DOCTOR') {
    group('Medical Records', () => {
      const medicalRecordsRes = http.get(`${BASE_URL}/medical-records`, {
        headers: authHeaders,
        tags: { name: 'get_medical_records' },
      });
      
      handleResponse(medicalRecordsRes, 'Get Medical Records');
      
      sleep(1);
    });
  }

  // Test 5: Telemedicine Sessions
  group('Telemedicine', () => {
    const sessionsRes = http.get(`${BASE_URL}/telemedicine/sessions`, {
      headers: authHeaders,
      tags: { name: 'get_sessions' },
    });
    
    handleResponse(sessionsRes, 'Get Telemedicine Sessions');
    
    sleep(1);
    
    // Create a telemedicine session
    const createSessionRes = http.post(
      `${BASE_URL}/telemedicine/sessions`,
      JSON.stringify({
        patientId: 'test-patient-id',
        doctorId: 'test-doctor-id',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        duration: 30,
      }),
      {
        headers: authHeaders,
        tags: { name: 'create_session' },
      }
    );
    
    handleResponse(createSessionRes, 'Create Telemedicine Session');
    
    sleep(2);
  });

  // Test 6: Health Check
  group('System Health', () => {
    const healthRes = http.get(`${BASE_URL.replace('/api/v1', '/api/health')}`, {
      tags: { name: 'health_check' },
    });
    
    check(healthRes, {
      'Health check status is 200': (r) => r.status === 200,
      'Health check response time < 100ms': (r) => r.timings.duration < 100,
    });
    
    sleep(1);
  });

  // Random sleep between iterations
  sleep(Math.random() * 3 + 1);
}