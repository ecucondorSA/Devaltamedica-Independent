import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  private page: Page;
  
  // Common dashboard elements
  readonly welcomeMessage: Locator;
  readonly userRole: Locator;
  readonly userAvatar: Locator;
  readonly logoutButton: Locator;
  readonly notificationBell: Locator;
  readonly sidebarMenu: Locator;
  
  // Medical specific elements
  readonly appointmentsWidget: Locator;
  readonly patientsWidget: Locator;
  readonly metricsWidget: Locator;
  readonly quickActions: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize common locators
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.userRole = page.locator('[data-testid="user-role"]');
    this.userAvatar = page.locator('[data-testid="user-avatar"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.notificationBell = page.locator('[data-testid="notification-bell"]');
    this.sidebarMenu = page.locator('[data-testid="sidebar-menu"]');
    
    // Medical widgets
    this.appointmentsWidget = page.locator('[data-testid="appointments-widget"]');
    this.patientsWidget = page.locator('[data-testid="patients-widget"]');
    this.metricsWidget = page.locator('[data-testid="metrics-widget"]');
    this.quickActions = page.locator('[data-testid="quick-actions"]');
  }

  async waitForDashboardLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.welcomeMessage.waitFor({ state: 'visible' });
  }

  async clickLogout() {
    await this.userAvatar.click();
    await this.logoutButton.click();
    await this.page.waitForNavigation();
  }

  async navigateToSection(section: string) {
    await this.sidebarMenu.locator(`[data-section="${section}"]`).click();
  }

  async getNotificationCount(): Promise<number> {
    const badge = this.notificationBell.locator('.badge');
    const text = await badge.textContent();
    return parseInt(text || '0', 10);
  }

  async clickNotifications() {
    await this.notificationBell.click();
  }

  // Patient Dashboard specific methods
  async bookNewAppointment() {
    await this.quickActions.locator('[data-action="book-appointment"]').click();
  }

  async viewMedicalRecords() {
    await this.quickActions.locator('[data-action="medical-records"]').click();
  }

  // Doctor Dashboard specific methods
  async viewTodaysAppointments() {
    await this.appointmentsWidget.locator('[data-filter="today"]').click();
  }

  async startVideoCall(patientId: string) {
    await this.appointmentsWidget
      .locator(`[data-patient-id="${patientId}"]`)
      .locator('[data-action="start-call"]')
      .click();
  }

  // Company Dashboard specific methods
  async postNewJob() {
    await this.quickActions.locator('[data-action="post-job"]').click();
  }

  async viewDoctorApplications() {
    await this.quickActions.locator('[data-action="view-applications"]').click();
  }

  // Admin Dashboard specific methods
  async viewSystemHealth() {
    await this.navigateToSection('system-health');
  }

  async accessAuditLogs() {
    await this.navigateToSection('audit-logs');
  }

  async manageUsers() {
    await this.navigateToSection('user-management');
  }

  // Common utility methods
  async getMetricValue(metricName: string): Promise<string> {
    const metric = this.metricsWidget.locator(`[data-metric="${metricName}"]`);
    return await metric.locator('.value').textContent() || '';
  }

  async isWidgetVisible(widgetName: string): Promise<boolean> {
    const widget = this.page.locator(`[data-testid="${widgetName}-widget"]`);
    return await widget.isVisible();
  }

  async getUserName(): Promise<string> {
    return await this.welcomeMessage.textContent() || '';
  }

  async getUserRoleText(): Promise<string> {
    return await this.userRole.textContent() || '';
  }
}