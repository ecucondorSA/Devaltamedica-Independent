import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { DashboardPage } from '../page-objects/dashboard.page';
import { AppointmentPage } from '../page-objects/appointment.page';

test.describe('📅 Appointment Booking Flow', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;
  let appointmentPage: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    appointmentPage = new AppointmentPage(page);

    // Login as patient
    await loginPage.goto();
    await loginPage.fillEmail('patient.test@altamedica.com');
    await loginPage.fillPassword('SecurePass123!');
    await loginPage.clickLogin();
    await dashboardPage.waitForDashboardLoad();
  });

  test('Complete appointment booking flow', async ({ page }) => {
    // Step 1: Navigate to appointment booking
    await dashboardPage.bookNewAppointment();
    await expect(page).toHaveURL(/\/appointments\/new/);

    // Step 2: Select specialty
    await appointmentPage.selectSpecialty('Cardiología');
    await expect(appointmentPage.specialtyConfirmation).toContainText('Cardiología');

    // Step 3: Search and select doctor
    await appointmentPage.searchDoctor('García');
    await appointmentPage.selectDoctor('Dr. María García');
    await expect(appointmentPage.selectedDoctor).toContainText('Dr. María García');

    // Step 4: Select appointment date and time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await appointmentPage.selectDate(tomorrow);
    await appointmentPage.selectTimeSlot('14:00');

    // Step 5: Fill reason for visit
    await appointmentPage.fillVisitReason('Chequeo cardiológico de rutina');

    // Step 6: Add symptoms (optional)
    await appointmentPage.addSymptom('Fatiga ocasional');
    await appointmentPage.addSymptom('Palpitaciones leves');

    // Step 7: Upload medical documents (optional)
    const filePath = './test-fixtures/medical-report.pdf';
    await appointmentPage.uploadDocument(filePath);

    // Step 8: Review and confirm
    await appointmentPage.clickReview();
    
    // Verify summary
    await expect(appointmentPage.summaryDoctor).toContainText('Dr. María García');
    await expect(appointmentPage.summaryDate).toContainText(tomorrow.toLocaleDateString());
    await expect(appointmentPage.summaryTime).toContainText('14:00');
    await expect(appointmentPage.summaryReason).toContainText('Chequeo cardiológico');

    // Step 9: Confirm booking
    await appointmentPage.confirmBooking();

    // Step 10: Verify confirmation
    await expect(appointmentPage.confirmationMessage).toBeVisible();
    await expect(appointmentPage.confirmationMessage).toContainText('Cita confirmada');
    await expect(appointmentPage.appointmentId).toBeVisible();
    
    // Verify email notification badge
    await expect(dashboardPage.notificationBell).toContainText('1');
  });

  test('Search doctors by specialty and location', async ({ page }) => {
    await dashboardPage.bookNewAppointment();

    // Select specialty
    await appointmentPage.selectSpecialty('Dermatología');

    // Filter by location
    await appointmentPage.filterByLocation('Madrid');

    // Verify filtered results
    const doctorCards = appointmentPage.doctorSearchResults;
    await expect(doctorCards).toHaveCount(3); // Assuming 3 dermatologists in Madrid

    // Verify each card shows correct specialty and location
    for (let i = 0; i < 3; i++) {
      const card = doctorCards.nth(i);
      await expect(card.locator('.specialty')).toContainText('Dermatología');
      await expect(card.locator('.location')).toContainText('Madrid');
    }
  });

  test('View doctor availability calendar', async ({ page }) => {
    await dashboardPage.bookNewAppointment();
    await appointmentPage.selectSpecialty('Medicina General');
    await appointmentPage.selectDoctor('Dr. Juan Pérez');

    // Check calendar displays correctly
    await expect(appointmentPage.availabilityCalendar).toBeVisible();

    // Verify unavailable dates are disabled
    const unavailableDates = appointmentPage.unavailableDates;
    await expect(unavailableDates).toHaveCount(5); // Weekends

    // Verify available time slots
    await appointmentPage.selectDate(new Date());
    const timeSlots = appointmentPage.timeSlots;
    await expect(timeSlots).toHaveCount(8); // 9:00 to 17:00
  });

  test('Cancel appointment within allowed timeframe', async ({ page }) => {
    // Navigate to my appointments
    await dashboardPage.navigateToSection('appointments');
    
    // Find upcoming appointment
    const upcomingAppointment = page.locator('[data-status="upcoming"]').first();
    await upcomingAppointment.locator('[data-action="view-details"]').click();

    // Check if cancellation is allowed (24h before)
    const cancelButton = page.locator('[data-testid="cancel-appointment"]');
    await expect(cancelButton).toBeEnabled();

    // Cancel appointment
    await cancelButton.click();
    await page.locator('[data-testid="confirm-cancellation"]').click();

    // Verify cancellation
    await expect(page.locator('[data-testid="cancellation-success"]')).toBeVisible();
    await expect(upcomingAppointment).toHaveAttribute('data-status', 'cancelled');
  });

  test('Reschedule appointment', async ({ page }) => {
    // Navigate to my appointments
    await dashboardPage.navigateToSection('appointments');
    
    // Find appointment to reschedule
    const appointment = page.locator('[data-status="upcoming"]').first();
    await appointment.locator('[data-action="reschedule"]').click();

    // Select new date and time
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 3);
    await appointmentPage.selectDate(newDate);
    await appointmentPage.selectTimeSlot('10:00');

    // Confirm reschedule
    await appointmentPage.confirmReschedule();

    // Verify success
    await expect(page.locator('[data-testid="reschedule-success"]')).toBeVisible();
    await expect(appointment.locator('.appointment-date')).toContainText(newDate.toLocaleDateString());
  });

  test('Validate required fields in appointment booking', async ({ page }) => {
    await dashboardPage.bookNewAppointment();

    // Try to proceed without selecting specialty
    await appointmentPage.clickNext();
    await expect(appointmentPage.errorMessage).toContainText('Seleccione una especialidad');

    // Select specialty but not doctor
    await appointmentPage.selectSpecialty('Pediatría');
    await appointmentPage.clickNext();
    await expect(appointmentPage.errorMessage).toContainText('Seleccione un doctor');

    // Select doctor but not date/time
    await appointmentPage.selectDoctor('Dr. Ana López');
    await appointmentPage.clickNext();
    await expect(appointmentPage.errorMessage).toContainText('Seleccione fecha y hora');

    // Select date/time but no reason
    await appointmentPage.selectDate(new Date());
    await appointmentPage.selectTimeSlot('11:00');
    await appointmentPage.clickNext();
    await expect(appointmentPage.errorMessage).toContainText('Ingrese el motivo de consulta');
  });

  test('Emergency appointment booking', async ({ page }) => {
    await dashboardPage.bookNewAppointment();

    // Click emergency appointment
    await appointmentPage.clickEmergencyAppointment();

    // Verify emergency flow
    await expect(page.locator('[data-testid="emergency-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="emergency-banner"]')).toContainText('Atención de emergencia');

    // Select emergency type
    await appointmentPage.selectEmergencyType('Dolor agudo');

    // Verify nearest available slots are shown
    const emergencySlots = appointmentPage.emergencyTimeSlots;
    await expect(emergencySlots).toHaveCount(3); // Next 3 available slots

    // Book emergency appointment
    await emergencySlots.first().click();
    await appointmentPage.confirmEmergencyBooking();

    // Verify high priority booking
    await expect(appointmentPage.confirmationMessage).toContainText('Cita de emergencia confirmada');
    await expect(page.locator('[data-priority="high"]')).toBeVisible();
  });
});