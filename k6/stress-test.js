/**
 * K6 Stress Test - AltaMedica API
 * Stress testing to find breaking points
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Below normal load
    { duration: '5m', target: 200 },   // Normal load
    { duration: '2m', target: 300 },   // Around breaking point
    { duration: '5m', target: 400 },   // Beyond breaking point
    { duration: '2m', target: 500 },   // Extreme load
    { duration: '10m', target: 0 },    // Recovery stage
  ],
  thresholds: {
    http_req_duration: ['p(99)<2000'], // 99% of requests must complete below 2s
    errors: ['rate<0.5'],               // Error rate must be below 50% even under stress
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

export default function () {
  // Stress test focuses on the most resource-intensive operations
  
  // 1. Complex search operation
  const searchRes = http.get(
    `${BASE_URL}/patients?search=john&filters[age][min]=20&filters[age][max]=80&sort=lastName&order=desc&page=1&limit=50`,
    {
      tags: { name: 'complex_search' },
      timeout: '10s',
    }
  );
  
  const searchSuccess = check(searchRes, {
    'Complex search status < 500': (r) => r.status < 500,
    'Complex search completes': (r) => r.status !== 0,
  });
  
  errorRate.add(!searchSuccess);
  
  if (!searchSuccess) {
    sleep(5); // Back off if server is struggling
    return;
  }
  
  // 2. Concurrent database writes
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      http.post(
        `${BASE_URL}/appointments`,
        JSON.stringify({
          patientId: `stress-patient-${i}`,
          doctorId: `stress-doctor-${i}`,
          date: new Date(Date.now() + i * 86400000).toISOString(),
          time: `${10 + i}:00`,
          type: 'consultation',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'concurrent_write' },
        }
      )
    );
  }
  
  // 3. Large payload processing
  const largePayload = {
    patientId: 'stress-test-patient',
    medicalHistory: Array(100).fill({
      date: new Date().toISOString(),
      diagnosis: 'Stress test diagnosis with very long description that simulates real medical records',
      treatment: 'Complex treatment plan with multiple medications and procedures',
      notes: 'Detailed notes about the patient condition and response to treatment over time',
      medications: Array(10).fill({
        name: 'Medication',
        dosage: '100mg',
        frequency: 'twice daily',
        duration: '30 days',
      }),
    }),
  };
  
  const largePayloadRes = http.post(
    `${BASE_URL}/medical-records/bulk`,
    JSON.stringify(largePayload),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'large_payload' },
      timeout: '30s',
    }
  );
  
  check(largePayloadRes, {
    'Large payload processed': (r) => r.status < 500,
  });
  
  // 4. Rapid fire requests (burst test)
  for (let i = 0; i < 10; i++) {
    http.get(`${BASE_URL}/health`, {
      tags: { name: 'burst_request' },
    });
  }
  
  sleep(Math.random() * 2);
}