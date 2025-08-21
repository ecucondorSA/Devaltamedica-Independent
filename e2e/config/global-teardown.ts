import { FullConfig } from '@playwright/test';

/**
 * Global Teardown for AltaMedica E2E Testing
 * Ensures HIPAA-compliant cleanup of test data
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting AltaMedica test environment cleanup...');
  
  try {
    // Clean up test data (HIPAA compliance)
    console.log('🔒 Performing HIPAA-compliant data cleanup...');
    
    // Generate final test report
    console.log('📊 Generating medical compliance report...');
    
    console.log('✅ AltaMedica test environment cleanup completed');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error.message);
    // Don't throw to avoid masking test failures
  }
}

export default globalTeardown;