import { expect, test } from '@playwright/test';
import { AppointmentPage, assertions, AuthPage, testData } from '../helpers/.claude';

test.describe('Sistema de Gestión de Citas', () => {
  let authPage: AuthPage;
  let appointmentPage: AppointmentPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    appointmentPage = new AppointmentPage(page);
    
    await authPage.login();
    await appointmentPage.goto('/dashboard/appointments');
  });

  test('debería mostrar la interfaz de citas correctamente', async ({ page }) => {
    await appointmentPage.assertPageTitle('Citas');
    await appointmentPage.assertHeading('Gestión de Citas Médicas');
    
    // Verificar elementos principales
    await expect(page.locator('[data-testid="appointments-calendar"]')).toBeVisible();
    await expect(page.locator('button:has-text("Nueva Cita")')).toBeVisible();
    await expect(page.locator('[data-testid="calendar-controls"]')).toBeVisible();
    
    // Verificar pestañas de vista
    await expect(page.locator('[data-testid="calendar-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="list-tab"]')).toBeVisible();
    await expect(page.locator('[data-testid="analytics-tab"]')).toBeVisible();
    
    // Verificar estadísticas de citas
    await expect(page.locator('[data-testid="appointments-today"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointments-week"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-appointments"]')).toBeVisible();
  });

  test('debería crear una nueva cita exitosamente', async ({ page }) => {
    const appointmentData = {
      ...testData.appointment,
      date: '2024-03-15',
      time: '14:30'
    };

    await appointmentPage.createAppointment(appointmentData);
    
    // Verificar que la cita aparece en el calendario
    await appointmentPage.viewCalendar();
    await expect(page.locator(`[data-testid="appointment-${appointmentData.date}"]`)).toBeVisible();
    
    // Verificar detalles de la cita
    await page.click(`[data-testid="appointment-${appointmentData.date}"]`);
    await appointmentPage.waitForModal();
    
    await expect(page.locator(`text="${appointmentData.patientName}"`)).toBeVisible();
    await expect(page.locator(`text="${appointmentData.doctorName}"`)).toBeVisible();
    await expect(page.locator(`text="${appointmentData.type}"`)).toBeVisible();
  });

  test('debería validar campos requeridos al crear cita', async ({ page }) => {
    await page.click('button:has-text("Nueva Cita")');
    await appointmentPage.waitForModal();
    
    // Intentar crear cita sin datos
    await page.click('button:has-text("Agendar Cita")');
    
    // Verificar validaciones
    await assertions.assertFormValidation(page, 'patient', 'Selecciona un paciente');
    await assertions.assertFormValidation(page, 'doctor', 'Selecciona un doctor');
    await assertions.assertFormValidation(page, 'date', 'Selecciona una fecha');
    await assertions.assertFormValidation(page, 'time', 'Selecciona una hora');
  });

  test('debería mostrar horarios disponibles del doctor', async ({ page }) => {
    await page.click('button:has-text("Nueva Cita")');
    await appointmentPage.waitForModal();
    
    // Seleccionar doctor
    await page.click('[data-testid="doctor-select"]');
    await page.click('text="Dr. Ana García"');
    
    // Seleccionar fecha
    await page.fill('[data-testid="appointment-date"]', '2024-03-15');
    
    // Verificar que se muestren horarios disponibles
    await expect(page.locator('[data-testid="available-slots"]')).toBeVisible();
    
    const timeSlots = page.locator('[data-testid="time-slot"]');
    await expect(timeSlots).toHaveCountGreaterThan(0);
    
    // Verificar que los slots muestren información correcta
    const firstSlot = timeSlots.first();
    await expect(firstSlot.locator('.slot-time')).toBeVisible();
    await expect(firstSlot.locator('.slot-status')).toBeVisible();
  });

  test('debería prevenir conflictos de horarios', async ({ page }) => {
    const appointmentData = {
      ...testData.appointment,
      date: '2024-03-15',
      time: '10:00'
    };

    // Crear primera cita
    await appointmentPage.createAppointment(appointmentData);
    
    // Intentar crear segunda cita en el mismo horario
    await appointmentPage.createAppointment(appointmentData);
    
    // Verificar mensaje de conflicto
    await expect(page.locator('text="Horario no disponible"')).toBeVisible();
    await expect(page.locator('text="El doctor ya tiene una cita en este horario"')).toBeVisible();
  });

  test('debería editar una cita existente', async ({ page }) => {
    // Crear cita inicial
    const originalAppointment = {
      ...testData.appointment,
      date: '2024-03-15',
      time: '10:00'
    };
    
    await appointmentPage.createAppointment(originalAppointment);
    
    // Editar la cita
    const appointmentId = 'test-appointment-1';
    const updatedData = {
      time: '11:00',
      type: 'Consulta de Seguimiento'
    };
    
    await appointmentPage.editAppointment(appointmentId, updatedData);
    
    // Verificar cambios
    await page.click(`[data-testid="appointment-${appointmentId}"]`);
    await appointmentPage.waitForModal();
    
    await expect(page.locator('text="11:00"')).toBeVisible();
    await expect(page.locator('text="Consulta de Seguimiento"')).toBeVisible();
  });

  test('debería cancelar una cita con motivo', async ({ page }) => {
    // Crear cita para cancelar
    const appointmentData = {
      ...testData.appointment,
      date: '2024-03-15',
      time: '10:00'
    };
    
    await appointmentPage.createAppointment(appointmentData);
    
    // Cancelar cita
    const appointmentId = 'test-appointment-1';
    await appointmentPage.cancelAppointment(appointmentId);
    
    // Verificar que se solicite motivo de cancelación
    await expect(page.locator('[data-testid="cancellation-reason"]')).toBeVisible();
    await page.fill('[data-testid="cancellation-reason"]', 'Paciente enfermo');
    await page.click('button:has-text("Confirmar Cancelación")');
    
    // Verificar estado de la cita
    await expect(page.locator(`[data-testid="appointment-${appointmentId}"] .status-cancelled`)).toBeVisible();
  });

  test('debería filtrar citas por fecha y estado', async ({ page }) => {
    // Crear varias citas con diferentes estados
    const appointments = [
      { ...testData.appointment, date: '2024-03-15', status: 'confirmed' },
      { ...testData.appointment, date: '2024-03-16', status: 'pending' },
      { ...testData.appointment, date: '2024-03-17', status: 'completed' }
    ];

    for (const apt of appointments) {
      await appointmentPage.createAppointment(apt);
    }

    // Cambiar a vista de lista
    await page.click('[data-testid="list-tab"]');
    
    // Filtrar por fecha
    await page.fill('[data-testid="date-filter"]', '2024-03-15');
    await appointmentPage.waitForPageLoad();
    
    await expect(page.locator('[data-testid="appointment-row"]')).toHaveCount(1);
    
    // Filtrar por estado
    await page.selectOption('[data-testid="status-filter"]', 'pending');
    await appointmentPage.waitForPageLoad();
    
    const pendingAppointments = page.locator('[data-testid="appointment-row"] .status-pending');
    const count = await pendingAppointments.count();
    expect(count).toBeGreaterThan(0);
  });

  test('debería mostrar vista de calendario semanal y mensual', async ({ page }) => {
    await appointmentPage.viewCalendar();
    
    // Vista semanal
    await page.click('[data-testid="week-view"]');
    await expect(page.locator('[data-testid="week-calendar"]')).toBeVisible();
    
    // Verificar que se muestren los días de la semana
    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    for (const day of weekDays) {
      await expect(page.locator(`text="${day}"`)).toBeVisible();
    }
    
    // Vista mensual
    await page.click('[data-testid="month-view"]');
    await expect(page.locator('[data-testid="month-calendar"]')).toBeVisible();
    
    // Verificar navegación de meses
    await page.click('[data-testid="next-month"]');
    await page.click('[data-testid="prev-month"]');
  });

  test('debería enviar recordatorios de citas', async ({ page }) => {
    // Crear cita
    const appointmentData = {
      ...testData.appointment,
      date: '2024-03-15',
      time: '10:00'
    };
    
    await appointmentPage.createAppointment(appointmentData);
    
    // Configurar recordatorio
    await page.click(`[data-testid="appointment-${appointmentData.date}"]`);
    await appointmentPage.waitForModal();
    
    await page.click('button:has-text("Configurar Recordatorio")');
    
    // Seleccionar tipo de recordatorio
    await page.check('[data-testid="email-reminder"]');
    await page.check('[data-testid="sms-reminder"]');
    
    // Configurar tiempo de recordatorio
    await page.selectOption('[data-testid="reminder-time"]', '24h');
    
    await page.click('button:has-text("Guardar Recordatorio")');
    await appointmentPage.assertNotification('Recordatorio configurado exitosamente');
  });

  test('debería mostrar analytics de citas', async ({ page }) => {
    await page.click('[data-testid="analytics-tab"]');
    
    // Verificar métricas principales
    await expect(page.locator('[data-testid="total-appointments"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancellation-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-duration"]')).toBeVisible();
    
    // Verificar gráficos
    await expect(page.locator('[data-testid="appointments-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="specialties-chart"]')).toBeVisible();
    
    // Verificar filtros de período
    await page.selectOption('[data-testid="period-filter"]', 'week');
    await appointmentPage.waitForPageLoad();
    
    await page.selectOption('[data-testid="period-filter"]', 'month');
    await appointmentPage.waitForPageLoad();
  });

  test('debería manejar citas recurrentes', async ({ page }) => {
    await page.click('button:has-text("Nueva Cita")');
    await appointmentPage.waitForModal();
    
    // Llenar datos básicos
    await page.click('[data-testid="patient-select"]');
    await page.click('text="María López"');
    
    await page.click('[data-testid="doctor-select"]');
    await page.click('text="Dr. Ana García"');
    
    // Habilitar cita recurrente
    await page.check('[data-testid="recurring-appointment"]');
    
    // Configurar recurrencia
    await page.selectOption('[data-testid="recurrence-pattern"]', 'weekly');
    await page.fill('[data-testid="recurrence-count"]', '4');
    
    await page.fill('[data-testid="appointment-date"]', '2024-03-15');
    await page.fill('[data-testid="appointment-time"]', '10:00');
    
    await page.click('button:has-text("Agendar Cita")');
    
    // Verificar que se crearon múltiples citas
    await appointmentPage.assertNotification('4 citas recurrentes creadas exitosamente');
  });

  test('debería exportar listado de citas', async ({ page }) => {
    await page.click('[data-testid="list-tab"]');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Exportar Citas")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/citas.*\.(csv|xlsx)$/);
  });

  test('debería mostrar conflictos de horario en tiempo real', async ({ page }) => {
    await page.click('button:has-text("Nueva Cita")');
    await appointmentPage.waitForModal();
    
    // Seleccionar doctor y fecha
    await page.click('[data-testid="doctor-select"]');
    await page.click('text="Dr. Ana García"');
    await page.fill('[data-testid="appointment-date"]', '2024-03-15');
    
    // Verificar que se actualicen los horarios disponibles
    await expect(page.locator('[data-testid="available-slots"]')).toBeVisible();
    
    // Simular selección de horario ocupado
    const occupiedSlot = page.locator('[data-testid="time-slot"].occupied').first();
    if (await occupiedSlot.isVisible()) {
      await occupiedSlot.click();
      await expect(page.locator('text="Horario no disponible"')).toBeVisible();
    }
  });

  test('debería permitir notas de cita', async ({ page }) => {
    const appointmentData = {
      ...testData.appointment,
      date: '2024-03-15',
      time: '10:00'
    };
    
    await page.click('button:has-text("Nueva Cita")');
    await appointmentPage.waitForModal();
    
    // Llenar datos básicos
    await page.click('[data-testid="patient-select"]');
    await page.click(`text="${appointmentData.patientName}"`);
    
    await page.click('[data-testid="doctor-select"]');
    await page.click(`text="${appointmentData.doctorName}"`);
    
    await page.fill('[data-testid="appointment-date"]', appointmentData.date);
    await page.fill('[data-testid="appointment-time"]', appointmentData.time);
    
    // Agregar notas
    await page.fill('[data-testid="appointment-notes"]', 'Paciente con alergia a penicilina. Revisar resultados de análisis.');
    
    await page.click('button:has-text("Agendar Cita")');
    
    // Verificar que las notas se guardaron
    await page.click(`[data-testid="appointment-${appointmentData.date}"]`);
    await appointmentPage.waitForModal();
    
    await expect(page.locator('text="Paciente con alergia a penicilina"')).toBeVisible();
  });

  test('debería funcionar correctamente en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar vista móvil del calendario
    await expect(page.locator('[data-testid="mobile-calendar"]')).toBeVisible();
    
    // Verificar que el botón de nueva cita sea accesible
    await expect(page.locator('[data-testid="mobile-new-appointment"]')).toBeVisible();
    
    // Crear cita en móvil
    await page.click('[data-testid="mobile-new-appointment"]');
    await appointmentPage.waitForModal();
    
    // Verificar que el formulario se adapte a móvil
    await expect(page.locator('[data-testid="mobile-appointment-form"]')).toBeVisible();
  });

  test('debería manejar zona horaria y cambios de horario', async ({ page }) => {
    // Verificar configuración de zona horaria
    await page.click('[data-testid="calendar-settings"]');
    await expect(page.locator('[data-testid="timezone-selector"]')).toBeVisible();
    
    // Cambiar zona horaria
    await page.selectOption('[data-testid="timezone-selector"]', 'America/Argentina/Buenos_Aires');
    await page.click('button:has-text("Guardar Configuración")');
    
    // Verificar que las citas se muestren en la nueva zona horaria
    await appointmentPage.assertNotification('Zona horaria actualizada');
  });
});
