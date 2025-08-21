import { Page, Locator } from '@playwright/test';

export class AppointmentPage {
  private page: Page;
  
  // Specialty selection
  readonly specialtySelector: Locator;
  readonly specialtyConfirmation: Locator;
  
  // Doctor search
  readonly doctorSearchInput: Locator;
  readonly doctorSearchResults: Locator;
  readonly selectedDoctor: Locator;
  readonly locationFilter: Locator;
  
  // Calendar and time selection
  readonly availabilityCalendar: Locator;
  readonly unavailableDates: Locator;
  readonly timeSlots: Locator;
  readonly selectedDate: Locator;
  readonly selectedTime: Locator;
  
  // Appointment details
  readonly visitReasonInput: Locator;
  readonly symptomsSection: Locator;
  readonly documentUpload: Locator;
  
  // Emergency
  readonly emergencyButton: Locator;
  readonly emergencyTypeSelector: Locator;
  readonly emergencyTimeSlots: Locator;
  
  // Summary and confirmation
  readonly summaryDoctor: Locator;
  readonly summaryDate: Locator;
  readonly summaryTime: Locator;
  readonly summaryReason: Locator;
  readonly confirmButton: Locator;
  readonly confirmationMessage: Locator;
  readonly appointmentId: Locator;
  
  // Common elements
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly errorMessage: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize specialty selection locators
    this.specialtySelector = page.locator('[data-testid="specialty-selector"]');
    this.specialtyConfirmation = page.locator('[data-testid="selected-specialty"]');
    
    // Doctor search locators
    this.doctorSearchInput = page.locator('[data-testid="doctor-search"]');
    this.doctorSearchResults = page.locator('[data-testid="doctor-card"]');
    this.selectedDoctor = page.locator('[data-testid="selected-doctor"]');
    this.locationFilter = page.locator('[data-testid="location-filter"]');
    
    // Calendar locators
    this.availabilityCalendar = page.locator('[data-testid="availability-calendar"]');
    this.unavailableDates = page.locator('[data-testid="date-unavailable"]');
    this.timeSlots = page.locator('[data-testid="time-slot"]');
    this.selectedDate = page.locator('[data-testid="selected-date"]');
    this.selectedTime = page.locator('[data-testid="selected-time"]');
    
    // Appointment details locators
    this.visitReasonInput = page.locator('[data-testid="visit-reason"]');
    this.symptomsSection = page.locator('[data-testid="symptoms-section"]');
    this.documentUpload = page.locator('[data-testid="document-upload"]');
    
    // Emergency locators
    this.emergencyButton = page.locator('[data-testid="emergency-appointment"]');
    this.emergencyTypeSelector = page.locator('[data-testid="emergency-type"]');
    this.emergencyTimeSlots = page.locator('[data-testid="emergency-slot"]');
    
    // Summary locators
    this.summaryDoctor = page.locator('[data-testid="summary-doctor"]');
    this.summaryDate = page.locator('[data-testid="summary-date"]');
    this.summaryTime = page.locator('[data-testid="summary-time"]');
    this.summaryReason = page.locator('[data-testid="summary-reason"]');
    this.confirmButton = page.locator('[data-testid="confirm-booking"]');
    this.confirmationMessage = page.locator('[data-testid="confirmation-message"]');
    this.appointmentId = page.locator('[data-testid="appointment-id"]');
    
    // Common elements
    this.nextButton = page.locator('[data-testid="next-button"]');
    this.backButton = page.locator('[data-testid="back-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.loadingIndicator = page.locator('[data-testid="loading"]');
  }

  // Specialty selection methods
  async selectSpecialty(specialty: string) {
    await this.specialtySelector.click();
    await this.page.locator(`[data-specialty="${specialty}"]`).click();
    await this.waitForLoading();
  }

  // Doctor search methods
  async searchDoctor(searchTerm: string) {
    await this.doctorSearchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Debounce
    await this.waitForLoading();
  }

  async selectDoctor(doctorName: string) {
    const doctorCard = this.doctorSearchResults.filter({ hasText: doctorName });
    await doctorCard.click();
    await this.waitForLoading();
  }

  async filterByLocation(location: string) {
    await this.locationFilter.click();
    await this.page.locator(`[data-location="${location}"]`).click();
    await this.waitForLoading();
  }

  // Calendar methods
  async selectDate(date: Date) {
    const dateString = date.toISOString().split('T')[0];
    await this.availabilityCalendar.locator(`[data-date="${dateString}"]`).click();
    await this.waitForLoading();
  }

  async selectTimeSlot(time: string) {
    await this.timeSlots.filter({ hasText: time }).click();
  }

  // Appointment details methods
  async fillVisitReason(reason: string) {
    await this.visitReasonInput.fill(reason);
  }

  async addSymptom(symptom: string) {
    const addButton = this.symptomsSection.locator('[data-testid="add-symptom"]');
    await addButton.click();
    
    const symptomInput = this.symptomsSection.locator('input').last();
    await symptomInput.fill(symptom);
  }

  async uploadDocument(filePath: string) {
    await this.documentUpload.setInputFiles(filePath);
    await this.waitForLoading();
  }

  // Emergency methods
  async clickEmergencyAppointment() {
    await this.emergencyButton.click();
    await this.waitForLoading();
  }

  async selectEmergencyType(type: string) {
    await this.emergencyTypeSelector.selectOption(type);
    await this.waitForLoading();
  }

  async confirmEmergencyBooking() {
    await this.page.locator('[data-testid="confirm-emergency"]').click();
    await this.waitForLoading();
  }

  // Navigation methods
  async clickNext() {
    await this.nextButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }

  async clickReview() {
    await this.page.locator('[data-testid="review-button"]').click();
    await this.waitForLoading();
  }

  // Confirmation methods
  async confirmBooking() {
    await this.confirmButton.click();
    await this.waitForLoading();
  }

  async confirmReschedule() {
    await this.page.locator('[data-testid="confirm-reschedule"]').click();
    await this.waitForLoading();
  }

  // Utility methods
  async waitForLoading() {
    try {
      await this.loadingIndicator.waitFor({ state: 'visible', timeout: 1000 });
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Loading indicator might not appear for fast operations
    }
  }

  async getAppointmentId(): Promise<string> {
    return await this.appointmentId.textContent() || '';
  }

  async isStepActive(stepName: string): Promise<boolean> {
    const step = this.page.locator(`[data-step="${stepName}"]`);
    const classes = await step.getAttribute('class') || '';
    return classes.includes('active');
  }

  async getAvailableTimeSlots(): Promise<string[]> {
    const slots = await this.timeSlots.allTextContents();
    return slots.filter(slot => slot.trim() !== '');
  }

  async getDoctorRating(doctorName: string): Promise<number> {
    const doctorCard = this.doctorSearchResults.filter({ hasText: doctorName });
    const rating = await doctorCard.locator('[data-testid="doctor-rating"]').textContent();
    return parseFloat(rating || '0');
  }
}