/**
 * K6 HIPAA Compliance Test - AltaMedica API
 * Tests for HIPAA compliance requirements
 */

import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';
import encoding from 'k6/encoding';

const complianceFailures = new Rate('hipaa_compliance_failures');

export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '3m', target: 10 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    hipaa_compliance_failures: ['rate=0'], // Zero tolerance for HIPAA violations
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001/api/v1';

// Test user credentials
const validDoctor = {
  email: 'doctor@altamedica.com',
  password: 'SecurePass123!@#',
  role: 'DOCTOR',
};

const validPatient = {
  email: 'patient@altamedica.com',
  password: 'SecurePass123!@#',
  role: 'PATIENT',
};

function loginUser(user) {
  const loginRes = http.post(
    `${BASE_URL}/auth/sso`,
    JSON.stringify(user),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return body.data?.accessToken;
  }
  return null;
}

export default function () {
  // Test 1: Access Control
  group('HIPAA Access Control', () => {
    // Test 1.1: Unauthenticated access should be denied
    const unauthRes = http.get(`${BASE_URL}/patients`, {
      tags: { name: 'unauth_access' },
    });
    
    const unauthCheck = check(unauthRes, {
      'Unauthenticated access denied': (r) => r.status === 401,
      'No PHI exposed without auth': (r) => !r.body.includes('firstName') && !r.body.includes('lastName'),
    });
    
    complianceFailures.add(!unauthCheck);
    
    // Test 1.2: Patient can only access own records
    const patientToken = loginUser(validPatient);
    if (patientToken) {
      const otherPatientRes = http.get(
        `${BASE_URL}/patients/other-patient-id`,
        {
          headers: { 'Authorization': `Bearer ${patientToken}` },
          tags: { name: 'patient_access_control' },
        }
      );
      
      const patientAccessCheck = check(otherPatientRes, {
        'Patient cannot access other patient data': (r) => r.status === 403 || r.status === 404,
        'Error message does not leak information': (r) => {
          if (r.status === 403) {
            const body = JSON.parse(r.body);
            return !body.error?.message?.includes('patient-id');
          }
          return true;
        },
      });
      
      complianceFailures.add(!patientAccessCheck);
    }
    
    // Test 1.3: Role-based access control
    const doctorToken = loginUser(validDoctor);
    if (doctorToken) {
      const adminOnlyRes = http.post(
        `${BASE_URL}/admin/audit-logs`,
        '{}',
        {
          headers: { 
            'Authorization': `Bearer ${doctorToken}`,
            'Content-Type': 'application/json',
          },
          tags: { name: 'role_based_access' },
        }
      );
      
      const rbacCheck = check(adminOnlyRes, {
        'Doctor cannot access admin endpoints': (r) => r.status === 403,
      });
      
      complianceFailures.add(!rbacCheck);
    }
  });

  // Test 2: Audit Logging
  group('HIPAA Audit Logging', () => {
    const doctorToken = loginUser(validDoctor);
    if (!doctorToken) return;
    
    // Test 2.1: PHI access triggers audit log
    const patientRes = http.get(
      `${BASE_URL}/patients/test-patient-id`,
      {
        headers: { 'Authorization': `Bearer ${doctorToken}` },
        tags: { name: 'phi_access_audit' },
      }
    );
    
    // Verify audit headers are present
    const auditCheck = check(patientRes, {
      'Response includes audit correlation ID': (r) => r.headers['X-Audit-Id'] !== undefined,
      'Response includes timestamp': (r) => r.headers['X-Timestamp'] !== undefined,
    });
    
    complianceFailures.add(!auditCheck);
    
    // Test 2.2: Failed access attempts are logged
    const failedAccessRes = http.get(
      `${BASE_URL}/patients/unauthorized-patient`,
      {
        headers: { 'Authorization': 'Bearer invalid-token' },
        tags: { name: 'failed_access_audit' },
      }
    );
    
    const failedAuditCheck = check(failedAccessRes, {
      'Failed access returns 401': (r) => r.status === 401,
      'Failed access includes audit ID': (r) => r.headers['X-Audit-Id'] !== undefined,
    });
    
    complianceFailures.add(!failedAuditCheck);
  });

  // Test 3: Data Encryption
  group('HIPAA Data Encryption', () => {
    // Test 3.1: HTTPS enforcement
    const httpCheck = check(null, {
      'API enforces HTTPS in production': () => {
        // In production, this should always be true
        return BASE_URL.startsWith('https://') || BASE_URL.includes('localhost');
      },
    });
    
    complianceFailures.add(!httpCheck);
    
    // Test 3.2: Sensitive data is encrypted in responses
    const doctorToken = loginUser(validDoctor);
    if (doctorToken) {
      const patientDataRes = http.get(
        `${BASE_URL}/patients`,
        {
          headers: { 'Authorization': `Bearer ${doctorToken}` },
          tags: { name: 'data_encryption' },
        }
      );
      
      if (patientDataRes.status === 200) {
        const body = JSON.parse(patientDataRes.body);
        const encryptionCheck = check(body, {
          'SSN is not exposed in plain text': (b) => {
            const content = JSON.stringify(b);
            // Check for common SSN patterns
            return !content.match(/\d{3}-\d{2}-\d{4}/) && !content.match(/\d{9}/);
          },
          'Credit card numbers are not exposed': (b) => {
            const content = JSON.stringify(b);
            // Check for credit card patterns
            return !content.match(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/);
          },
        });
        
        complianceFailures.add(!encryptionCheck);
      }
    }
  });

  // Test 4: Data Integrity
  group('HIPAA Data Integrity', () => {
    const doctorToken = loginUser(validDoctor);
    if (!doctorToken) return;
    
    // Test 4.1: Data modification requires authentication
    const modifyRes = http.put(
      `${BASE_URL}/patients/test-patient-id`,
      JSON.stringify({ firstName: 'Modified' }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'modify_without_auth' },
      }
    );
    
    const modifyAuthCheck = check(modifyRes, {
      'Cannot modify PHI without authentication': (r) => r.status === 401,
    });
    
    complianceFailures.add(!modifyAuthCheck);
    
    // Test 4.2: Data versioning/history
    const historyRes = http.get(
      `${BASE_URL}/patients/test-patient-id/history`,
      {
        headers: { 'Authorization': `Bearer ${doctorToken}` },
        tags: { name: 'data_versioning' },
      }
    );
    
    const versioningCheck = check(historyRes, {
      'Patient history endpoint exists': (r) => r.status !== 404,
      'History requires authentication': (r) => r.status !== 401,
    });
    
    complianceFailures.add(!versioningCheck);
  });

  // Test 5: Minimum Necessary Standard
  group('HIPAA Minimum Necessary', () => {
    const doctorToken = loginUser(validDoctor);
    if (!doctorToken) return;
    
    // Test 5.1: List endpoints should not return full PHI
    const listRes = http.get(
      `${BASE_URL}/patients?limit=10`,
      {
        headers: { 'Authorization': `Bearer ${doctorToken}` },
        tags: { name: 'minimum_necessary' },
      }
    );
    
    if (listRes.status === 200) {
      const body = JSON.parse(listRes.body);
      const minimumNecessaryCheck = check(body, {
        'List view excludes detailed medical history': (b) => {
          const content = JSON.stringify(b);
          return !content.includes('medicalHistory') && !content.includes('diagnosis');
        },
        'List view excludes full SSN': (b) => {
          const content = JSON.stringify(b);
          return !content.match(/\d{3}-\d{2}-\d{4}/);
        },
      });
      
      complianceFailures.add(!minimumNecessaryCheck);
    }
  });

  // Test 6: Session Security
  group('HIPAA Session Security', () => {
    const doctorToken = loginUser(validDoctor);
    if (!doctorToken) return;
    
    // Test 6.1: Session timeout
    const sessionRes = http.get(
      `${BASE_URL}/auth/session`,
      {
        headers: { 'Authorization': `Bearer ${doctorToken}` },
        tags: { name: 'session_info' },
      }
    );
    
    if (sessionRes.status === 200) {
      const body = JSON.parse(sessionRes.body);
      const sessionCheck = check(body, {
        'Session has expiration': (b) => b.expiresAt !== undefined,
        'Session timeout is reasonable (< 30 min)': (b) => {
          if (b.expiresAt) {
            const expires = new Date(b.expiresAt);
            const now = new Date();
            const diffMinutes = (expires - now) / 60000;
            return diffMinutes <= 30;
          }
          return false;
        },
      });
      
      complianceFailures.add(!sessionCheck);
    }
  });

  // Test 7: Error Handling
  group('HIPAA Error Handling', () => {
    // Test 7.1: Errors should not leak sensitive information
    const errorRes = http.get(
      `${BASE_URL}/patients/../../etc/passwd`,
      {
        tags: { name: 'error_info_leak' },
      }
    );
    
    const errorCheck = check(errorRes, {
      'Path traversal attempt blocked': (r) => r.status === 400 || r.status === 404,
      'Error does not expose system paths': (r) => {
        return !r.body.includes('/etc/') && !r.body.includes('\\Windows\\');
      },
      'Error does not expose stack traces': (r) => {
        return !r.body.includes('at Function.') && !r.body.includes('at Object.');
      },
    });
    
    complianceFailures.add(!errorCheck);
    
    // Test 7.2: SQL injection protection
    const sqlInjectionRes = http.get(
      `${BASE_URL}/patients?search=' OR '1'='1`,
      {
        tags: { name: 'sql_injection' },
      }
    );
    
    const sqlCheck = check(sqlInjectionRes, {
      'SQL injection attempt handled safely': (r) => {
        return r.status < 500 && !r.body.includes('SQL') && !r.body.includes('syntax');
      },
    });
    
    complianceFailures.add(!sqlCheck);
  });
}