# 🧪 K6 Performance & Compliance Tests - AltaMedica

## 📋 Overview

This directory contains K6 performance and compliance tests for the AltaMedica API platform. These tests ensure our backend services meet performance requirements and HIPAA compliance standards.

## 🚀 Test Suites

### 1. Load Test (`load-test.js`)
Standard load testing to verify system performance under normal conditions.

**Scenarios:**
- Ramps up from 10 to 200 concurrent users
- Tests authentication, patient management, appointments, and telemedicine
- Duration: ~37 minutes
- Success criteria: 95% of requests < 500ms

### 2. Stress Test (`stress-test.js`)
Stress testing to find system breaking points.

**Scenarios:**
- Ramps up to 500 concurrent users
- Tests resource-intensive operations
- Tests concurrent database writes
- Large payload processing
- Burst traffic handling

### 3. HIPAA Compliance Test (`hipaa-compliance-test.js`)
Comprehensive HIPAA compliance verification.

**Test Coverage:**
- ✅ Access Control (authentication, authorization, RBAC)
- ✅ Audit Logging (PHI access tracking)
- ✅ Data Encryption (HTTPS enforcement, data at rest)
- ✅ Data Integrity (versioning, modification controls)
- ✅ Minimum Necessary Standard
- ✅ Session Security (timeouts, token management)
- ✅ Error Handling (no information leakage)
- ✅ Security vulnerabilities (SQL injection, XSS, path traversal)

## 📦 Installation

### Prerequisites

1. Install K6:
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo snap install k6

# Or download from https://k6.io/docs/getting-started/installation/
```

2. Verify installation:
```bash
k6 version
```

## 🎯 Running Tests

### Quick Start

Use the provided shell script:

```bash
# Run load test (default)
./run-tests.sh

# Run specific test type
./run-tests.sh load      # Load testing
./run-tests.sh stress    # Stress testing
./run-tests.sh hipaa     # HIPAA compliance
./run-tests.sh all       # Run all tests
```

### Manual Execution

```bash
# Basic run
k6 run load-test.js

# With custom API URL
k6 run --env API_URL=https://api.altamedica.com/api/v1 load-test.js

# With HTML report
k6 run --out html=report.html load-test.js

# With JSON output for analysis
k6 run --out json=results.json load-test.js

# With specific Virtual Users (VUs)
k6 run --vus 50 --duration 5m load-test.js
```

## 📊 Test Metrics

### Key Metrics Tracked

- **http_req_duration**: Request duration (p95, p99)
- **http_req_failed**: Failed request rate
- **errors**: Custom error rate
- **login_duration**: Authentication performance
- **patient_list_duration**: Patient list query performance
- **appointment_creation_duration**: Appointment creation time
- **hipaa_compliance_failures**: HIPAA violation rate (must be 0%)

### Success Thresholds

```javascript
thresholds: {
  http_req_duration: ['p(95)<500'],        // 95% < 500ms
  errors: ['rate<0.1'],                    // Error rate < 10%
  hipaa_compliance_failures: ['rate=0'],   // Zero HIPAA violations
}
```

## 📈 Analyzing Results

### Console Output
K6 provides real-time metrics during test execution:
```
✓ Login: status is 200
✓ Login: response time < 500ms

checks.........................: 98.45% ✓ 1234   ✗ 19
data_received..................: 2.3 MB 12 kB/s
data_sent.....................: 456 kB 2.3 kB/s
http_req_duration.............: avg=234ms p(95)=456ms
```

### JSON Output Analysis
```bash
# Generate detailed JSON report
k6 run --out json=results.json load-test.js

# Parse with jq
cat results.json | jq '.metric == "http_req_duration"'
```

### K6 Cloud Integration
```bash
# Login to K6 Cloud
k6 login cloud --token YOUR_TOKEN

# Run test in cloud
k6 cloud load-test.js
```

## 🔒 HIPAA Compliance Verification

The HIPAA compliance test validates:

1. **Authentication & Authorization**
   - Unauthenticated access blocked
   - Role-based access control enforced
   - Patient data isolation

2. **Audit Logging**
   - All PHI access logged
   - Failed access attempts tracked
   - Correlation IDs present

3. **Data Protection**
   - Encryption in transit (HTTPS)
   - Sensitive data masked (SSN, credit cards)
   - No PHI in error messages

4. **Session Management**
   - Automatic timeout < 30 minutes
   - Secure token handling
   - Session invalidation on logout

## 🚨 Troubleshooting

### Common Issues

1. **Connection refused**
   - Ensure API server is running on port 3001
   - Check firewall settings
   - Verify API_URL environment variable

2. **Authentication failures**
   - Update test user credentials
   - Check JWT token expiration settings
   - Verify auth endpoint URL

3. **High error rate**
   - Check server logs for errors
   - Verify database connection
   - Monitor server resources (CPU, memory)

4. **HIPAA test failures**
   - Review audit middleware configuration
   - Check encryption settings
   - Verify access control rules

## 📝 Test Data Management

### Test Users
Test users are defined in each test file:
```javascript
const testUsers = [
  { email: 'doctor1@altamedica.com', password: 'Test123!@#', role: 'DOCTOR' },
  { email: 'patient1@altamedica.com', password: 'Test123!@#', role: 'PATIENT' },
];
```

### Cleanup
Tests create test data during execution. Run cleanup scripts after testing:
```bash
# Clean test appointments
node scripts/cleanup-test-data.js

# Reset test database
npm run db:reset:test
```

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
name: Performance Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
jobs:
  k6-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run K6 tests
        uses: grafana/k6-action@v0.2.0
        with:
          filename: k6/load-test.js
          flags: --out json=results.json
```

### Jenkins Pipeline
```groovy
stage('Performance Tests') {
  steps {
    sh 'k6 run k6/load-test.js'
    publishHTML([
      reportDir: 'k6/results',
      reportFiles: 'report.html',
      reportName: 'K6 Performance Report'
    ])
  }
}
```

## 📚 Resources

- [K6 Documentation](https://k6.io/docs/)
- [K6 Examples](https://github.com/grafana/k6-examples)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)

## 🤝 Contributing

When adding new tests:
1. Follow existing test structure
2. Add appropriate thresholds
3. Document test scenarios
4. Update this README
5. Test locally before committing

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Contact the DevOps team
- Check the [troubleshooting guide](#troubleshooting)

---

**Last Updated**: 2025-08-27
**Maintained by**: Claude Opus Team