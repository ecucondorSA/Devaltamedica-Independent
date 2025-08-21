import { test, expect } from '@playwright/test';
import { MedicalHelpers } from '../../utils/medical-helpers';
import { ComplianceValidators } from '../../utils/compliance-validators';

/**
 * EMERGENCY MEDICAL CONSULTATION TESTING
 * 
 * Critical Path: Emergency medical consultation must complete within 3 seconds
 * HIPAA: All emergency data must be encrypted and audited
 * Accessibility: Emergency interface must be WCAG 2.2 AA compliant
 */

test.describe('Emergency Medical Consultation - Critical Path', () => {
  let medicalHelpers: MedicalHelpers;
  let complianceValidator: ComplianceValidators;

  test.beforeEach(async ({ page }) => {
    medicalHelpers = new MedicalHelpers(page);
    complianceValidator = new ComplianceValidators(page);
    
    // Navigate to emergency portal
    await page.goto('/emergency');
    
    // Verify HIPAA audit logging is active
    await complianceValidator.verifyHIPAAAuditLogging();
  });

  test('Emergency consultation startup within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    // Patient initiates emergency call
    await test.step('Patient initiates emergency consultation', async () => {
      await page.click('[data-testid="emergency-call-button"]');
      await expect(page.locator('[data-testid="emergency-alert"]')).toBeVisible();
    });

    // Doctor receives immediate notification
    await test.step('Doctor receives emergency notification', async () => {
      await expect(page.locator('[data-testid="doctor-emergency-notification"]')).toBeVisible();
      await expect(page.locator('[data-testid="doctor-available-status"]')).toContainText('Available');
    });

    // Emergency session establishment
    await test.step('Emergency session established', async () => {
      await page.click('[data-testid="accept-emergency-call"]');
      await expect(page.locator('[data-testid="emergency-session-active"]')).toBeVisible();
    });

    // Verify response time requirement
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(3000); // <3s critical requirement
    
    // Log performance metrics for medical compliance
    await medicalHelpers.logMedicalMetric('emergency_response_time', responseTime);
  });

  test('Emergency WebRTC connection quality', async ({ page }) => {
    await test.step('Establish emergency video call', async () => {
      await page.click('[data-testid="emergency-call-button"]');
      await page.click('[data-testid="accept-emergency-call"]');
      
      // Wait for WebRTC connection
      await expect(page.locator('[data-testid="video-stream-active"]')).toBeVisible();
    });

    await test.step('Validate WebRTC quality metrics', async () => {
      // Check video quality
      const videoElement = page.locator('video[data-testid="patient-video"]');
      await expect(videoElement).toBeVisible();
      
      // Validate audio connection
      const audioLevel = await page.evaluate(() => {
        return (window as any).webrtcStats?.audioLevel || 0;
      });
      expect(audioLevel).toBeGreaterThan(0);

      // Check latency requirement (<100ms for medical video)
      const latency = await medicalHelpers.measureWebRTCLatency();
      expect(latency).toBeLessThan(100);
    });
  });

  test('Emergency HIPAA compliance validation', async ({ page }) => {
    await test.step('Initiate emergency with PHI data', async () => {
      await medicalHelpers.createTestPatient({
        name: 'Emergency Test Patient',
        ssn: '***-**-****', // Masked for testing
        medicalCondition: 'Chest pain, difficulty breathing'
      });
      
      await page.click('[data-testid="emergency-call-button"]');
    });

    await test.step('Verify PHI protection during emergency', async () => {
      // Ensure PHI is encrypted in transit
      await complianceValidator.verifyPHIEncryption();
      
      // Validate audit trail creation
      const auditEntry = await complianceValidator.getLatestAuditEntry();
      expect(auditEntry.action).toBe('emergency_consultation_initiated');
      expect(auditEntry.phi_handled).toBe(true);
      expect(auditEntry.encryption_status).toBe('encrypted');
    });

    await test.step('Verify emergency medical record integrity', async () => {
      // Check that emergency consultation is logged
      const medicalRecord = await medicalHelpers.getPatientMedicalRecord();
      expect(medicalRecord.emergency_consultations).toHaveLength(1);
      expect(medicalRecord.emergency_consultations[0].timestamp).toBeDefined();
      expect(medicalRecord.emergency_consultations[0].doctor_id).toBeDefined();
    });
  });

  test('Emergency accessibility compliance (WCAG 2.2 AA)', async ({ page }) => {
    await test.step('Verify emergency button accessibility', async () => {
      const emergencyButton = page.locator('[data-testid="emergency-call-button"]');
      
      // Check ARIA attributes
      await expect(emergencyButton).toHaveAttribute('aria-label', 'Emergency Medical Consultation');
      await expect(emergencyButton).toHaveAttribute('role', 'button');
      
      // Verify keyboard navigation
      await emergencyButton.focus();
      await expect(emergencyButton).toBeFocused();
      
      // Test high contrast mode compatibility
      await page.emulateMedia({ colorScheme: 'dark' });
      await expect(emergencyButton).toBeVisible();
    });

    await test.step('Verify emergency interface color contrast', async () => {
      // Emergency red button must meet WCAG contrast requirements
      const contrastRatio = await complianceValidator.checkColorContrast(
        '[data-testid="emergency-call-button"]'
      );
      expect(contrastRatio).toBeGreaterThan(4.5); // WCAG AA requirement
    });

    await test.step('Test emergency with screen reader simulation', async () => {
      // Simulate screen reader navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Verify emergency process works with keyboard only
      await expect(page.locator('[data-testid="emergency-alert"]')).toBeVisible();
    });
  });

  test('Emergency consultation multiple patient scenario', async ({ page }) => {
    await test.step('Simulate multiple emergency calls', async () => {
      // Create multiple test patients
      const patients = await Promise.all([
        medicalHelpers.createTestPatient({ name: 'Patient 1', priority: 'critical' }),
        medicalHelpers.createTestPatient({ name: 'Patient 2', priority: 'urgent' }),
        medicalHelpers.createTestPatient({ name: 'Patient 3', priority: 'moderate' })
      ]);
      
      // Initiate emergency calls simultaneously
      for (const patient of patients) {
        await medicalHelpers.initiateEmergencyCall(patient.id);
      }
    });

    await test.step('Verify priority queue management', async () => {
      // Check that critical priority is handled first
      const queueOrder = await page.locator('[data-testid="emergency-queue"] .patient-item').allTextContents();
      expect(queueOrder[0]).toContain('Patient 1'); // Critical priority first
    });

    await test.step('Validate concurrent emergency handling', async () => {
      // Ensure system can handle multiple emergencies
      const activeEmergencies = await page.locator('[data-testid="active-emergency"]').count();
      expect(activeEmergencies).toBeGreaterThan(0);
      
      // Verify no data leakage between emergency sessions
      await complianceValidator.verifySessionIsolation();
    });
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data and verify audit trail completion
    await medicalHelpers.cleanupTestData();
    await complianceValidator.finalizeAuditTrail();
    
    // Generate emergency test report
    await medicalHelpers.generateEmergencyTestReport();
  });
});