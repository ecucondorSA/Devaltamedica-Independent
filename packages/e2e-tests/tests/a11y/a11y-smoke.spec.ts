import { checkA11y, injectAxe } from '@axe-core/playwright';
import { test } from '@playwright/test';

const targets = [
  { name: 'web-app', url: process.env.WEB_BASE_URL || 'http://localhost:3000' },
  { name: 'patients', url: process.env.PATIENTS_BASE_URL || 'http://localhost:3003' },
  { name: 'doctors', url: process.env.DOCTORS_BASE_URL || 'http://localhost:3002' },
  { name: 'companies', url: process.env.COMPANIES_BASE_URL || 'http://localhost:3004' },
];

// Marca: @a11y

test.describe('A11y smoke @a11y', () => {
  for (const t of targets) {
    test(`sin violaciones críticas en ${t.name}`, async ({ page }) => {
      await page.goto(t.url);
      await injectAxe(page);
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true },
        includedImpacts: ['serious', 'critical']
      });
    });
  }
});
