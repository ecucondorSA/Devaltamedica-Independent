/**
 * 🚨 CRITICAL TEST: Emergency Response During Telemedicine
 * 
 * Tests críticos para validar que el sistema de telemedicina maneja
 * adecuadamente emergencias médicas durante videollamadas, incluyendo
 * activación automática de protocolos, notificación a servicios de emergencia,
 * y continuidad del cuidado médico en situaciones críticas.
 */

import { BrowserContext, expect, Page, test } from '@playwright/test';
import { authenticateAs } from '../helpers/auth';

// Simple logger implementation to avoid circular dependencies
const logger = {
  info: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log(message, data);
    }
  },
  warn: (message, data) => {
    if (typeof console !== 'undefined') {
      console.warn(message, data);
    }
  },
  error: (message, data) => {
    if (typeof console !== 'undefined') {
      console.error(message, data);
    }
  },
  debug: (message, data) => {
    if (typeof console !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug(message, data);
    }
  }
};
// 🚨 CONFIGURACIÓN EMERGENCIAS
const EMERGENCY_RESPONSE_TIME = 5000; // 5s máximo para activar protocolo
const CRITICAL_VITALS_THRESHOLD = {
  heartRate: { min: 50, max: 120 },
  bloodPressure: { systolic: { max: 180 }, diastolic: { max: 110 } },
  oxygenSaturation: { min: 90 },
  temperature: { min: 35.0, max: 39.0 }
};

// 🏥 Servicios de emergencia Argentina
const EMERGENCY_SERVICES = {
  same: '107', // Sistema de Atención Médica de Emergencia
  ambulance: '107',
  police: '101',  
  firefighters: '100',
  coordinates: {
    buenos_aires: { lat: -34.6037, lng: -58.3816 },
    cordoba: { lat: -31.4201, lng: -64.1888 },
    rosario: { lat: -32.9442, lng: -60.6505 }
  }
};

// 🩺 Protocolos médicos de emergencia
const MEDICAL_PROTOCOLS = {
  cardiac_arrest: {
    code: 'CODE_BLUE',
    priority: 'critical',
    response_time: 3000, // 3s
    actions: ['cpr_instructions', 'defibrillator_location', 'emergency_services']
  },
  stroke: {
    code: 'CODE_STROKE', 
    priority: 'critical',
    response_time: 5000, // 5s
    actions: ['fast_assessment', 'time_tracking', 'stroke_center_alert']
  },
  heart_attack: {
    code: 'CODE_STEMI',
    priority: 'critical', 
    response_time: 4000, // 4s
    actions: ['aspirin_instruction', 'cathlab_alert', 'ambulance_dispatch']
  },
  allergic_reaction: {
    code: 'CODE_ANAPHYLAXIS',
    priority: 'urgent',
    response_time: 5000, // 5s
    actions: ['epipen_location', 'antihistamine_dose', 'airway_management']
  },
  respiratory_distress: {
    code: 'CODE_RESPIRATORY',
    priority: 'critical',
    response_time: 3000, // 3s  
    actions: ['oxygen_instruction', 'positioning', 'bronchodilator']
  }
};

// 🧑‍⚕️ Datos de emergencia para tests
const EMERGENCY_SCENARIOS = {
  cardiac: {
    patientId: 'emergency-cardiac-001',
    symptoms: [
      'Dolor opresivo en el pecho que se extiende al brazo izquierdo',
      'Sudoración profusa y fría',
      'Náuseas y mareos',
      'Sensación de muerte inminente'
    ],
    vitals: {
      heartRate: 45, // Bradicardia severa
      bloodPressure: '200/110', // Hipertensión severa  
      oxygenSaturation: 88, // Hipoxemia
      temperature: 36.2,
      respiratoryRate: 28 // Taquipnea
    },
    duration: '15 minutos',
    severity: 10,
    protocol: 'heart_attack'
  },
  stroke: {
    patientId: 'emergency-stroke-002',
    symptoms: [
      'Pérdida súbita de fuerza en lado derecho',
      'Dificultad para hablar y entender',
      'Caída de la comisura labial derecha',
      'Pérdida de equilibrio'
    ],
    vitals: {
      heartRate: 88,
      bloodPressure: '190/95',
      oxygenSaturation: 95,
      temperature: 36.8,
      neurologicalDeficit: 'hemiparesia_derecha'
    },
    onset: '45 minutos',
    fastScore: 8, // FAST assessment score
    protocol: 'stroke'
  },
  anaphylaxis: {
    patientId: 'emergency-anaphylaxis-003',
    symptoms: [
      'Erupción cutánea generalizada con picazón intensa',
      'Hinchazón de labios y lengua',
      'Dificultad respiratoria progresiva',
      'Mareos y sensación de desmayo'
    ],
    vitals: {
      heartRate: 130, // Taquicardia
      bloodPressure: '80/50', // Hipotensión  
      oxygenSaturation: 89,
      temperature: 37.1
    },
    trigger: 'Penicilina IM hace 10 minutos',
    severity: 'severe',
    protocol: 'allergic_reaction'
  }
};

