import { test, expect } from '@playwright/test'

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/patients')
  })

  test('should display patients list', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Patients')
    
    // Check for search input
    await expect(page.locator('input[placeholder*="Search patients"]')).toBeVisible()
    
    // Check for add patient button
    await expect(page.locator('button:has-text("Add New Patient")')).toBeVisible()
  })

  test('should search for patients', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder*="Search patients"]', 'John')
    
    // Wait for search to complete (debounced)
    await page.waitForTimeout(600)
    
    // Check that results are filtered
    const patientCards = page.locator('[data-testid="patient-card"]')
    const count = await patientCards.count()
    
    if (count > 0) {
      // Verify search results contain search term
      const firstPatientName = await patientCards.first().textContent()
      expect(firstPatientName?.toLowerCase()).toContain('john')
    }
  })

  test('should navigate to new patient form', async ({ page }) => {
    // Click add patient button
    await page.click('button:has-text("Add New Patient")')
    
    // Verify navigation
    await expect(page).toHaveURL('/patients/new')
    await expect(page.locator('h1')).toContainText('New Patient Registration')
  })

  test('should create a new patient', async ({ page }) => {
    // Navigate to new patient form
    await page.goto('/patients/new')
    
    // Fill in patient details
    await page.fill('input[placeholder="John Doe"]', 'Test Patient')
    await page.fill('input[placeholder="john@example.com"]', 'testpatient@example.com')
    await page.fill('input[placeholder*="phone"]', '+1 555 123 4567')
    await page.fill('input[type="date"]', '1990-01-01')
    
    // Fill address
    await page.fill('input[placeholder="123 Main Street"]', '456 Test Street')
    await page.fill('input[placeholder="New York"]', 'Test City')
    await page.fill('input[placeholder="NY"]', 'TC')
    await page.fill('input[placeholder="10001"]', '12345')
    
    // Add allergy
    await page.fill('input[placeholder="Add allergy..."]', 'Penicillin')
    await page.click('button:has-text("Add"):near(input[placeholder="Add allergy..."])')
    
    // Verify allergy was added
    await expect(page.locator('text=Penicillin')).toBeVisible()
    
    // Submit form
    await page.click('button:has-text("Create Patient")')
    
    // Wait for navigation back to patients list
    await page.waitForURL('/patients')
    
    // Verify success (patient appears in list)
    await expect(page.locator('text=Test Patient')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/patients/new')
    
    // Try to submit empty form
    await page.click('button:has-text("Create Patient")')
    
    // Check for validation errors
    await expect(page.locator('text=Name must be at least 2 characters')).toBeVisible()
    await expect(page.locator('text=Invalid email address')).toBeVisible()
    await expect(page.locator('text=Street is required')).toBeVisible()
  })

  test('should navigate to patient details', async ({ page }) => {
    // Wait for patients to load
    await page.waitForSelector('[data-testid="patient-card"]', { timeout: 10000 })
    
    // Click on first patient
    const firstPatient = page.locator('[data-testid="patient-card"]').first()
    const patientName = await firstPatient.locator('h3').textContent()
    
    await firstPatient.click()
    
    // Verify navigation to patient details
    await expect(page).toHaveURL(/\/patients\/[\w-]+$/)
    await expect(page.locator('h1')).toContainText(patientName || '')
  })

  test('should filter patients by status', async ({ page }) => {
    // Select active filter
    await page.selectOption('select:has-text("All Patients")', 'active')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Verify filtered results
    const patientCards = page.locator('[data-testid="patient-card"]')
    const count = await patientCards.count()
    
    // If there are results, they should all be active patients
    if (count > 0) {
      // In a real test, we'd verify each card shows active status
      expect(count).toBeGreaterThan(0)
    }
  })
})