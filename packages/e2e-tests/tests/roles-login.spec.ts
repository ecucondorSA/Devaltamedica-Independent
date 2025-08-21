import { test, expect, request } from '@playwright/test';
import { loginAndSaveState, loginViaMockTestEndpoint } from './helpers/auth';

const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL;
const PATIENT_PASSWORD = process.env.E2E_PATIENT_PASSWORD;
const DOCTOR_EMAIL = process.env.E2E_DOCTOR_EMAIL;
const DOCTOR_PASSWORD = process.env.E2E_DOCTOR_PASSWORD;

test.describe('@smoke login-redirect-per-role', () => {
  test(process.env.E2E_USE_MOCK_LOGIN === '1' || (PATIENT_EMAIL && PATIENT_PASSWORD) ? 'patient → redirects to patients dashboard' : 'skipped patient login (missing creds)', async ({ page }) => {
    const ctx = await request.newContext();
    if (process.env.E2E_USE_MOCK_LOGIN === '1') {
      await loginViaMockTestEndpoint(ctx, page, 'patient.test@altamedica.com', 'storage/patient.json');
    } else {
      test.skip(!PATIENT_EMAIL || !PATIENT_PASSWORD, 'Set E2E_PATIENT_EMAIL and E2E_PATIENT_PASSWORD');
      await loginAndSaveState(ctx, page, { email: PATIENT_EMAIL!, password: PATIENT_PASSWORD! }, 'storage/patient.json');
    }
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/localhost:3003\/dashboard/);
  });

  test(process.env.E2E_USE_MOCK_LOGIN === '1' || (DOCTOR_EMAIL && DOCTOR_PASSWORD) ? 'doctor → redirects to doctors dashboard' : 'skipped doctor login (missing creds)', async ({ page }) => {
    const ctx = await request.newContext();
    if (process.env.E2E_USE_MOCK_LOGIN === '1') {
      await loginViaMockTestEndpoint(ctx, page, 'doctor.test@altamedica.com', 'storage/doctor.json');
    } else {
      test.skip(!DOCTOR_EMAIL || !DOCTOR_PASSWORD, 'Set E2E_DOCTOR_EMAIL and E2E_DOCTOR_PASSWORD');
      await loginAndSaveState(ctx, page, { email: DOCTOR_EMAIL!, password: DOCTOR_PASSWORD! }, 'storage/doctor.json');
    }
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/localhost:3002\/dashboard/);
  });
});