test.describe('🚨 Emergency Response During Telemedicine @telemedicine', () => {
  let doctorContext: BrowserContext;
  let patientContext: BrowserContext;
  let emergencyContext: BrowserContext;
  let doctorPage: Page;
  let patientPage: Page;
  let emergencyPage: Page;
  let sessionId: string;

  test.beforeAll(async ({ browser }) => {
    // 👨‍⚕️ Doctor de emergencias con permisos especiales
    doctorContext = await browser.newContext({
      permissions: ['camera', 'microphone', 'geolocation', 'notifications'],
      geolocation: EMERGENCY_SERVICES.coordinates.buenos_aires,
      recordVideo: { dir: 'test-results/emergency/doctor/' }
    });
    
    // 🤒 Paciente en situación de emergencia
    patientContext = await browser.newContext({
      permissions: ['camera', 'microphone', 'geolocation'],
      geolocation: { latitude: -34.6118, longitude: -58.3960 }, // Cerca del doctor
      recordVideo: { dir: 'test-results/emergency/patient/' }
    });
    
    // 🚑 Sistema de emergencias (simulado)
    emergencyContext = await browser.newContext({
      permissions: ['geolocation'],
      recordVideo: { dir: 'test-results/emergency/services/' }
    });

    doctorPage = await doctorContext.newPage();
    patientPage = await patientContext.newPage();
    emergencyPage = await emergencyContext.newPage();

    // Configurar monitoreo de emergencias
    await setupEmergencyMonitoring(doctorPage);
    await setupEmergencyMonitoring(patientPage);
  });

  test.afterAll(async () => {
    await doctorContext?.close();
    await patientContext?.close(); 
    await emergencyContext?.close();
  });

  test('💔 Emergencia Cardiaca - Infarto Agudo de Miocardio', async () => {
    const scenario = EMERGENCY_SCENARIOS.cardiac;
    
    await test.step('🔴 Paciente reporta síntomas de infarto', async () => {
      logger.info('🚨 Simulando emergencia cardiaca crítica...');
      
      // Configurar sesión médica de emergencia
      await doctorPage.goto('http://localhost:3002');
      await patientPage.goto('http://localhost:3003');
      
      await Promise.all([
        authenticateAs(doctorPage, 'doctor', 'emergency.cardio@altamedica.com'),
        authenticateAs(patientPage, 'patient', 'patient.cardiac@altamedica.com')
      ]);
      
      sessionId = `cardiac-emergency-${Date.now()}`;
      
      // Doctor inicia sesión de emergencia
      await doctorPage.click('[data-testid="emergency-consultation"]');
      await doctorPage.fill('[name="sessionId"]', sessionId);
      await doctorPage.selectOption('[name="emergencyType"]', 'cardiac');
      await doctorPage.click('button:text("Iniciar Emergencia")');
      
      // Paciente se conecta urgentemente  
      await patientPage.click('[data-testid="join-emergency"]');
      await patientPage.fill('[name="sessionId"]', sessionId);
      await patientPage.click('button:text("Unirse - Emergencia")');
      
      // Establecer videollamada de emergencia
      await Promise.all([
        expect(doctorPage.locator('[data-testid="emergency-session-active"]')).toBeVisible({ timeout: 10000 }),
        expect(patientPage.locator('[data-testid="emergency-mode"]')).toBeVisible({ timeout: 10000 })
      ]);
      
      logger.info('🎥 Videollamada de emergencia establecida');
    });

    await test.step('🩺 Paciente reporta síntomas críticos', async () => {
      // Paciente describe síntomas graves
      for (const symptom of scenario.symptoms) {
        await patientPage.fill('[data-testid="symptom-input"]', symptom);
        await patientPage.click('button:text("Agregar Síntoma")');
        await patientPage.waitForTimeout(500);
      }
      
      // Introducir signos vitales críticos
      await patientPage.fill('[name="heartRate"]', scenario.vitals.heartRate.toString());
      await patientPage.fill('[name="bloodPressure"]', scenario.vitals.bloodPressure);
      await patientPage.fill('[name="oxygenSaturation"]', scenario.vitals.oxygenSaturation.toString());
      await patientPage.selectOption('[name="painLevel"]', '10'); // Dolor máximo
      await patientPage.fill('[name="symptomDuration"]', scenario.duration);
      
      await patientPage.click('button:text("Enviar Información Crítica")');
      
      // Verificar que el sistema detecta emergencia automáticamente
      const emergencyDetected = await Promise.race([
        doctorPage.locator('[data-testid="critical-emergency-detected"]').isVisible(),
        new Promise(resolve => setTimeout(() => resolve(false), EMERGENCY_RESPONSE_TIME))
      ]);
      
      expect(emergencyDetected).toBe(true);
      logger.info('🚨 Sistema detectó emergencia cardiaca automáticamente');
    });

    await test.step('⚡ Activación automática de protocolo CODE STEMI', async () => {
      const protocolStart = performance.now();
      
      // Verificar activación del protocolo de infarto
      await expect(doctorPage.locator('[data-testid="code-stemi-activated"]')).toBeVisible({ 
        timeout: MEDICAL_PROTOCOLS.heart_attack.response_time 
      });
      
      const protocolTime = performance.now() - protocolStart;
      logger.info(`⚡ Protocolo CODE STEMI activado en ${protocolTime}ms`);
      expect(protocolTime).toBeLessThan(MEDICAL_PROTOCOLS.heart_attack.response_time);
      
      // Verificar que se muestran instrucciones críticas
      await expect(doctorPage.locator('text="Aspirina 300mg sublingual STAT"')).toBeVisible();
      await expect(doctorPage.locator('text="Catlab alerta - STEMI confirmado"')).toBeVisible();
      await expect(doctorPage.locator('[data-testid="ambulance-dispatch-requested"]')).toBeVisible();
      
      // Verificar cronómetro de tiempo puerta-balón
      await expect(doctorPage.locator('[data-testid="door-to-balloon-timer"]')).toBeVisible();
      
      logger.info('✅ Protocolo CODE STEMI completamente activado');
    });

    await test.step('🚑 Notificación automática a servicios de emergencia', async () => {
      // Verificar que se contacta automáticamente al SAME
      await expect(doctorPage.locator('[data-testid="same-107-notified"]')).toBeVisible();
      
      // Verificar transmisión de ubicación del paciente
      const locationData = await patientPage.evaluate(() => {
        return (window as any).emergencyLocation;
      });
      
      expect(locationData).toBeDefined();
      expect(locationData.latitude).toBeCloseTo(-34.6118, 2);
      expect(locationData.longitude).toBeCloseTo(-58.3960, 2);
      expect(locationData.accuracy).toBeLessThan(50); // <50m precisión
      
      // Verificar que se envía información médica crítica
      const emergencyData = await doctorPage.evaluate(() => {
        return (window as any).emergencyDispatch;
      });
      
      expect(emergencyData.protocol).toBe('CODE_STEMI');
      expect(emergencyData.vitals).toEqual(scenario.vitals);
      expect(emergencyData.estimatedArrival).toBeDefined();
      expect(emergencyData.hospitalDestination).toBeDefined();
      
      logger.info('🚑 SAME 107 notificado con ubicación y datos médicos');
    });

    await test.step('💊 Instrucciones médicas inmediatas', async () => {
      // Doctor proporciona instrucciones de emergencia
      await doctorPage.fill('[data-testid="emergency-instructions"]', 
        'Paciente con sospecha de STEMI inferior. Administrar aspirina 300mg sublingual INMEDIATAMENTE. Mantener al paciente en reposo.');
      
      await doctorPage.click('button:text("Enviar Instrucciones Críticas")');
      
      // Paciente recibe instrucciones claras
      await expect(patientPage.locator('[data-testid="critical-instructions"]')).toBeVisible();
      await expect(patientPage.locator('text="Aspirina 300mg"')).toBeVisible();
      await expect(patientPage.locator('text="sublingual"')).toBeVisible();
      
      // Confirmar ejecución de instrucciones
      await patientPage.click('button:text("Aspirina Administrada")');
      
      // Verificar feedback médico
      await expect(doctorPage.locator('[data-testid="medication-confirmed"]')).toBeVisible();
      
      logger.info('💊 Instrucciones médicas críticas ejecutadas');
    });

    await test.step('📊 Monitoreo continuo durante emergencia', async () => {
      // Simular monitoreo de signos vitales cada 30 segundos
      for (let i = 0; i < 3; i++) {
        await patientPage.waitForTimeout(5000); // Simular 30s acelerado
        
        // Actualizar signos vitales (mejoría tras aspirina)
        const improvedVitals = {
          heartRate: Math.min(scenario.vitals.heartRate + (i * 5), 70),
          oxygenSaturation: Math.min(scenario.vitals.oxygenSaturation + (i * 2), 95),
          painLevel: Math.max(10 - (i * 2), 6)
        };
        
        await patientPage.fill('[name="currentHeartRate"]', improvedVitals.heartRate.toString());
        await patientPage.fill('[name="currentSaturation"]', improvedVitals.oxygenSaturation.toString());
        await patientPage.selectOption('[name="currentPain"]', improvedVitals.painLevel.toString());
        await patientPage.click('button:text("Actualizar Vitales")');
        
        // Doctor recibe actualizaciones en tiempo real
        await expect(doctorPage.locator(`text="${improvedVitals.heartRate}"`)).toBeVisible();
        
        logger.info(`📊 Vitales actualizados (${i + 1}/3): FC ${improvedVitals.heartRate}, SatO2 ${improvedVitals.oxygenSaturation}%`);
      }
      
      // Verificar trending de mejora
      const vitalsTrend = await doctorPage.evaluate(() => {
        return (window as any).vitalsHistory;
      });
      
      expect(vitalsTrend).toBeDefined();
      expect(vitalsTrend.length).toBeGreaterThanOrEqual(3);
      expect(vitalsTrend[vitalsTrend.length - 1].heartRate).toBeGreaterThan(vitalsTrend[0].heartRate);
    });
  });

  test('🧠 Emergencia Neurológica - Stroke Agudo', async () => {
    const scenario = EMERGENCY_SCENARIOS.stroke;
    
    await test.step('⚡ Detección rápida de síntomas de stroke', async () => {
      logger.info('🧠 Simulando emergencia neurológica - stroke...');
      
      sessionId = `stroke-emergency-${Date.now()}`;
      
      // Reconfigurar sesión para stroke
      await doctorPage.click('[data-testid="new-emergency"]');
      await doctorPage.fill('[name="sessionId"]', sessionId);
      await doctorPage.selectOption('[name="emergencyType"]', 'neurological');
      await doctorPage.click('button:text("Iniciar Evaluación Stroke")');
      
      await patientPage.click('[data-testid="join-stroke-evaluation"]');
      await patientPage.fill('[name="sessionId"]', sessionId);
      
      // Establecer conexión neurológica especializada
      await Promise.all([
        expect(doctorPage.locator('[data-testid="stroke-evaluation-mode"]')).toBeVisible(),
        expect(patientPage.locator('[data-testid="stroke-assessment"]')).toBeVisible()
      ]);
    });

    await test.step('🔍 Evaluación FAST automatizada', async () => {
      // F - Face (Facial drooping)
      await patientPage.click('[data-testid="face-assessment"]');
      await patientPage.selectOption('[name="facialSymmetry"]', 'asymmetric_right_droop');
      await patientPage.click('button:text("Sonreír")'); // Test facial
      
      // A - Arms (Arm weakness)
      await patientPage.selectOption('[name="armStrength"]', 'right_arm_weakness');
      await patientPage.click('button:text("Elevar Brazos")');
      
      // S - Speech (Speech difficulty)
      await patientPage.fill('[data-testid="speech-test"]', 'El cielo es azul en Paris'); // Frase de prueba
      await patientPage.selectOption('[name="speechClarity"]', 'slurred_difficulty');
      
      // T - Time (Time of onset)
      await patientPage.fill('[name="symptomOnset"]', scenario.onset);
      
      await patientPage.click('button:text("Completar Evaluación FAST")');
      
      // Sistema calcula score FAST automáticamente
      const fastScore = await doctorPage.locator('[data-testid="fast-score"]').textContent();
      expect(parseInt(fastScore || '0')).toBeGreaterThanOrEqual(6); // Score crítico
      
      // Activación automática de CODE STROKE
      await expect(doctorPage.locator('[data-testid="code-stroke-activated"]')).toBeVisible({ 
        timeout: MEDICAL_PROTOCOLS.stroke.response_time 
      });
      
      logger.info(`🧠 CODE STROKE activado - FAST Score: ${fastScore}`);
    });

    await test.step('⏱️ Ventana terapéutica crítica', async () => {
      // Mostrar cronómetro de ventana terapéutica (4.5 horas para tPA)
      await expect(doctorPage.locator('[data-testid="therapeutic-window"]')).toBeVisible();
      
      const windowRemaining = await doctorPage.locator('[data-testid="tpa-window-remaining"]').textContent();
      const remainingMinutes = parseInt(windowRemaining?.match(/(\d+)/) || ['0', '0'])[1];
      
      expect(remainingMinutes).toBeGreaterThan(0);
      expect(remainingMinutes).toBeLessThanOrEqual(270); // 4.5 horas
      
      // Alerta a centro de stroke
      await expect(doctorPage.locator('[data-testid="stroke-center-alert"]')).toBeVisible();
      await expect(doctorPage.locator('text="Hospital Italiano - Unidad de Stroke"')).toBeVisible();
      
      logger.info(`⏱️ Ventana terapéutica: ${remainingMinutes} minutos restantes`);
    });

    await test.step('🏥 Coordinación con centro especializado', async () => {
      // Transmitir datos críticos a centro de stroke
      await doctorPage.click('button:text("Transmitir a Centro Stroke")');
      
      // Verificar que se envían datos completos
      const strokeData = await doctorPage.evaluate(() => {
        return (window as any).strokeTransmission;
      });
      
      expect(strokeData.fastScore).toBeDefined();
      expect(strokeData.onsetTime).toBe(scenario.onset);
      expect(strokeData.deficits).toContain('hemiparesia_derecha');
      expect(strokeData.eligibleForTPA).toBeDefined();
      
      // Confirmación del centro especializado
      await expect(doctorPage.locator('[data-testid="stroke-center-confirmed"]')).toBeVisible();
      await expect(doctorPage.locator('text="TC cerebral preparado"')).toBeVisible();
      
      logger.info('🏥 Centro de stroke notificado y preparado');
    });
  });

  test('🫁 Emergencia Respiratoria - Anafilaxis', async () => {
    const scenario = EMERGENCY_SCENARIOS.anaphylaxis;
    
    await test.step('🔴 Reacción alérgica severa', async () => {
      logger.info('🫁 Simulando anafilaxis severa...');
      
      sessionId = `anaphylaxis-emergency-${Date.now()}`;
      
      // Configurar sesión de alergia/inmunología
      await doctorPage.click('[data-testid="new-emergency"]');
      await doctorPage.fill('[name="sessionId"]', sessionId);
      await doctorPage.selectOption('[name="emergencyType"]', 'allergic_reaction');
      await doctorPage.click('button:text("Iniciar Protocolo Anafilaxis")');
      
      await patientPage.click('[data-testid="join-allergy-emergency"]');
      await patientPage.fill('[name="sessionId"]', sessionId);
      
      // Reportar reacción alérgica inmediata
      await patientPage.fill('[name="allergyTrigger"]', scenario.trigger);
      await patientPage.selectOption('[name="reactionSeverity"]', 'severe');
      
      // Describir síntomas de anafilaxis
      for (const symptom of scenario.symptoms) {
        await patientPage.fill('[data-testid="allergy-symptom"]', symptom);
        await patientPage.click('button:text("Agregar Síntoma")');
      }
      
      await patientPage.click('button:text("Enviar Reacción Alérgica")');
    });

    await test.step('💉 Protocolo CODE ANAPHYLAXIS', async () => {
      const protocolStart = performance.now();
      
      // Activación inmediata de protocolo de anafilaxis
      await expect(doctorPage.locator('[data-testid="code-anaphylaxis-activated"]')).toBeVisible({
        timeout: MEDICAL_PROTOCOLS.allergic_reaction.response_time
      });
      
      const protocolTime = performance.now() - protocolStart;
      expect(protocolTime).toBeLessThan(MEDICAL_PROTOCOLS.allergic_reaction.response_time);
      
      // Instrucciones críticas de epinefrina
      await expect(doctorPage.locator('text="Epinefrina 0.3mg IM INMEDIATAMENTE"')).toBeVisible();
      await expect(doctorPage.locator('text="Cara anterolateral del muslo"')).toBeVisible();
      await expect(doctorPage.locator('[data-testid="epipen-instructions"]')).toBeVisible();
      
      logger.info(`💉 CODE ANAPHYLAXIS activado en ${protocolTime}ms`);
    });

    await test.step('🫁 Manejo de vía aérea crítica', async () => {
      // Evaluar compromiso de vía aérea
      await patientPage.selectOption('[name="voiceChanges"]', 'hoarse_voice');
      await patientPage.selectOption('[name="swallowing"]', 'difficulty_swallowing');
      await patientPage.selectOption('[name="breathing"]', 'severe_difficulty');
      
      await patientPage.click('button:text("Actualizar Estado Respiratorio")');
      
      // Sistema detecta compromiso crítico de vía aérea
      await expect(doctorPage.locator('[data-testid="airway-compromise-critical"]')).toBeVisible();
      
      // Instrucciones de posicionamiento y oxígeno
      await expect(doctorPage.locator('text="Posición sentada o semi-Fowler"')).toBeVisible();
      await expect(doctorPage.locator('text="Oxígeno alto flujo si disponible"')).toBeVisible();
      
      // Preparación para intubación de emergencia si empeora
      await expect(doctorPage.locator('[data-testid="intubation-prep"]')).toBeVisible();
      
      logger.info('🫁 Protocolo de vía aérea activado');
    });

    await test.step('⚡ Respuesta rápida y seguimiento', async () => {
      // Simular administración de epinefrina
      await patientPage.click('button:text("Epinefrina Administrada")');
      await patientPage.fill('[name="administrationTime"]', new Date().toLocaleTimeString());
      
      // Monitorizar respuesta cada 5 minutos
      const vitalChecks = [
        { time: 5, hr: 110, bp: '90/60', sat: 92 },
        { time: 10, hr: 95, bp: '100/65', sat: 94 },
        { time: 15, hr: 85, bp: '110/70', sat: 96 }
      ];
      
      for (const check of vitalChecks) {
        await patientPage.waitForTimeout(2000); // Simular tiempo acelerado
        
        await patientPage.fill('[name="heartRate"]', check.hr.toString());
        await patientPage.fill('[name="bloodPressure"]', check.bp);
        await patientPage.fill('[name="oxygenSat"]', check.sat.toString());
        await patientPage.click('button:text("Actualizar Post-Epinefrina")');
        
        logger.info(`⚡ +${check.time}min: FC ${check.hr}, PA ${check.bp}, SatO2 ${check.sat}%`);
      }
      
      // Verificar tendencia de mejora
      const improvementTrend = await doctorPage.evaluate(() => {
        return (window as any).anaphylaxisResponse;
      });
      
      expect(improvementTrend.responding).toBe(true);
      expect(improvementTrend.secondDoseNeeded).toBe(false);
      
      logger.info('✅ Paciente respondiendo favorablemente a epinefrina');
    });
  });

  test('📱 Continuidad del Cuidado Post-Emergencia', async () => {
    await test.step('📄 Generación automática de reporte de emergencia', async () => {
      // Finalizar sesión de emergencia
      await doctorPage.click('button:text("Finalizar Emergencia")');
      
      // Sistema genera reporte automático
      await expect(doctorPage.locator('[data-testid="emergency-report-generated"]')).toBeVisible();
      
      const emergencyReport = await doctorPage.evaluate(() => {
        return (window as any).emergencyReport;
      });
      
      expect(emergencyReport.sessionId).toBeDefined();
      expect(emergencyReport.emergencyType).toBeDefined();
      expect(emergencyReport.timeline).toBeDefined();
      expect(emergencyReport.interventions).toBeDefined();
      expect(emergencyReport.outcome).toBeDefined();
      expect(emergencyReport.followUpRequired).toBe(true);
      
      logger.info('📄 Reporte de emergencia generado automáticamente');
    });

    await test.step('🔗 Transferencia a hospital receptor', async () => {
      // Transmitir reporte al hospital
      await doctorPage.click('button:text("Transmitir a Hospital")');
      
      // Verificar datos transmitidos
      const hospitalTransfer = await doctorPage.evaluate(() => {
        return (window as any).hospitalTransfer;
      });
      
      expect(hospitalTransfer.destination).toBeDefined();
      expect(hospitalTransfer.eta).toBeDefined();
      expect(hospitalTransfer.report).toBeDefined();
      expect(hospitalTransfer.medicalHistory).toBeDefined();
      expect(hospitalTransfer.interventionsDone).toBeDefined();
      
      // Confirmación del hospital receptor
      await expect(doctorPage.locator('[data-testid="hospital-confirmed"]')).toBeVisible();
      await expect(doctorPage.locator('text="Equipo preparado para recepción"')).toBeVisible();
      
      logger.info('🔗 Transferencia hospitalaria coordinada');
    });

    await test.step('📋 Follow-up médico programado', async () => {
      // Programar seguimiento automático
      await doctorPage.selectOption('[name="followUpInterval"]', '24_hours');
      await doctorPage.check('[name="requireSpecialistConsult"]');
      await doctorPage.fill('[name="specialistType"]', 'Cardiología');
      
      await doctorPage.click('button:text("Programar Seguimiento")');
      
      // Verificar que se programa cita de seguimiento
      await expect(doctorPage.locator('[data-testid="followup-scheduled"]')).toBeVisible();
      
      const followUpData = await doctorPage.evaluate(() => {
        return (window as any).followUpSchedule;
      });
      
      expect(followUpData.patientId).toBeDefined();
      expect(followUpData.scheduledDateTime).toBeDefined();
      expect(followUpData.specialistRequired).toBe(true);
      expect(followUpData.urgencyLevel).toBe('high');
      
      // Notificar al paciente del seguimiento
      await expect(patientPage.locator('[data-testid="followup-notification"]')).toBeVisible();
      
      logger.info('📋 Follow-up médico programado para 24 horas');
    });
  });

  test('📊 Métricas y Analytics de Emergencias', async () => {
    await test.step('⏱️ Análisis de tiempos de respuesta', async () => {
      const metricsResponse = await doctorPage.request.get(
        `http://localhost:3001/api/v1/emergency-metrics/session/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          }
        }
      );
      
      expect(metricsResponse.status()).toBe(200);
      const metrics = await metricsResponse.json();
      
      // Validar tiempos críticos
      expect(metrics.data.protocolActivationTime).toBeLessThan(EMERGENCY_RESPONSE_TIME);
      expect(metrics.data.emergencyServicesNotificationTime).toBeLessThan(10000); // <10s
      expect(metrics.data.firstInterventionTime).toBeLessThan(15000); // <15s
      
      logger.info('📊 Métricas de respuesta:', {
        activacionProtocolo: `${metrics.data.protocolActivationTime}ms`,
        notificacionSAME: `${metrics.data.emergencyServicesNotificationTime}ms`,
        primeraIntervencion: `${metrics.data.firstInterventionTime}ms`
      });
    });

    await test.step('🎯 Calidad y outcomes de emergencias', async () => {
      const qualityReport = await doctorPage.request.get(
        'http://localhost:3001/api/v1/emergency-quality-report',
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          }
        }
      );
      
      expect(qualityReport.status()).toBe(200);
      const quality = await qualityReport.json();
      
      // Indicadores de calidad
      expect(quality.data.protocolComplianceRate).toBeGreaterThanOrEqual(95);
      expect(quality.data.timeToTreatment).toBeLessThan(300); // <5 minutos
      expect(quality.data.patientSatisfaction).toBeGreaterThanOrEqual(4.5);
      expect(quality.data.clinicalOutcomes.positive).toBeGreaterThanOrEqual(90);
      
      logger.info('🎯 Indicadores de calidad:', {
        compliance: `${quality.data.protocolComplianceRate}%`,
        tiempoTratamiento: `${quality.data.timeToTreatment}s`,
        satisfaccion: `${quality.data.patientSatisfaction}/5`,
        outcomesPositivos: `${quality.data.clinicalOutcomes.positive}%`
      });
    });
  });
});

/**
 * 🛠️ HELPER FUNCTIONS PARA EMERGENCY TESTING
 */

async function setupEmergencyMonitoring(page: Page) {
  await page.addInitScript(() => {
    (window as any).emergencyMetrics = {
      startTime: Date.now(),
      events: [],
      vitalsHistory: [],
      interventions: []
    };
    
    // Interceptar eventos de emergencia
    (window as any).logEmergencyEvent = (event: any) => {
      (window as any).emergencyMetrics.events.push({
        ...event,
        timestamp: Date.now()
      });
    };
    
    // Monitor de signos vitales
    (window as any).logVitals = (vitals: any) => {
      (window as any).emergencyMetrics.vitalsHistory.push({
        ...vitals,
        timestamp: Date.now()
      });
    };
  });
  
  logger.info('🔍 Monitoreo de emergencias configurado');
}

// Validar que las coordenadas están dentro de Argentina
function validateArgentineLocation(lat: number, lng: number): boolean {
  // Bounding box aproximado de Argentina
  const bounds = {
    north: -21.5,
    south: -55.1,
    east: -53.6,
    west: -73.6
  };
  
  return lat <= bounds.north && lat >= bounds.south && 
         lng >= bounds.west && lng <= bounds.east;
}

// Calcular tiempo de respuesta de ambulancia basado en ubicación
function estimateAmbulanceETA(patientLat: number, patientLng: number): number {
  // Simulación simplificada - en producción usar API de mapas real
  const baseTime = 8; // 8 minutos base
  const distanceFactor = Math.random() * 5; // 0-5 minutos adicionales
  return Math.round(baseTime + distanceFactor);
}

/**
 * 📊 METADATA DE EMERGENCY TEST
 */
const EMERGENCY_TEST_METADATA = {
  testType: 'emergency_medical_response',
  criticality: 'critical',
  medicalProtocols: Object.keys(MEDICAL_PROTOCOLS),
  emergencyServices: EMERGENCY_SERVICES,
  responseTimeThresholds: {
    protocolActivation: EMERGENCY_RESPONSE_TIME,
    emergencyNotification: 10000,
    firstIntervention: 15000,
    ambulanceDispatch: 30000
  },
  qualityMetrics: {
    protocolCompliance: 95, // %
    timeToTreatment: 300, // seconds
    patientSatisfaction: 4.5, // /5
    positiveOutcomes: 90 // %
  },
  coverageScenarios: [
    'cardiac_arrest',
    'myocardial_infarction', 
    'stroke_acute',
    'anaphylaxis_severe',
    'respiratory_distress',
    'trauma_major'
  ]
};