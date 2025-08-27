
import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Datos de prueba para usuarios (en un entorno real, esto vendría de un archivo o API)
const users = new SharedArray('users', function () {
    return [
        { email: 'testuser1@altamedica.com', password: 'password123' },
        { email: 'testuser2@altamedica.com', password: 'password123' },
    ];
});

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '40s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:login}': ['p(95)<800'],
    'http_req_failed{name:login}': ['rate<0.05'],
  },
};

export default function () {
  const user = users[__VU % users.length];
  const url = 'http://localhost:3001/api/auth/login';
  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'login' },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'login status is 200': (r) => r.status === 200,
    'login response contains token': (r) => r.json('token') !== '',
  });

  sleep(2);
}
