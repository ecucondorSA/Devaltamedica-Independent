import { Page, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string = '/') {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }

  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[name="${field}"]`, value);
    }
  }

  async clickButton(text: string) {
    await this.page.click(`button:has-text("${text}")`);
  }

  async selectOption(selectName: string, value: string) {
    await this.page.selectOption(`[name="${selectName}"]`, value);
  }

  async waitForModal() {
    await this.page.waitForSelector('[role="dialog"]', { state: 'visible' });
  }

  async closeModal() {
    await this.page.press('body', 'Escape');
  }

  async assertNotification(message: string) {
    await expect(this.page.locator('.toast, .notification')).toContainText(message);
  }

  async assertPageTitle(title: string) {
    await expect(this.page).toHaveTitle(new RegExp(title));
  }

  async assertHeading(heading: string) {
    await expect(this.page.locator('h1, h2, h3')).toContainText(heading);
  }
}

export class AuthPage extends BasePage {
  async login(email: string = 'admin@test.com', password: string = 'password123') {
    await this.goto('/login');
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.clickButton('Iniciar Sesión');
    await this.waitForPageLoad();
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.clickButton('Cerrar Sesión');
    await this.waitForPageLoad();
  }

  async assertLoggedIn() {
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  async assertLoggedOut() {
    await expect(this.page.locator('text=Iniciar Sesión')).toBeVisible();
  }
}

export class DashboardPage extends BasePage {
  async navigateToSection(section: string) {
    await this.page.click(`[href*="/${section}"]`);
    await this.waitForPageLoad();
  }

  async assertDashboardStats() {
    // Verificar que las cards de estadísticas estén presentes
    await expect(this.page.locator('[data-testid="stats-cards"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="stats-cards"] .card')).toHaveCount(4);
  }

  async assertSidebarNavigation() {
    const navItems = ['marketplace', 'dashboard', 'employees', 'doctors', 'appointments', 'patients'];
    for (const item of navItems) {
      await expect(this.page.locator(`[href*="/${item}"]`)).toBeVisible();
    }
  }
}

export class MarketplacePage extends BasePage {
  async goto(path: string = '/dashboard/marketplace') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async searchService(query: string) {
    await this.page.fill('[data-testid="search-bar"]', query);
    await this.page.press('[data-testid="search-bar"]', 'Enter');
    await this.waitForPageLoad();
  }

  async filterByCategory(category: string) {
    await this.page.click(`[data-testid="category-${category}"]`);
    await this.waitForPageLoad();
  }

  async selectService(serviceName: string) {
    await this.page.click(`[data-testid="service-card"]:has-text("${serviceName}")`);
    await this.waitForModal();
  }

  async addToCart() {
    await this.page.click('button:has-text("Agregar al Carrito")');
    await this.waitForPageLoad();
  }

  async viewCart() {
    await this.page.click('[data-testid="cart-button"]');
    await this.waitForModal();
  }

  async checkout() {
    await this.viewCart();
    await this.page.click('button:has-text("Proceder al Pago")');
    await this.waitForPageLoad();
  }

  async closeModal() {
    await this.page.press('body', 'Escape');
    await this.page.waitForTimeout(500);
  }

  async waitForModal() {
    await this.page.waitForSelector('[data-testid*="modal"]', { state: 'visible' });
  }
}

export class EmployeePage extends BasePage {
  async createEmployee(employeeData: {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: string;
  }) {
    await this.clickButton('Nuevo Empleado');
    await this.waitForModal();
    
    await this.fillForm(employeeData);
    await this.clickButton('Crear Empleado');
    await this.assertNotification('Empleado creado exitosamente');
  }

  async editEmployee(employeeName: string, newData: Record<string, string>) {
    await this.searchEmployee(employeeName);
    await this.page.click(`[data-testid="edit-employee-${employeeName}"]`);
    await this.waitForModal();
    
    await this.fillForm(newData);
    await this.clickButton('Actualizar Empleado');
    await this.assertNotification('Empleado actualizado exitosamente');
  }

  async searchEmployee(name: string) {
    await this.page.fill('[placeholder*="Buscar empleados"]', name);
    await this.waitForPageLoad();
  }

  async deleteEmployee(employeeName: string) {
    await this.searchEmployee(employeeName);
    await this.page.click(`[data-testid="delete-employee-${employeeName}"]`);
    await this.clickButton('Confirmar');
    await this.assertNotification('Empleado eliminado exitosamente');
  }

  async assertEmployeeInList(employeeName: string) {
    await expect(this.page.locator(`text="${employeeName}"`)).toBeVisible();
  }
}

export class DoctorPage extends BasePage {
  async createDoctor(doctorData: {
    firstName: string;
    lastName: string;
    email: string;
    specialty: string;
    licenseNumber: string;
  }) {
    await this.clickButton('Nuevo Doctor');
    await this.waitForModal();
    
    await this.fillForm(doctorData);
    await this.clickButton('Crear Doctor');
    await this.assertNotification('Doctor creado exitosamente');
  }

  async viewDoctorProfile(doctorName: string) {
    await this.page.click(`[data-testid="doctor-card-${doctorName}"]`);
    await this.waitForModal();
  }

  async editDoctorSchedule(doctorName: string) {
    await this.viewDoctorProfile(doctorName);
    await this.clickButton('Editar Horarios');
    
    // Configurar horarios
    await this.page.check('[data-testid="monday-available"]');
    await this.page.fill('[data-testid="monday-start"]', '09:00');
    await this.page.fill('[data-testid="monday-end"]', '17:00');
    
    await this.clickButton('Guardar Horarios');
    await this.assertNotification('Horarios actualizados exitosamente');
  }

  async filterBySpecialty(specialty: string) {
    await this.selectOption('specialty', specialty);
    await this.waitForPageLoad();
  }
}

export class AppointmentPage extends BasePage {
  async createAppointment(appointmentData: {
    patientName: string;
    doctorName: string;
    date: string;
    time: string;
    type: string;
  }) {
    await this.clickButton('Nueva Cita');
    await this.waitForModal();
    
    // Seleccionar paciente
    await this.page.click('[data-testid="patient-select"]');
    await this.page.click(`text="${appointmentData.patientName}"`);
    
    // Seleccionar doctor
    await this.page.click('[data-testid="doctor-select"]');
    await this.page.click(`text="${appointmentData.doctorName}"`);
    
    // Configurar fecha y hora
    await this.page.fill('[data-testid="appointment-date"]', appointmentData.date);
    await this.page.fill('[data-testid="appointment-time"]', appointmentData.time);
    
    // Seleccionar tipo
    await this.selectOption('type', appointmentData.type);
    
    await this.clickButton('Agendar Cita');
    await this.assertNotification('Cita agendada exitosamente');
  }

  async viewCalendar() {
    await this.page.click('[data-testid="calendar-tab"]');
    await this.waitForPageLoad();
  }

  async editAppointment(appointmentId: string, newData: Record<string, string>) {
    await this.page.click(`[data-testid="appointment-${appointmentId}"]`);
    await this.waitForModal();
    await this.clickButton('Editar');
    
    await this.fillForm(newData);
    await this.clickButton('Actualizar Cita');
    await this.assertNotification('Cita actualizada exitosamente');
  }

  async cancelAppointment(appointmentId: string) {
    await this.page.click(`[data-testid="appointment-${appointmentId}"]`);
    await this.waitForModal();
    await this.clickButton('Cancelar Cita');
    await this.clickButton('Confirmar Cancelación');
    await this.assertNotification('Cita cancelada exitosamente');
  }
}

export class PatientPage extends BasePage {
  async goto(path: string = '/dashboard/patients') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async createPatient(patientData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dni: string;
    dateOfBirth: string;
  }) {
    await this.clickButton('Nuevo Paciente');
    await this.waitForModal();
    
    // Llenar información personal
    await this.fillForm(patientData);
    
    // Llenar contacto de emergencia
    await this.page.click('[data-testid="emergency-tab"]');
    await this.page.fill('[name="emergencyContact.name"]', 'María González');
    await this.page.fill('[name="emergencyContact.relationship"]', 'Madre');
    await this.page.fill('[name="emergencyContact.phone"]', '+54 11 9876-5432');
    
    await this.clickButton('Crear Paciente');
    await this.assertNotification('Paciente creado exitosamente');
  }

  async editPatient(patientId: string, patientData: any) {
    await this.page.click(`[data-testid="edit-patient-${patientId}"]`);
    await this.fillPatientForm(patientData);
    await this.page.click('button:has-text("Actualizar")');
    await this.waitForPageLoad();
  }

  async deletePatient(patientId: string) {
    await this.page.click(`[data-testid="delete-patient-${patientId}"]`);
    await this.page.click('button:has-text("Confirmar")');
    await this.waitForPageLoad();
  }

  async searchPatient(query: string) {
    await this.page.fill('[data-testid="patient-search"]', query);
    await this.page.press('[data-testid="patient-search"]', 'Enter');
    await this.waitForPageLoad();
  }

  async filterPatients(filterType: string, value: string) {
    await this.page.selectOption(`[data-testid="filter-${filterType}"]`, value);
    await this.waitForPageLoad();
  }

  async viewPatientProfile(patientName: string) {
    await this.page.click(`[data-testid="patient-card-${patientName}"]`);
    await this.waitForModal();
  }

  async addMedicalHistory(patientName: string, historyData: {
    description: string;
    diagnosis: string;
    treatment: string;
  }) {
    await this.viewPatientProfile(patientName);
    await this.page.click('[data-testid="history-tab"]');
    await this.clickButton('Agregar Historial');
    
    await this.fillForm(historyData);
    await this.clickButton('Guardar Historial');
    await this.assertNotification('Historial médico agregado');
  }

  async addAllergy(patientName: string, allergyData: {
    allergen: string;
    severity: string;
    reaction: string;
  }) {
    await this.viewPatientProfile(patientName);
    await this.page.click('[data-testid="medical-tab"]');
    await this.clickButton('Agregar Alergia');
    
    await this.fillForm(allergyData);
    await this.clickButton('Guardar Alergia');
    await this.assertNotification('Alergia agregada exitosamente');
  }

  private async fillPatientForm(data: any) {
    if (data.firstName) await this.page.fill('[data-testid="firstName"]', data.firstName);
    if (data.lastName) await this.page.fill('[data-testid="lastName"]', data.lastName);
    if (data.email) await this.page.fill('[data-testid="email"]', data.email);
    if (data.phone) await this.page.fill('[data-testid="phone"]', data.phone);
    if (data.dateOfBirth) await this.page.fill('[data-testid="dateOfBirth"]', data.dateOfBirth);
    if (data.gender) await this.page.selectOption('[data-testid="gender"]', data.gender);
    if (data.bloodType) await this.page.selectOption('[data-testid="bloodType"]', data.bloodType);
  }
}

// Utilidades para datos de prueba
export const testData = {
  employee: {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@test.com',
    position: 'Desarrollador',
    department: 'IT'
  },
  doctor: {
    firstName: 'Dr. Ana',
    lastName: 'García',
    email: 'ana.garcia@test.com',
    specialty: 'Cardiología',
    licenseNumber: 'MED123456'
  },
  patient: {
    firstName: 'María',
    lastName: 'López',
    email: 'maria.lopez@test.com',
    phone: '+54 11 1234-5678',
    dni: '12345678',
    dateOfBirth: '1990-05-15'
  },
  appointment: {
    patientName: 'María López',
    doctorName: 'Dr. Ana García',
    date: '2024-02-15',
    time: '10:00',
    type: 'Consulta General'
  }
};

// Helpers para validaciones comunes
export const assertions = {
  async assertTableHasRows(page: Page, minRows: number = 1) {
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(minRows);
  },

  async assertFormValidation(page: Page, fieldName: string, errorMessage: string) {
    await page.fill(`[name="${fieldName}"]`, '');
    await page.click('button[type="submit"]');
    await expect(page.locator(`text="${errorMessage}"`)).toBeVisible();
  },

  async assertLoadingState(page: Page) {
    await expect(page.locator('.loading, .spinner, [data-testid="loading"]')).toBeVisible();
  },

  async assertEmptyState(page: Page, message: string) {
    await expect(page.locator(`text="${message}"`)).toBeVisible();
  }
};
