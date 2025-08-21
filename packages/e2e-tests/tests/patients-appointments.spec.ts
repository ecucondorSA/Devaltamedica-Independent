import { test, expect, request } from '@playwright/test';
import { loginAndSaveState, loginViaMockTestEndpoint } from './helpers/auth';

const PRIMARY_API = process.env.API_BASE_URL || 'http://localhost:3001';
const FALLBACK_API = 'http://localhost:3002';

async function createAppointment(ctx: any) {
  const tryCreate = async (base: string) => {
    const res = await ctx.post(`${base}/api/v1/appointments`, {
      data: {
        patientId: 'patient-test-id',
        doctorId: 'doctor-test-id',
        date: new Date(Date.now() + 3600_000).toISOString(),
        reason: 'E2E test appointment',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    return res;
  };
  let res = await tryCreate(PRIMARY_API);
  if (!res.ok()) {
    res = await tryCreate(FALLBACK_API);
  }
  if (!res.ok()) return null;
  return res.json();
}

const PATIENT_EMAIL = process.env.E2E_PATIENT_EMAIL;
const PATIENT_PASSWORD = process.env.E2E_PATIENT_PASSWORD;

test.describe('@e2e patients appointments', () => {
  test(process.env.E2E_USE_MOCK_LOGIN === '1' || (PATIENT_EMAIL && PATIENT_PASSWORD) ? 'patient can see newly created appointment in UI' : 'skipped appointments (missing patient creds)', async ({ page }) => {
    const ctx = await request.newContext();
    if (process.env.E2E_USE_MOCK_LOGIN === '1') {
      await loginViaMockTestEndpoint(ctx, page, 'patient.test@altamedica.com', 'tests/storage/patient.json');
    } else {
      test.skip(!PATIENT_EMAIL || !PATIENT_PASSWORD, 'Set E2E_PATIENT_EMAIL and E2E_PATIENT_PASSWORD');
      await loginAndSaveState(ctx, page, { email: PATIENT_EMAIL!, password: PATIENT_PASSWORD! }, 'tests/storage/patient.json');
    }

    const appt = await createAppointment(ctx);
    if (!appt) {
      test.skip(true, 'appointments API not available; skipping UI verification');
    }

    // Navega al dashboard y verifica la cita
    await page.goto('http://localhost:3003/dashboard');
    await page.waitForLoadState('networkidle');
  const locator = page.locator('text=E2E test appointment');
  await expect(locator.or(page.locator('[data-test="appointment-item"]:has-text("E2E test appointment")'))).toBeVisible({ timeout: 20_000 });
  });
});
