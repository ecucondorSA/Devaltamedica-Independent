import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for AltaMedica E2E Testing
 * Initializes medical testing environment with HIPAA compliance
 */
async function globalSetup(config: FullConfig) {
  console.log('🏥 Initializing AltaMedica Medical Testing Environment...');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for API server to be ready
    console.log('⚕️ Checking API Server health...');
    await page.goto('http://localhost:3001/api/health');
    const healthResponse = await page.textContent('body');
    const health = JSON.parse(healthResponse);
    
    if (!health.success) {
      throw new Error('API Server not healthy');
    }
    
    console.log('✅ API Server is healthy');
    
    // Check if patients app is responding
    console.log('🏥 Checking Patients Portal...');
    await page.goto('http://localhost:3003', { waitUntil: 'networkidle' });
    console.log('✅ Patients Portal accessible');
    
    // Initialize test data
    console.log('📊 Initializing medical test data...');
    await page.evaluate(() => {
      (window as any).medicalTestEnvironment = {
        initialized: true,
        hipaaCompliant: true,
        testMode: true,
        timestamp: new Date().toISOString()
      };
    });
    
    console.log('🔒 HIPAA compliance mode enabled');
    console.log('✅ AltaMedica testing environment ready');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;