import { test, expect } from '@playwright/test'

test.describe('Appointment Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/appointments')
  })

  test('should display appointments calendar', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Appointments')
    
    // Check for calendar view
    await expect(page.locator('[data-testid="calendar-view"]')).toBeVisible()
    
    // Check for new appointment button
    await expect(page.locator('button:has-text("New Appointment")')).toBeVisible()
  })

  test('should create a new appointment', async ({ page }) => {
    // Click new appointment button
    await page.click('button:has-text("New Appointment")')
    
    // Verify navigation
    await expect(page).toHaveURL('/appointments/new')
    await expect(page.locator('h1')).toContainText('Schedule New Appointment')
    
    // Search and select patient
    await page.fill('input[placeholder*="Search patient"]', 'John')
    await page.waitForSelector('button:has-text("John")', { timeout: 5000 })
    await page.click('button:has-text("John")').first()
    
    // Fill appointment details
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    
    await page.fill('input[type="date"]', dateStr)
    await page.fill('input[type="time"]', '14:00')
    await page.selectOption('select:has-text("30 minutes")', '30')
    await page.selectOption('select:has-text("Consultation")', 'consultation')
    
    // Fill reason
    await page.fill('textarea[placeholder*="reason for this appointment"]', 'Regular checkup')
    
    // Submit form
    await page.click('button:has-text("Schedule Appointment")')
    
    // Wait for navigation back to appointments
    await page.waitForURL('/appointments')
    
    // Verify appointment appears in calendar
    await expect(page.locator('text=Regular checkup')).toBeVisible()
  })

  test('should validate appointment form', async ({ page }) => {
    await page.goto('/appointments/new')
    
    // Try to submit without selecting patient
    await page.click('button:has-text("Schedule Appointment")')
    
    // Check for validation errors
    await expect(page.locator('text=Please select a patient')).toBeVisible()
    
    // Select patient
    await page.fill('input[placeholder*="Search patient"]', 'John')
    await page.waitForSelector('button:has-text("John")')
    await page.click('button:has-text("John")').first()
    
    // Try to submit without date/time
    await page.click('button:has-text("Schedule Appointment")')
    
    // Check for date validation
    await expect(page.locator('text=must be today or in the future')).toBeVisible()
  })

  test('should switch calendar views', async ({ page }) => {
    // Check for view switcher
    const viewSwitcher = page.locator('[data-testid="view-switcher"]')
    await expect(viewSwitcher).toBeVisible()
    
    // Switch to week view
    await page.click('button:has-text("Week")')
    await expect(page.locator('[data-testid="week-view"]')).toBeVisible()
    
    // Switch to day view
    await page.click('button:has-text("Day")')
    await expect(page.locator('[data-testid="day-view"]')).toBeVisible()
    
    // Switch back to month view
    await page.click('button:has-text("Month")')
    await expect(page.locator('[data-testid="month-view"]')).toBeVisible()
  })

  test('should filter appointments by type', async ({ page }) => {
    // Select telemedicine filter
    await page.click('button:has-text("Filter")')
    await page.click('label:has-text("Telemedicine")')
    
    // Wait for filter to apply
    await page.waitForTimeout(500)
    
    // Verify filtered results
    const appointments = page.locator('[data-testid="appointment-card"]')
    const count = await appointments.count()
    
    if (count > 0) {
      // Verify all visible appointments are telemedicine type
      const firstAppointment = appointments.first()
      await expect(firstAppointment).toContainText('Telemedicine')
    }
  })

  test('should handle appointment actions', async ({ page }) => {
    // Wait for appointments to load
    await page.waitForSelector('[data-testid="appointment-card"]', { timeout: 10000 })
    
    // Click on first appointment
    const firstAppointment = page.locator('[data-testid="appointment-card"]').first()
    await firstAppointment.click()
    
    // Check for action buttons
    await expect(page.locator('button:has-text("Start Session")')).toBeVisible()
    await expect(page.locator('button:has-text("Reschedule")')).toBeVisible()
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible()
  })

  test('should display today appointments summary', async ({ page }) => {
    // Check for today's appointments section
    await expect(page.locator('text="Today\'s Appointments"')).toBeVisible()
    
    // Check for appointment count
    const todayCount = page.locator('[data-testid="today-count"]')
    await expect(todayCount).toBeVisible()
    
    // Check for next appointment info
    const nextAppointment = page.locator('[data-testid="next-appointment"]')
    if (await nextAppointment.isVisible()) {
      await expect(nextAppointment).toContainText('Next:')
    }
  })
})