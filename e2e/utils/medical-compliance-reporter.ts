import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

/**
 * Medical Compliance Reporter for AltaMedica E2E Testing
 * Generates HIPAA-compliant test reports with medical metrics
 */
class MedicalComplianceReporter implements Reporter {
  private testResults: Array<{
    test: string;
    status: string;
    duration: number;
    medicalMetrics?: any;
  }> = [];

  onTestEnd(test: TestCase, result: TestResult) {
    this.testResults.push({
      test: test.title,
      status: result.status,
      duration: result.duration,
      medicalMetrics: result.attachments?.find(a => a.name === 'medical-metrics')
    });
  }

  onEnd(result: FullResult) {
    console.log('\n🏥 AltaMedica Medical Compliance Report');
    console.log('=====================================');
    
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const total = this.testResults.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`🏥 Medical Compliance: ${failed === 0 ? 'COMPLIANT' : 'REVIEW REQUIRED'}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Medical Tests:');
      this.testResults
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  - ${r.test}`));
    }
    
    console.log('\n=====================================\n');
  }
}

export default MedicalComplianceReporter;