
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp-up a 50 usuarios en 30s
    { duration: '1m', target: 50 },   // Mantener 50 usuarios por 1 minuto
    { duration: '10s', target: 0 },    // Ramp-down a 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% de las peticiones deben ser < 500ms
    'http_req_failed': ['rate<0.01'],   // Tasa de fallos < 1%
  },
};

export default function () {
  const res = http.get('http://localhost:3001/api/health');
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response body is correct': (r) => r.body.includes('"ok":true'),
  });

  sleep(1); // Esperar 1 segundo entre peticiones
}
