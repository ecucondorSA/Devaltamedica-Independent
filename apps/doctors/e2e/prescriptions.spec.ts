import { test, expect } from '@playwright/test'

test.describe('Prescription Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/prescriptions')
  })

  test('should display prescriptions list', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Prescriptions')
    
    // Check for search input
    await expect(page.locator('input[placeholder*="Search by patient name"]')).toBeVisible()
    
    // Check for stats cards
    await expect(page.locator('text=Total Prescriptions')).toBeVisible()
    await expect(page.locator('text=Active')).toBeVisible()
    await expect(page.locator('text=Expiring Soon')).toBeVisible()
  })

  test('should create a new prescription', async ({ page }) => {
    // Click new prescription button
    await page.click('button:has-text("New Prescription")')
    
    // Verify navigation
    await expect(page).toHaveURL('/prescriptions/new')
    await expect(page.locator('h1')).toContainText('New Prescription')
    
    // Search and select patient
    await page.fill('input[placeholder*="Search patient"]', 'John')
    await page.waitForSelector('button:has-text("John")')
    await page.click('button:has-text("John")').first()
    
    // Fill prescription details
    await page.fill('input[placeholder="Enter diagnosis..."]', 'Hypertension')
    await page.fill('textarea[placeholder*="general instructions"]', 'Take medication as prescribed. Monitor blood pressure daily.')
    
    // Set valid until date (30 days from now)
    const validUntil = new Date()
    validUntil.setDate(validUntil.getDate() + 30)
    await page.fill('input[type="date"]', validUntil.toISOString().split('T')[0])
    
    // Add medication
    await page.fill('input[placeholder="e.g., Amoxicillin"]', 'Lisinopril')
    await page.fill('input[placeholder="e.g., 500mg"]', '10mg')
    await page.fill('input[placeholder="e.g., Twice daily"]', 'Once daily')
    await page.fill('input[placeholder="e.g., 7 days"]', '30 days')
    await page.fill('input[placeholder="e.g., Take with food"]', 'Take in the morning')
    
    // Submit form
    await page.click('button:has-text("Create Prescription")')
    
    // Wait for navigation back to prescriptions
    await page.waitForURL('/prescriptions')
    
    // Verify prescription appears in list
    await expect(page.locator('text=Hypertension')).toBeVisible()
  })

  test('should validate prescription form', async ({ page }) => {
    await page.goto('/prescriptions/new')
    
    // Try to submit empty form
    await page.click('button:has-text("Create Prescription")')
    
    // Check for validation errors
    await expect(page.locator('text=Please select a patient')).toBeVisible()
    await expect(page.locator('text=Diagnosis must be at least 5 characters')).toBeVisible()
    await expect(page.locator('text=Instructions must be at least 10 characters')).toBeVisible()
  })

  test('should filter prescriptions by status', async ({ page }) => {
    // Select active filter
    await page.selectOption('select:has-text("All Status")', 'active')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Verify filtered results show active status
    const prescriptions = page.locator('[data-testid="prescription-item"]')
    const count = await prescriptions.count()
    
    if (count > 0) {
      const firstPrescription = prescriptions.first()
      await expect(firstPrescription.locator('text=Active')).toBeVisible()
    }
  })

  test('should search prescriptions', async ({ page }) => {
    // Search by patient name
    await page.fill('input[placeholder*="Search by patient name"]', 'John')
    
    // Wait for search to complete (debounced)
    await page.waitForTimeout(600)
    
    // Verify search results
    const prescriptions = page.locator('[data-testid="prescription-item"]')
    const count = await prescriptions.count()
    
    if (count > 0) {
      const firstPatientName = await prescriptions.first().locator('h3').textContent()
      expect(firstPatientName?.toLowerCase()).toContain('john')
    }
  })

  test('should view prescription details', async ({ page }) => {
    // Wait for prescriptions to load
    await page.waitForSelector('[data-testid="prescription-item"]', { timeout: 10000 })
    
    // Click on first prescription
    const firstPrescription = page.locator('[data-testid="prescription-item"]').first()
    await firstPrescription.click()
    
    // Verify navigation to details page
    await expect(page).toHaveURL(/\/prescriptions\/[\w-]+$/)
    await expect(page.locator('h1')).toContainText('Prescription Details')
    
    // Check for key information
    await expect(page.locator('text=Patient Information')).toBeVisible()
    await expect(page.locator('text=Prescription Information')).toBeVisible()
    await expect(page.locator('text=Medications')).toBeVisible()
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Print")')).toBeVisible()
    await expect(page.locator('button:has-text("Download")')).toBeVisible()
  })

  test('should handle prescription actions', async ({ page }) => {
    // Navigate to prescription details
    await page.waitForSelector('[data-testid="prescription-item"]')
    await page.locator('[data-testid="prescription-item"]').first().click()
    
    // Test print action
    const [printDialog] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("Print")')
    ])
    
    // Close print dialog if opened
    if (printDialog) {
      await printDialog.close()
    }
    
    // Test cancel prescription
    const activePrescription = page.locator('text=Active').first()
    if (await activePrescription.isVisible()) {
      await page.click('button:has-text("Cancel")')
      
      // Confirm cancellation
      await expect(page.locator('text=Cancel Prescription')).toBeVisible()
      await page.click('button:has-text("Cancel Prescription")')
      
      // Verify status changed
      await expect(page.locator('text=Cancelled')).toBeVisible()
    }
  })

  test('should show expiring prescriptions warning', async ({ page }) => {
    // Look for expiring soon badges
    const expiringSoon = page.locator('text=Expiring in').first()
    
    if (await expiringSoon.isVisible()) {
      // Verify warning styling
      const parent = expiringSoon.locator('..')
      await expect(parent).toHaveClass(/yellow/)
    }
  })
})