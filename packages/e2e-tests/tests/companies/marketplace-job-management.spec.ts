import { test, expect } from '@playwright/test';

const COMPANIES_URL = process.env.E2E_COMPANIES_URL || 'http://localhost:3004';

test.describe('Companies Marketplace - Job Management @companies @marketplace', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to companies marketplace
    await page.goto(`${COMPANIES_URL}/marketplace`);
    
    // Mock authentication for E2E tests
    if (process.env.E2E_USE_MOCK_LOGIN) {
      await page.evaluate(() => {
        localStorage.setItem('company_auth_token', 'mock-company-token');
        localStorage.setItem('user_role', 'company');
      });
    }
    
    // Wait for marketplace to load
    await expect(page.locator('[data-testid="marketplace-header"]')).toBeVisible();
  });

  test('should create a new job offer via modal', async ({ page }) => {
    // Navigate to jobs tab
    await page.locator('[data-testid="tab-jobs"]').click();
    
    // Open job creation modal by clicking the create button
    await page.locator('button:has-text("➕ Crear Nueva Oferta")').click();
    
    // Verify modal is opened
    await expect(page.locator('[data-testid="job-form-modal"]')).toBeVisible();
    
    // Step 1: Basic Information
    await page.fill('[data-testid="job-title"]', 'Cardiólogo Senior Test');
    await page.selectOption('[data-testid="job-specialty"]', 'Cardiología');
    await page.fill('[data-testid="job-location"]', 'Buenos Aires, Argentina');
    await page.selectOption('[data-testid="job-type"]', 'job');
    await page.check('[data-testid="job-urgent"]');
    await page.fill('[data-testid="job-description"]', 'Buscamos cardiólogo senior para unirse a nuestro equipo médico de excelencia.');
    
    // Go to next step
    await page.click('button:has-text("Siguiente →")');
    
    // Step 2: Job Details (skip for now as we don't have all fields)
    await page.click('button:has-text("Siguiente →")');
    
    // Step 3: Salary
    await page.fill('[data-testid="job-salary-min"]', '8000');
    await page.fill('[data-testid="job-salary-max"]', '12000');
    await page.selectOption('[data-testid="job-salary-currency"]', 'USD');
    
    // Go to final step
    await page.click('button:has-text("Siguiente →")');
    
    // Step 4: Submit form (skip contact info for now and just submit)
    await page.locator('[data-testid="submit-job-form"]').click();
    
    // Verify modal closes
    await expect(page.locator('[data-testid="job-form-modal"]')).not.toBeVisible();
  });

  test('should edit an existing job offer', async ({ page }) => {
    // Navigate to jobs tab
    await page.locator('[data-testid="tab-jobs"]').click();
    
    // Find first job card and click edit
    const firstJobCard = page.locator('[data-testid^="job-card-"]').first();
    await expect(firstJobCard).toBeVisible();
    
    // Click edit button on first job
    await firstJobCard.locator('[data-testid="edit-job"]').click();
    
    // Wait for navigation to edit page or modal
    await page.waitForURL(/.*\/edit.*|.*\/jobs\/.*/, { timeout: 5000 });
    
    // If modal opens instead of navigation, verify modal
    const editModal = page.locator('[data-testid="job-form-modal"]');
    if (await editModal.isVisible()) {
      // Update job title
      await page.fill('[data-testid="job-title"]', 'Cardiólogo Senior - Actualizado');
      
      // Update salary
      await page.fill('[data-testid="job-salary-max"]', '15000');
      
      // Submit changes
      await page.locator('[data-testid="submit-job-form"]').click();
      
      // Verify modal closes
      await expect(editModal).not.toBeVisible();
      
      // Verify updated job appears
      await expect(page.locator('text=Cardiólogo Senior - Actualizado')).toBeVisible();
    }
  });

  test('should close job form modal with close button', async ({ page }) => {
    // Navigate to jobs tab
    await page.locator('[data-testid="tab-jobs"]').click();
    
    // Open job creation modal by clicking the create button
    await page.locator('button:has-text("➕ Crear Nueva Oferta")').click();
    
    // Verify modal is opened
    await expect(page.locator('[data-testid="job-form-modal"]')).toBeVisible();
    
    // Close modal with X button
    await page.locator('[data-testid="close-job-form-modal"]').click();
    
    // Verify modal is closed
    await expect(page.locator('[data-testid="job-form-modal"]')).not.toBeVisible();
  });

  test('should filter jobs by status', async ({ page }) => {
    // Navigate to jobs tab
    await page.locator('[data-testid="tab-jobs"]').click();
    
    // Wait for jobs to load
    await page.waitForSelector('[data-testid^="job-card-"]', { timeout: 10000 });
    
    // Get initial job count
    const initialJobs = await page.locator('[data-testid^="job-card-"]').count();
    expect(initialJobs).toBeGreaterThan(0);
    
    // Filter by active jobs
    await page.selectOption('[data-testid="job-status-filter"]', 'active');
    
    // Wait for filter to apply
    await page.waitForTimeout(1000);
    
    // Verify only active jobs are shown
    const activeJobs = page.locator('[data-testid^="job-card-"]');
    const count = await activeJobs.count();
    
    // Check that all visible jobs have "Activa" status
    for (let i = 0; i < count; i++) {
      const jobCard = activeJobs.nth(i);
      await expect(jobCard.locator('text=Activa')).toBeVisible();
    }
  });

  test('should search jobs by title and specialty', async ({ page }) => {
    // Navigate to jobs tab  
    await page.locator('[data-testid="tab-jobs"]').click();
    
    // Search for cardiology jobs
    await page.fill('[data-testid="job-search"]', 'cardiólogo');
    
    // Wait for search to apply
    await page.waitForTimeout(1000);
    
    // Verify search results contain the term
    const searchResults = page.locator('[data-testid^="job-card-"]');
    const count = await searchResults.count();
    
    if (count > 0) {
      // Check that results contain the search term
      await expect(page.locator('text=Cardiólog')).toBeVisible();
    }
    
    // Clear search
    await page.fill('[data-testid="job-search"]', '');
    await page.waitForTimeout(1000);
  });

  test('should toggle view mode between grid and list', async ({ page }) => {
    // Navigate to jobs tab
    await page.locator('[data-testid="tab-jobs"]').click();
    
    // Wait for jobs to load
    await page.waitForSelector('[data-testid^="job-card-"]', { timeout: 10000 });
    
    // Switch to list view
    await page.locator('[data-testid="view-mode-list"]').click();
    
    // Verify list view is active
    await expect(page.locator('[data-testid="view-mode-list"]')).toHaveClass(/bg-blue-50/);
    
    // Switch back to grid view
    await page.locator('[data-testid="view-mode-grid"]').click();
    
    // Verify grid view is active
    await expect(page.locator('[data-testid="view-mode-grid"]')).toHaveClass(/bg-blue-50/);
  });
});