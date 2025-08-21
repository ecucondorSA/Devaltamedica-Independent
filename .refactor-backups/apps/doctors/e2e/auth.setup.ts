import { test as setup, expect } from '@playwright/test'

const authFile = 'playwright/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Perform authentication steps
  await page.goto('/login')
  
  // Fill in credentials
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'doctor@altamedica.com')
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'test123456')
  
  // Click login button
  await page.click('button[type="submit"]')
  
  // Wait for authentication to complete
  await page.waitForURL('/dashboard')
  
  // Verify we're logged in
  await expect(page.locator('text=Dashboard')).toBeVisible()
  
  // Save storage state
  await page.context().storageState({ path: authFile })
})