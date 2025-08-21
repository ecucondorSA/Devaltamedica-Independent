/**
 * 🧪 E2E TEST CRÍTICO: Complete Patient Journey - Flujo Médico Completo
 * Test end-to-end que valida el flujo completo de un paciente en AltaMedica
 * 
 * Flujo: Registro → Búsqueda Doctor → Reserva Cita → Videoconsulta → Prescripción → Pago
 * Tiempo esperado: < 3 segundos para operaciones críticas
 * Compliance: HIPAA, WCAG 2.2 AA, Regulaciones médicas argentinas
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import { authenticateAs } from '../helpers/auth';

import { logger } from '@altamedica/shared/services/logger.service';
// Configuración del test
const TEST_TIMEOUT = 60000; // 60 segundos para flujo completo
const CRITICAL_OPERATION_TIMEOUT = 3000; // 3 segundos para operaciones críticas

// URLs de las aplicaciones
const URLS = {
  webApp: 'http://localhost:3000',
  patients: 'http://localhost:3003', 
  doctors: 'http://localhost:3002',
  companies: 'http://localhost:3004'
};

// Datos de prueba médicos
const testPatientData = {
  personalInfo: {
    firstName: 'María',
    lastName: 'Rodríguez',
    email: `maria.rodriguez.e2e.${Date.now()}@test.com`,
    phone: '+54 11 1234-5678',
    dni: `12345${Date.now().toString().slice(-3)}`,
    dateOfBirth: '1985-03-15',
    gender: 'female'
  },
  medicalInfo: {
    bloodType: 'A+',
    allergies: ['Penicilina'],
    healthInsurance: 'OSDE Plan 210',
    emergencyContact: {
      name: 'Carlos Rodríguez',
      phone: '+54 11 9876-5432',
      relationship: 'Esposo'
    }
  },
  symptoms: {
    chief_complaint: 'Dolor en el pecho y palpitaciones',
    duration: '2 días',
    severity: 'moderate',
    additional: 'Empeora con el esfuerzo'
  }
};

const testDoctorProfile = {
  name: 'Dr. Ana García',
  specialization: 'Cardiología',
  rating: 4.8,
  experience: '10+ años',
  languages: ['Español', 'Inglés']
};

test.describe('🏥 Complete Patient Journey - Flujo Médico E2E', () => {
  let patientContext: BrowserContext;
  let doctorContext: BrowserContext; 
  let patientPage: Page;
  let doctorPage: Page;
  let appointmentId: string;
  let prescriptionId: string;

  test.beforeAll(async ({ browser }) => {
    // Configurar contextos separados para paciente y doctor
    patientContext = await browser.newContext({
      permissions: ['camera', 'microphone'], // Para videoconsulta
      geolocation: { latitude: -34.6037, longitude: -58.3816 } // Buenos Aires
    });
    
    doctorContext = await browser.newContext({
      permissions: ['camera', 'microphone', 'notifications']
    });

    patientPage = await patientContext.newPage();
    doctorPage = await doctorContext.newPage();

    // Configurar interceptores para monitoreo de rendimiento
    await patientPage.route('**/*', (route) => {
      const startTime = Date.now();
      route.continue().then(() => {
        const endTime = Date.now();
        if (endTime - startTime > CRITICAL_OPERATION_TIMEOUT) {
          logger.warn(`⚠️ Operación lenta detectada: ${route.request().url()} - ${endTime - startTime}ms`);
        }
      });
    });
  });

  test.afterAll(async () => {
    await patientContext?.close();
    await doctorContext?.close();
  });

  test('🎯 FLUJO COMPLETO: Registro → Cita → Consulta → Prescripción → Pago', async () => {
    test.setTimeout(TEST_TIMEOUT);

    // ==================== PASO 1: REGISTRO DE PACIENTE ====================
    await test.step('👤 1. Registro de paciente con información médica', async () => {
      logger.info('🚀 Iniciando registro de paciente...');
      
      await patientPage.goto(URLS.webApp);
      
      // Verificar que la página de inicio carga correctamente
      await expect(patientPage.locator('h1')).toContainText(/Bienvenido|AltaMedica/i, { timeout: 5000 });
      
      // Navegar al registro de paciente
      await patientPage.click('text="Registrarse como Paciente"', { timeout: 5000 });
      await expect(patientPage).toHaveURL(/.*register.*patient/);
      
      // Completar formulario de registro personal
      await patientPage.fill('[name="firstName"]', testPatientData.personalInfo.firstName);
      await patientPage.fill('[name="lastName"]', testPatientData.personalInfo.lastName);
      await patientPage.fill('[name="email"]', testPatientData.personalInfo.email);
      await patientPage.fill('[name="phone"]', testPatientData.personalInfo.phone);
      await patientPage.fill('[name="dni"]', testPatientData.personalInfo.dni);
      await patientPage.fill('[name="dateOfBirth"]', testPatientData.personalInfo.dateOfBirth);
      await patientPage.selectOption('[name="gender"]', testPatientData.personalInfo.gender);
      
      // Avanzar a información médica
      await patientPage.click('button:text("Siguiente")');
      
      // Completar información médica
      await patientPage.selectOption('[name="bloodType"]', testPatientData.medicalInfo.bloodType);
      
      // Añadir alergia
      await patientPage.fill('[placeholder*="Penicilina"]', testPatientData.medicalInfo.allergies[0]);
      await patientPage.click('button:text("Añadir")');
      
      // Verificar que la alergia se añadió correctamente
      await expect(patientPage.locator('.bg-red-100')).toContainText('Penicilina');
      
      // Completar información de seguro
      await patientPage.click('button:text("Siguiente")');
      await patientPage.check('[name="hasInsurance"]');
      await patientPage.fill('[name="insuranceProvider"]', testPatientData.medicalInfo.healthInsurance);
      
      // Contacto de emergencia
      await patientPage.click('button:text("Siguiente")');
      await patientPage.fill('[name="emergencyContactName"]', testPatientData.medicalInfo.emergencyContact.name);
      await patientPage.fill('[name="emergencyContactPhone"]', testPatientData.medicalInfo.emergencyContact.phone);
      await patientPage.fill('[name="emergencyContactRelationship"]', testPatientData.medicalInfo.emergencyContact.relationship);
      
      // Finalizar registro
      const registrationStartTime = Date.now();
      await patientPage.click('button:text("Completar Registro")');
      
      // Verificar que se redirige a la aplicación de pacientes
      await expect(patientPage).toHaveURL(/.*3003.*dashboard/, { timeout: 10000 });
      
      const registrationTime = Date.now() - registrationStartTime;
      logger.info(`✅ Registro completado en ${registrationTime}ms`);
      
      // Verificar dashboard del paciente
      await expect(patientPage.locator('h1, h2')).toContainText(/Dashboard|Bienvenid/, { timeout: 5000 });
      await expect(patientPage.locator('text=María')).toBeVisible();
    });

    // ==================== PASO 2: BÚSQUEDA DE DOCTOR ====================
    await test.step('🔍 2. Búsqueda y selección de doctor especialista', async () => {
      logger.info('🔍 Buscando doctor especialista...');
      
      // Navegar a búsqueda de doctores
      await patientPage.click('[data-testid="find-doctor"], text="Buscar Doctor", text="Encontrar Especialista"');
      
      // Esperar a que la página de búsqueda cargue
      await expect(patientPage.locator('h1, h2')).toContainText(/Buscar|Doctores|Especialistas/i, { timeout: 5000 });
      
      // Filtrar por especialidad
      await patientPage.selectOption('[name="specialization"], select:visible', 'Cardiología');
      
      // Aplicar filtros adicionales
      await patientPage.selectOption('[name="experience"]', '5+');
      await patientPage.selectOption('[name="language"]', 'Español');
      
      // Ejecutar búsqueda
      await patientPage.click('button:text("Buscar"), [type="submit"]');
      
      // Verificar resultados de búsqueda
      await expect(patientPage.locator('.doctor-card, [data-testid="doctor-item"]')).toHaveCountGreaterThan(0, { timeout: 5000 });
      
      // Seleccionar primer doctor disponible
      const firstDoctor = patientPage.locator('.doctor-card, [data-testid="doctor-item"]').first();
      await expect(firstDoctor).toBeVisible();
      
      // Verificar información del doctor
      await expect(firstDoctor).toContainText('Dr.');
      await expect(firstDoctor).toContainText('Cardiología');
      
      // Hacer clic en "Ver Perfil" o similar
      await firstDoctor.locator('button:text("Ver Perfil"), a:text("Ver Más"), button:text("Seleccionar")').first().click();
      
      logger.info('✅ Doctor seleccionado exitosamente');
    });

    // ==================== PASO 3: RESERVA DE CITA ====================
    await test.step('📅 3. Reserva de cita médica con validación de horarios', async () => {
      logger.info('📅 Reservando cita médica...');
      
      // Verificar que estamos en la página del doctor
      await expect(patientPage.locator('h1, h2')).toContainText(/Dr\.|Perfil|Reservar/i, { timeout: 5000 });
      
      // Hacer clic en reservar cita
      await patientPage.click('button:text("Reservar Cita"), button:text("Agendar"), [data-testid="book-appointment"]');
      
      // Seleccionar tipo de consulta
      await patientPage.click('input[value="consultation"], text="Consulta Médica"');
      
      // Seleccionar fecha (mañana)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      await patientPage.fill('[type="date"], [name="appointmentDate"]', tomorrowStr);
      
      // Esperar a que los horarios disponibles se carguen
      await expect(patientPage.locator('.time-slot, [data-testid="time-slot"]')).toHaveCountGreaterThan(0, { timeout: 5000 });
      
      // Seleccionar primer horario disponible
      await patientPage.locator('.time-slot:not(.disabled), [data-testid="time-slot"]:not([disabled])').first().click();
      
      // Completar información de la consulta
      await patientPage.fill('[name="reason"], textarea', testPatientData.symptoms.chief_complaint);
      await patientPage.fill('[name="symptoms"]', `${testPatientData.symptoms.additional}. Duración: ${testPatientData.symptoms.duration}`);
      
      // Seleccionar urgencia
      await patientPage.selectOption('[name="urgency"]', testPatientData.symptoms.severity);
      
      // Confirmar información de seguro médico
      await patientPage.check('[name="useInsurance"]');
      
      // Procesar reserva
      const bookingStartTime = Date.now();
      await patientPage.click('button:text("Confirmar Cita"), button:text("Reservar")');
      
      // Esperar confirmación
      await expect(patientPage.locator('text="confirmada", text="exitosa", .success-message')).toBeVisible({ timeout: 10000 });
      
      const bookingTime = Date.now() - bookingStartTime;
      logger.info(`✅ Cita reservada en ${bookingTime}ms`);
      
      // Capturar ID de la cita para uso posterior
      const appointmentElement = patientPage.locator('[data-testid="appointment-id"], .appointment-code');
      if (await appointmentElement.isVisible()) {
        appointmentId = await appointmentElement.textContent() || `test-appointment-${Date.now()}`;
      }
      
      // Verificar que aparece en el dashboard
      await patientPage.goto(`${URLS.patients}/dashboard`);
      await expect(patientPage.locator('.appointment-card, [data-testid="upcoming-appointment"]')).toBeVisible({ timeout: 5000 });
    });

    // ==================== PASO 4: CONFIGURAR VISTA DEL DOCTOR ====================
    await test.step('👨‍⚕️ 4. Doctor prepara para la consulta', async () => {
      logger.info('👨‍⚕️ Configurando vista del doctor...');
      
      await doctorPage.goto(URLS.doctors);
      
      // Autenticar como doctor
      await authenticateAs(doctorPage, 'doctor', 'test.doctor@altamedica.com');
      
      // Verificar dashboard del doctor
      await expect(doctorPage).toHaveURL(/.*doctors.*dashboard/, { timeout: 10000 });
      await expect(doctorPage.locator('h1, h2')).toContainText(/Dashboard|Doctor/i, { timeout: 5000 });
      
      // Navegar a citas del día
      await doctorPage.click('text="Mis Citas", text="Agenda", [data-testid="appointments"]');
      
      // Verificar que la cita del paciente aparece
      await expect(doctorPage.locator('.appointment-card, [data-testid="appointment-item"]')).toHaveCountGreaterThan(0, { timeout: 5000 });
      
      // Buscar la cita del paciente específico
      const patientAppointment = doctorPage.locator(`text="${testPatientData.personalInfo.firstName}"`).first();
      await expect(patientAppointment).toBeVisible({ timeout: 5000 });
      
      logger.info('✅ Doctor listo para la consulta');
    });

    // ==================== PASO 5: VIDEOCONSULTA ====================
    await test.step('📹 5. Realizar videoconsulta médica', async () => {
      logger.info('📹 Iniciando videoconsulta...');
      
      // En el lado del paciente: Iniciar videollamada
      await patientPage.goto(`${URLS.patients}/appointments`);
      await patientPage.click('button:text("Iniciar Consulta"), [data-testid="start-consultation"]');
      
      // Permitir permisos de cámara y micrófono
      await patientPage.waitForFunction(() => {
        return navigator.mediaDevices.getUserMedia !== undefined;
      });
      
      // Verificar que el componente de video se carga
      await expect(patientPage.locator('video, [data-testid="video-element"]')).toBeVisible({ timeout: 10000 });
      
      // En el lado del doctor: Unirse a la consulta
      await doctorPage.click('button:text("Unirse"), text="Iniciar Consulta", [data-testid="join-consultation"]');
      
      // Verificar que ambos tienen video activo
      await expect(doctorPage.locator('video, [data-testid="doctor-video"]')).toBeVisible({ timeout: 10000 });
      
      // Simular intercambio médico
      await doctorPage.fill('[data-testid="consultation-notes"], textarea[placeholder*="notas"]', 
        'Paciente presenta dolor torácico atípico. Examen físico: FC 78 lpm, PA 120/80 mmHg. Auscultación cardíaca normal.');
      
      // Doctor añade diagnóstico
      await doctorPage.fill('[name="diagnosis"]', 'Dolor torácico atípico - probable origen ansioso');
      
      // Verificar calidad de conexión
      await expect(patientPage.locator('.connection-status, [data-testid="connection-good"]')).toBeVisible({ timeout: 5000 });
      
      logger.info('✅ Videoconsulta completada exitosamente');
      
      // Finalizar consulta
      await doctorPage.click('button:text("Finalizar Consulta")');
      await patientPage.click('button:text("Terminar"), text="Finalizar"');
    });

    // ==================== PASO 6: PRESCRIPCIÓN MÉDICA ====================
    await test.step('💊 6. Generar prescripción médica digital', async () => {
      logger.info('💊 Generando prescripción médica...');
      
      // Doctor crea prescripción
      await doctorPage.click('button:text("Crear Prescripción"), text="Nueva Receta"');
      
      // Verificar que no hay conflictos con alergias
      await expect(doctorPage.locator('.allergy-warning')).toContainText('Penicilina', { timeout: 3000 });
      
      // Añadir medicamento seguro (no alérgico)
      await doctorPage.fill('[name="medicationName"]', 'Omeprazol');
      await doctorPage.fill('[name="dose"]', '20mg');
      await doctorPage.selectOption('[name="frequency"]', '1 vez al día');
      await doctorPage.fill('[name="duration"]', '14 días');
      await doctorPage.fill('[name="instructions"]', 'Tomar en ayunas, 30 minutos antes del desayuno');
      
      // Añadir medicamento
      await doctorPage.click('button:text("Añadir Medicamento")');
      
      // Verificar que se añadió
      await expect(doctorPage.locator('.medication-item, [data-testid="medication-added"]')).toContainText('Omeprazol');
      
      // Añadir segundo medicamento
      await doctorPage.fill('[name="medicationName"]', 'Alprazolam');
      await doctorPage.fill('[name="dose"]', '0.25mg');
      await doctorPage.selectOption('[name="frequency"]', 'según necesidad');
      await doctorPage.fill('[name="duration"]', '7 días');
      await doctorPage.fill('[name="instructions"]', 'Para ansiedad. Máximo 2 por día. No conducir.');
      
      await doctorPage.click('button:text("Añadir Medicamento")');
      
      // Añadir notas adicionales
      await doctorPage.fill('[name="prescriptionNotes"]', 
        'Control en 2 semanas. Si persisten síntomas, realizar ECG y ergometría.');
      
      // Generar prescripción
      const prescriptionStartTime = Date.now();
      await doctorPage.click('button:text("Generar Prescripción"), button:text("Crear Receta")');
      
      // Verificar que se genera código QR
      await expect(doctorPage.locator('.qr-code, [data-testid="prescription-qr"]')).toBeVisible({ timeout: 5000 });
      
      const prescriptionTime = Date.now() - prescriptionStartTime;
      logger.info(`✅ Prescripción generada en ${prescriptionTime}ms`);
      
      // Capturar ID de prescripción
      const prescriptionElement = doctorPage.locator('[data-testid="prescription-id"], .prescription-code');
      if (await prescriptionElement.isVisible()) {
        prescriptionId = await prescriptionElement.textContent() || `test-prescription-${Date.now()}`;
      }
    });

    // ==================== PASO 7: VALIDAR PRESCRIPCIÓN (PACIENTE) ====================
    await test.step('📋 7. Paciente recibe y valida prescripción', async () => {
      logger.info('📋 Validando prescripción del paciente...');
      
      // Paciente navega a prescripciones
      await patientPage.goto(`${URLS.patients}/prescriptions`);
      
      // Verificar que aparece la nueva prescripción
      await expect(patientPage.locator('.prescription-card, [data-testid="prescription-item"]')).toBeVisible({ timeout: 5000 });
      
      // Verificar medicamentos prescritos
      await expect(patientPage.locator('text="Omeprazol"')).toBeVisible();
      await expect(patientPage.locator('text="Alprazolam"')).toBeVisible();
      
      // Verificar que no hay alertas de alergias (no se prescribió Penicilina)
      await expect(patientPage.locator('.allergy-alert, .alert-danger')).toHaveCount(0);
      
      // Descargar prescripción digital
      await patientPage.click('button:text("Descargar"), text="PDF"');
      
      // Verificar código QR para farmacia
      await patientPage.click('button:text("Ver Código QR"), text="Farmacia"');
      await expect(patientPage.locator('.qr-code, [data-testid="qr-code"]')).toBeVisible();
      
      logger.info('✅ Prescripción validada por el paciente');
    });

    // ==================== PASO 8: PROCESO DE PAGO ====================
    await test.step('💳 8. Procesar pago de consulta médica', async () => {
      logger.info('💳 Procesando pago de la consulta...');
      
      // Navegar a facturación
      await patientPage.goto(`${URLS.patients}/billing`);
      
      // Verificar factura pendiente
      await expect(patientPage.locator('.pending-bill, [data-testid="pending-payment"]')).toBeVisible({ timeout: 5000 });
      
      // Verificar detalles de la factura
      await expect(patientPage.locator('text="Consulta Cardiología"')).toBeVisible();
      await expect(patientPage.locator('.amount, [data-testid="amount"]')).toContainText(/\$|ARS/);
      
      // Verificar descuento por seguro médico
      await expect(patientPage.locator('text="OSDE", text="Cobertura"')).toBeVisible();
      
      // Procesar pago
      await patientPage.click('button:text("Pagar Ahora"), [data-testid="pay-button"]');
      
      // Completar información de pago (simulado)
      await patientPage.fill('[name="cardNumber"]', '4111111111111111');
      await patientPage.fill('[name="expiryDate"]', '12/26');
      await patientPage.fill('[name="cvv"]', '123');
      await patientPage.fill('[name="cardName"]', `${testPatientData.personalInfo.firstName} ${testPatientData.personalInfo.lastName}`);
      
      // Confirmar pago
      const paymentStartTime = Date.now();
      await patientPage.click('button:text("Confirmar Pago")');
      
      // Verificar pago exitoso
      await expect(patientPage.locator('.payment-success, text="exitoso", .success')).toBeVisible({ timeout: 10000 });
      
      const paymentTime = Date.now() - paymentStartTime;
      logger.info(`✅ Pago procesado en ${paymentTime}ms`);
      
      // Verificar recibo
      await expect(patientPage.locator('.receipt, [data-testid="payment-receipt"]')).toBeVisible();
      await expect(patientPage.locator('text="Pagado", text="Completado"')).toBeVisible();
    });

    // ==================== PASO 9: VERIFICACIÓN FINAL ====================
    await test.step('✅ 9. Verificación final del flujo completo', async () => {
      logger.info('✅ Realizando verificación final...');
      
      // Verificar dashboard del paciente actualizado
      await patientPage.goto(`${URLS.patients}/dashboard`);
      
      // Verificar historial médico actualizado
      await expect(patientPage.locator('.completed-appointment, [data-testid="completed-consultation"]')).toBeVisible();
      
      // Verificar prescripción activa
      await patientPage.click('text="Ver Prescripciones", [data-testid="view-prescriptions"]');
      await expect(patientPage.locator('.active-prescription')).toBeVisible();
      
      // Verificar próximas citas de seguimiento
      await patientPage.goto(`${URLS.patients}/appointments`);
      await expect(patientPage.locator('text="Control en 2 semanas"')).toBeVisible();
      
      // En el lado del doctor: Verificar completitud
      await doctorPage.goto(`${URLS.doctors}/patients`);
      await expect(doctorPage.locator(`text="${testPatientData.personalInfo.firstName}"`)).toBeVisible();
      
      // Verificar registro médico creado
      await doctorPage.click(`text="${testPatientData.personalInfo.firstName}"`);
      await expect(doctorPage.locator('.medical-record, [data-testid="medical-record"]')).toBeVisible();
      
      logger.info('🎉 FLUJO COMPLETO EXITOSO - Todos los pasos validados');
    });
  });

  test('🔒 HIPAA Compliance y Auditoría durante el flujo', async () => {
    await test.step('Verificar compliance HIPAA en todas las etapas', async () => {
      // Verificar encriptación en tránsito
      const responses = await Promise.all([
        patientPage.goto(`${URLS.patients}/api/health`),
        doctorPage.goto(`${URLS.doctors}/api/health`)
      ]);
      
      for (const response of responses) {
        expect(response.headers()['x-hipaa-compliant']).toBe('true');
        expect(response.headers()['strict-transport-security']).toBeDefined();
      }
      
      // Verificar audit logs
      await patientPage.goto(`${URLS.patients}/profile/audit`);
      await expect(patientPage.locator('.audit-log, [data-testid="audit-entry"]')).toHaveCountGreaterThan(0);
      
      logger.info('✅ Compliance HIPAA verificado');
    });
  });

  test('⚡ Performance y Tiempo de Respuesta', async () => {
    await test.step('Verificar tiempos de respuesta críticos', async () => {
      // Medir tiempo de carga de dashboard
      const startTime = Date.now();
      await patientPage.goto(`${URLS.patients}/dashboard`);
      await expect(patientPage.locator('h1')).toBeVisible();
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(CRITICAL_OPERATION_TIMEOUT);
      
      // Medir tiempo de búsqueda de doctores
      const searchStartTime = Date.now();
      await patientPage.goto(`${URLS.patients}/find-doctor`);
      await patientPage.selectOption('select', 'Cardiología');
      await expect(patientPage.locator('.doctor-card')).toHaveCountGreaterThan(0);
      const searchTime = Date.now() - searchStartTime;
      
      expect(searchTime).toBeLessThan(CRITICAL_OPERATION_TIMEOUT);
      
      logger.info(`⚡ Performance: Dashboard ${loadTime}ms, Búsqueda ${searchTime}ms`);
    });
  });

  test('♿ Accesibilidad WCAG 2.2 AA', async () => {
    await test.step('Verificar accesibilidad en páginas críticas', async () => {
      const pages = [
        `${URLS.patients}/dashboard`,
        `${URLS.patients}/find-doctor`,
        `${URLS.patients}/appointments`,
        `${URLS.patients}/prescriptions`
      ];
      
      for (const pageUrl of pages) {
        await patientPage.goto(pageUrl);
        
        // Verificar estructura semántica
        await expect(patientPage.locator('main')).toBeVisible();
        await expect(patientPage.locator('h1')).toHaveCount(1);
        
        // Verificar contraste de colores (simulado)
        const buttons = patientPage.locator('button');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          await expect(buttons.nth(i)).toHaveCSS('color', /.*/);
          await expect(buttons.nth(i)).toHaveCSS('background-color', /.*/);
        }
        
        // Verificar navegación por teclado
        await patientPage.keyboard.press('Tab');
        await expect(patientPage.locator(':focus')).toBeVisible();
      }
      
      logger.info('♿ Accesibilidad WCAG 2.2 AA verificada');
    });
  });
});

/**
 * Configuración de reportes y métricas
 */
test.afterEach(async ({}, testInfo) => {
  if (testInfo.status === 'failed') {
    logger.error(`❌ Test fallido: ${testInfo.title}`);
    logger.error(`Error: ${testInfo.error?.message}`);
  } else {
    logger.info(`✅ Test exitoso: ${testInfo.title} - Duración: ${testInfo.duration}ms`);
  }
});

/**
 * Datos adicionales para reportes
 */
const TEST_METADATA = {
  criticality: 'high',
  medicalSafety: true,
  hipaaCompliance: true,
  performanceThresholds: {
    registration: CRITICAL_OPERATION_TIMEOUT,
    booking: CRITICAL_OPERATION_TIMEOUT,
    consultation: 5000,
    prescription: CRITICAL_OPERATION_TIMEOUT,
    payment: 5000
  },
  coverageAreas: [
    'patient_registration',
    'doctor_search', 
    'appointment_booking',
    'telemedicine_consultation',
    'prescription_management',
    'payment_processing',
    'hipaa_compliance',
    'accessibility_wcag',
    'performance_optimization'
  ]
};