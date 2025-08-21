/**
 * 📹 COMPLIANCE TEST: Medical Recording HIPAA Compliance
 * 
 * Tests especializados para validar que el sistema de grabación de consultas
 * médicas cumple con todos los requisitos HIPAA, incluyendo consentimiento,
 * encriptación, almacenamiento seguro, retención de datos y derechos del paciente.
 */

import { BrowserContext, expect, Page, test } from '@playwright/test';
import crypto from 'crypto';
import { authenticateAs } from '../helpers/auth';

import { logger } from '@altamedica/shared/services/logger.service';
// 📹 CONFIGURACIÓN RECORDING COMPLIANCE
const RECORDING_TIMEOUT = 30000;
const HIPAA_RETENTION_YEARS = 7; // 7 años según HIPAA
const ENCRYPTION_STANDARD = 'AES-256-GCM';
const MAX_RECORDING_SIZE = 1024 * 1024 * 1024; // 1GB por sesión

// 🔒 Requisitos HIPAA para grabaciones médicas
const HIPAA_RECORDING_REQUIREMENTS = {
  consentimiento: {
    explicito: true,
    informado: true,
    revocable: true,
    documentado: true
  },
  encriptacion: {
    enTransito: 'TLS 1.3',
    enReposo: 'AES-256-GCM',
    claves: 'rotacion_mensual'
  },
  almacenamiento: {
    ubicacion: 'territorio_nacional',
    backup: 'geograficamente_distribuido',
    integridad: 'checksums_continuos'
  },
  acceso: {
    autenticacionMultifactor: true,
    auditoriaTodosAccesos: true,
    controlBasadoRoles: true
  },
  retencion: {
    minimoAnios: HIPAA_RETENTION_YEARS,
    destruccionSegura: true,
    certificadoDestruccion: true
  }
};

// 📋 Datos médicos para grabación
const MEDICAL_RECORDING_DATA = {
  sessionId: `hipaa-recording-${Date.now()}`,
  patientInfo: {
    id: 'patient-recording-001',
    name: 'María Elena Rodríguez',
    dni: '27-34567890-1',
    medicalRecord: 'MR-REC-789456',
    insurance: 'Swiss Medical Plan 300'
  },
  consultationData: {
    specialty: 'Cardiología',
    reason: 'Control post-angioplastia',
    duration: '30 minutos',
    complexity: 'high',
    includes: ['medical_history', 'physical_exam', 'treatment_plan', 'prescriptions']
  },
  sensitiveContent: {
    diagnosis: 'Enfermedad arterial coronaria de tres vasos',
    medications: ['Clopidogrel 75mg', 'Atorvastatina 40mg', 'Metoprolol 50mg'],
    procedures: ['Angioplastia con stent drug-eluting en DA'],
    familyHistory: 'Padre fallecido por IAM a los 58 años'
  }
};

// 🎭 Roles para testing de permisos
const TEST_ROLES = {
  doctor_owner: {
    email: 'recording.doctor@altamedica.com',
    permissions: ['view', 'record', 'share', 'delete']
  },
  doctor_consultant: {
    email: 'consultant.doctor@altamedica.com', 
    permissions: ['view', 'record']
  },
  nurse: {
    email: 'recording.nurse@altamedica.com',
    permissions: ['view']
  },
  admin: {
    email: 'recording.admin@altamedica.com',
    permissions: ['view', 'audit', 'manage_retention']
  },
  unauthorized: {
    email: 'unauthorized.user@external.com',
    permissions: []
  }
};

test.describe('📹 Medical Recording HIPAA Compliance @telemedicine', () => {
  let doctorContext: BrowserContext;
  let patientContext: BrowserContext;
  let auditContext: BrowserContext;
  let doctorPage: Page;
  let patientPage: Page;
  let auditPage: Page;
  let sessionId: string;
  let recordingId: string;

  test.beforeAll(async ({ browser }) => {
    // 👨‍⚕️ Doctor con permisos de grabación completos
    doctorContext = await browser.newContext({
      permissions: ['camera', 'microphone', 'notifications'],
      recordVideo: { dir: 'test-results/recording-compliance/doctor/' }
    });
    
    // 🤒 Paciente con derechos de consentimiento
    patientContext = await browser.newContext({
      permissions: ['camera', 'microphone'],
      recordVideo: { dir: 'test-results/recording-compliance/patient/' }
    });
    
    // 👮 Auditor para validación de compliance
    auditContext = await browser.newContext({
      recordVideo: { dir: 'test-results/recording-compliance/audit/' }
    });

    doctorPage = await doctorContext.newPage();
    patientPage = await patientContext.newPage();
    auditPage = await auditContext.newPage();

    // Configurar monitoreo de grabaciones
    await setupRecordingMonitoring(doctorPage);
    await setupRecordingMonitoring(patientPage);
  });

  test.afterAll(async () => {
    await doctorContext?.close();
    await patientContext?.close();
    await auditContext?.close();
  });

  test('📝 Consentimiento Informado y Documentación HIPAA', async () => {
    await test.step('🤒 Paciente otorga consentimiento explícito', async () => {
      logger.info('📝 Iniciando proceso de consentimiento informado...');
      
      // Configurar sesión médica
      await doctorPage.goto('http://localhost:3002');
      await patientPage.goto('http://localhost:3003');
      
      await Promise.all([
        authenticateAs(doctorPage, 'doctor', TEST_ROLES.doctor_owner.email),
        authenticateAs(patientPage, 'patient', 'recording.patient@altamedica.com')
      ]);
      
      sessionId = MEDICAL_RECORDING_DATA.sessionId;
      
      // Doctor inicia sesión con opción de grabación
      await doctorPage.click('[data-testid="new-consultation-session"]');
      await doctorPage.fill('[name="sessionId"]', sessionId);
      await doctorPage.check('[name="enableRecording"]');
      await doctorPage.selectOption('[name="recordingPurpose"]', 'medical_documentation');
      await doctorPage.click('button:text("Iniciar Consulta")');
      
      // Paciente recibe solicitud de consentimiento detallada
      await expect(patientPage.locator('[data-testid="recording-consent-modal"]')).toBeVisible();
      
      // Verificar información completa del consentimiento
      await expect(patientPage.locator('text="consentimiento informado"')).toBeVisible();
      await expect(patientPage.locator('text="grabación de consulta médica"')).toBeVisible();
      await expect(patientPage.locator('text="fines médicos y documentación"')).toBeVisible();
      await expect(patientPage.locator('text="encriptación AES-256"')).toBeVisible();
      await expect(patientPage.locator('text="7 años de retención"')).toBeVisible();
      await expect(patientPage.locator('text="derecho a revocar"')).toBeVisible();
      
      logger.info('📋 Información de consentimiento completa mostrada');
    });

    await test.step('✍️ Firma digital del consentimiento', async () => {
      // Paciente lee y acepta cada sección del consentimiento
      await patientPage.check('[name="understandRecordingPurpose"]');
      await patientPage.check('[name="understandDataSecurity"]'); 
      await patientPage.check('[name="understandRetentionPolicy"]');
      await patientPage.check('[name="understandRightToRevoke"]');
      await patientPage.check('[name="understandAccessRights"]');
      
      // Firma digital con timestamp
      await patientPage.fill('[data-testid="digital-signature"]', 'María Elena Rodríguez');
      await patientPage.click('[data-testid="timestamp-signature"]');
      
      // Finalizar consentimiento
      await patientPage.click('button:text("Otorgo Mi Consentimiento")');
      
      // Verificar documentación del consentimiento
      const consentData = await patientPage.evaluate(() => {
        return (window as any).recordingConsent;
      });
      
      expect(consentData.patientId).toBe(MEDICAL_RECORDING_DATA.patientInfo.id);
      expect(consentData.timestamp).toBeDefined();
      expect(consentData.digitalSignature).toBe('María Elena Rodríguez');
      expect(consentData.ipAddress).toBeDefined();
      expect(consentData.browserFingerprint).toBeDefined();
      expect(consentData.consentItems.length).toBe(5);
      
      logger.info('✍️ Consentimiento documentado digitalmente con timestamp');
    });

    await test.step('📄 Certificado de consentimiento generado', async () => {
      // Sistema genera certificado automático
      await expect(doctorPage.locator('[data-testid="consent-certificate-generated"]')).toBeVisible();
      
      // Verificar contenido del certificado
      const certificate = await doctorPage.evaluate(() => {
        return (window as any).consentCertificate;
      });
      
      expect(certificate.certificateId).toBeDefined();
      expect(certificate.patientName).toBe(MEDICAL_RECORDING_DATA.patientInfo.name);
      expect(certificate.doctorName).toBeDefined();
      expect(certificate.sessionId).toBe(sessionId);
      expect(certificate.consentGranted).toBe(true);
      expect(certificate.legalBasis).toBe('informed_consent_hipaa');
      expect(certificate.hash).toBeDefined(); // Hash para integridad
      
      // Almacenar certificado en blockchain para inmutabilidad
      await expect(doctorPage.locator('[data-testid="blockchain-stored"]')).toBeVisible();
      
      logger.info('📄 Certificado de consentimiento almacenado de forma inmutable');
    });
  });

  test('🎥 Proceso de Grabación Segura', async () => {
    await test.step('📹 Iniciar grabación con indicadores claros', async () => {
      logger.info('🎥 Iniciando grabación médica segura...');
      
      // Doctor inicia grabación tras consentimiento
      await doctorPage.click('button:text("Iniciar Grabación Médica")');
      
      // Verificar indicadores visuales prominentes
      await Promise.all([
        expect(doctorPage.locator('[data-testid="recording-active-doctor"]')).toBeVisible(),
        expect(patientPage.locator('[data-testid="recording-active-patient"]')).toBeVisible()
      ]);
      
      // Verificar indicador de tiempo de grabación
      await expect(doctorPage.locator('[data-testid="recording-duration"]')).toBeVisible();
      
      // Verificar estado de encriptación en tiempo real
      await expect(doctorPage.locator('[data-testid="encryption-active"]')).toBeVisible();
      await expect(doctorPage.locator('text="AES-256-GCM activa"')).toBeVisible();
      
      recordingId = await doctorPage.locator('[data-testid="recording-id"]').textContent() || '';
      expect(recordingId).toBeDefined();
      
      logger.info(`🎥 Grabación iniciada con ID: ${recordingId}`);
    });

    await test.step('🔒 Validar encriptación en tiempo real', async () => {
      // Esperar algunos segundos para capturar datos
      await doctorPage.waitForTimeout(5000);
      
      // Verificar que el stream está encriptado
      const encryptionStatus = await doctorPage.evaluate(() => {
        return (window as any).recordingEncryption;
      });
      
      expect(encryptionStatus.algorithm).toBe(ENCRYPTION_STANDARD);
      expect(encryptionStatus.keyRotation).toBe(true);
      expect(encryptionStatus.streamEncrypted).toBe(true);
      expect(encryptionStatus.keyId).toBeDefined();
      
      // Verificar integridad de chunks de datos
      expect(encryptionStatus.chunksProcessed).toBeGreaterThan(0);
      expect(encryptionStatus.integrityChecks.passed).toBe(true);
      
      logger.info('🔒 Encriptación en tiempo real verificada:', {
        algoritmo: encryptionStatus.algorithm,
        chunks: encryptionStatus.chunksProcessed,
        integridad: encryptionStatus.integrityChecks.passed
      });
    });

    await test.step('🩺 Simulación de consulta médica real', async () => {
      // Doctor realiza examen médico completo documentado
      await doctorPage.fill('[data-testid="medical-history"]', 
        MEDICAL_RECORDING_DATA.sensitiveContent.familyHistory);
      
      await doctorPage.fill('[data-testid="current-diagnosis"]',
        MEDICAL_RECORDING_DATA.sensitiveContent.diagnosis);
      
      await doctorPage.click('button:text("Compartir Diagnóstico")');
      
      // Agregar prescripciones
      for (const medication of MEDICAL_RECORDING_DATA.sensitiveContent.medications) {
        await doctorPage.fill('[data-testid="medication-name"]', medication);
        await doctorPage.click('button:text("Agregar Medicamento")');
        await doctorPage.waitForTimeout(1000);
      }
      
      // Paciente hace preguntas médicas
      await patientPage.fill('[data-testid="patient-question"]', 
        '¿Por cuánto tiempo debo tomar el Clopidogrel? ¿Hay riesgo de sangrado?');
      await patientPage.click('button:text("Enviar Pregunta")');
      
      // Doctor responde con detalles médicos
      await doctorPage.fill('[data-testid="medical-response"]',
        'El Clopidogrel debe tomarse por 12 meses post-angioplastia. Riesgo de sangrado bajo con monitoreo.');
      
      await doctorPage.click('button:text("Responder")');
      
      // Verificar que todo el contenido médico se está grabando
      const recordingContent = await doctorPage.evaluate(() => {
        return (window as any).recordingContent;
      });
      
      expect(recordingContent.medicalDataCaptured).toBe(true);
      expect(recordingContent.prescriptionsCaptured).toBe(true);
      expect(recordingContent.patientInteractionsCaptured).toBe(true);
      
      logger.info('🩺 Consulta médica completa capturada en grabación');
    });
  });

  test('💾 Almacenamiento Seguro y Integridad', async () => {
    await test.step('⏹️ Finalización segura de grabación', async () => {
      logger.info('💾 Finalizando grabación con verificaciones de integridad...');
      
      // Doctor finaliza grabación  
      await doctorPage.click('button:text("Finalizar Grabación")');
      
      // Proceso de finalización segura
      await expect(doctorPage.locator('[data-testid="finalizing-recording"]')).toBeVisible();
      
      // Generar checksums y hashes de integridad
      await expect(doctorPage.locator('[data-testid="generating-checksums"]')).toBeVisible();
      
      // Verificar que se completa el procesamiento
      await expect(doctorPage.locator('[data-testid="recording-processing-complete"]')).toBeVisible({ 
        timeout: RECORDING_TIMEOUT 
      });
      
      // Obtener metadatos finales de la grabación
      const recordingMetadata = await doctorPage.evaluate(() => {
        return (window as any).finalRecordingMetadata;
      });
      
      expect(recordingMetadata.recordingId).toBe(recordingId);
      expect(recordingMetadata.duration).toBeGreaterThan(0);
      expect(recordingMetadata.fileSize).toBeGreaterThan(0);
      expect(recordingMetadata.fileSize).toBeLessThan(MAX_RECORDING_SIZE);
      expect(recordingMetadata.sha256Hash).toBeDefined();
      expect(recordingMetadata.encryptionKeyId).toBeDefined();
      expect(recordingMetadata.timestamp).toBeDefined();
      
      logger.info('💾 Grabación finalizada con metadatos completos:', {
        duracion: `${recordingMetadata.duration}ms`,
        tamaño: `${(recordingMetadata.fileSize / 1024 / 1024).toFixed(2)}MB`,
        hash: recordingMetadata.sha256Hash.substring(0, 16) + '...'
      });
    });

    await test.step('🏦 Almacenamiento en ubicaciones geográficamente distribuidas', async () => {
      // Verificar almacenamiento en múltiples ubicaciones
      const storageResponse = await doctorPage.request.get(
        `http://localhost:3001/api/v1/recordings/${recordingId}/storage-status`,
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          }
        }
      );
      
      expect(storageResponse.status()).toBe(200);
      const storage = await storageResponse.json();
      
      // Verificar almacenamiento principal en territorio nacional
      expect(storage.data.primaryLocation.country).toBe('Argentina');
      expect(storage.data.primaryLocation.stored).toBe(true);
      
      // Verificar backup geográficamente distribuido
      expect(storage.data.backupLocations).toBeDefined();
      expect(storage.data.backupLocations.length).toBeGreaterThanOrEqual(2);
      
      storage.data.backupLocations.forEach((backup: any) => {
        expect(backup.stored).toBe(true);
        expect(backup.integrityVerified).toBe(true);
        expect(backup.encrypted).toBe(true);
      });
      
      // Verificar que todas las copias tienen el mismo hash
      const hashes = [storage.data.primaryLocation.hash, ...storage.data.backupLocations.map((b: any) => b.hash)];
      const uniqueHashes = [...new Set(hashes)];
      expect(uniqueHashes.length).toBe(1);
      
      logger.info('🏦 Almacenamiento distribuido verificado:', {
        ubicacionPrimaria: storage.data.primaryLocation.region,
        backups: storage.data.backupLocations.length,
        integridadVerificada: true
      });
    });

    await test.step('🔐 Validar rotación de claves de encriptación', async () => {
      // Verificar que las claves se rotan mensualmente
      const encryptionResponse = await doctorPage.request.get(
        `http://localhost:3001/api/v1/recordings/${recordingId}/encryption-status`,
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          }
        }
      );
      
      expect(encryptionResponse.status()).toBe(200);
      const encryption = await encryptionResponse.json();
      
      expect(encryption.data.algorithm).toBe(ENCRYPTION_STANDARD);
      expect(encryption.data.keyRotationEnabled).toBe(true);
      expect(encryption.data.currentKeyGeneration).toBeGreaterThan(0);
      expect(encryption.data.nextRotationDate).toBeDefined();
      
      // Verificar que la próxima rotación es en menos de 30 días
      const nextRotation = new Date(encryption.data.nextRotationDate);
      const now = new Date();
      const daysDifference = (nextRotation.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDifference).toBeLessThanOrEqual(30);
      
      logger.info('🔐 Rotación de claves configurada correctamente:', {
        generacionActual: encryption.data.currentKeyGeneration,
        proximaRotacion: nextRotation.toLocaleDateString()
      });
    });
  });

  test('🔒 Control de Acceso Basado en Roles', async () => {
    await test.step('👨‍⚕️ Acceso del doctor propietario', async () => {
      logger.info('🔒 Validando control de acceso basado en roles...');
      
      // Doctor propietario puede ver y gestionar grabación
      await doctorPage.goto(`http://localhost:3002/recordings/${recordingId}`);
      
      // Verificar acceso completo
      await expect(doctorPage.locator('[data-testid="recording-player"]')).toBeVisible();
      await expect(doctorPage.locator('[data-testid="recording-controls"]')).toBeVisible();
      await expect(doctorPage.locator('button:text("Compartir")')).toBeVisible();
      await expect(doctorPage.locator('button:text("Descargar")')).toBeVisible();
      await expect(doctorPage.locator('button:text("Eliminar")')).toBeVisible();
      
      // Verificar metadatos médicos accesibles
      await expect(doctorPage.locator('[data-testid="medical-metadata"]')).toBeVisible();
      await expect(doctorPage.locator('text="Cardiología"')).toBeVisible();
      
      logger.info('✅ Doctor propietario tiene acceso completo');
    });

    await test.step('👩‍⚕️ Acceso de doctor consultor (permisos limitados)', async () => {
      // Cambiar a contexto de doctor consultor
      const consultantContext = await doctorContext.browser()!.newContext();
      const consultantPage = await consultantContext.newPage();
      
      try {
        await consultantPage.goto('http://localhost:3002');
        await authenticateAs(consultantPage, 'doctor', TEST_ROLES.doctor_consultant.email);
        
        await consultantPage.goto(`http://localhost:3002/recordings/${recordingId}`);
        
        // Verificar acceso limitado
        await expect(consultantPage.locator('[data-testid="recording-player"]')).toBeVisible();
        await expect(consultantPage.locator('[data-testid="recording-controls"]')).toBeVisible();
        
        // No debe poder compartir o eliminar
        await expect(consultantPage.locator('button:text("Compartir")')).not.toBeVisible();
        await expect(consultantPage.locator('button:text("Eliminar")')).not.toBeVisible();
        
        // Solo puede descargar para uso médico
        const downloadBtn = consultantPage.locator('button:text("Descargar")');
        if (await downloadBtn.isVisible()) {
          await downloadBtn.click();
          await expect(consultantPage.locator('[data-testid="medical-purpose-required"]')).toBeVisible();
        }
        
        logger.info('✅ Doctor consultor tiene permisos limitados correctos');
        
      } finally {
        await consultantContext.close();
      }
    });

    await test.step('👩‍⚕️ Acceso de enfermera (solo visualización)', async () => {
      const nurseContext = await doctorContext.browser()!.newContext();
      const nursePage = await nurseContext.newPage();
      
      try {
        await nursePage.goto('http://localhost:3002');
        await authenticateAs(nursePage, 'nurse', TEST_ROLES.nurse.email);
        
        await nursePage.goto(`http://localhost:3002/recordings/${recordingId}`);
        
        // Solo puede ver, no puede controlar
        await expect(nursePage.locator('[data-testid="recording-player"]')).toBeVisible();
        await expect(nursePage.locator('[data-testid="recording-controls"]')).not.toBeVisible();
        
        // No puede descargar, compartir o eliminar
        await expect(nursePage.locator('button:text("Descargar")')).not.toBeVisible();
        await expect(nursePage.locator('button:text("Compartir")')).not.toBeVisible();
        await expect(nursePage.locator('button:text("Eliminar")')).not.toBeVisible();
        
        logger.info('✅ Enfermera tiene acceso de solo lectura');
        
      } finally {
        await nurseContext.close();
      }
    });

    await test.step('🚫 Bloqueo de acceso no autorizado', async () => {
      const unauthorizedContext = await doctorContext.browser()!.newContext();
      const unauthorizedPage = await unauthorizedContext.newPage();
      
      try {
        await unauthorizedPage.goto('http://localhost:3002');
        
        // Intentar acceso sin autenticación
        await unauthorizedPage.goto(`http://localhost:3002/recordings/${recordingId}`);
        
        // Debe ser redirigido a login
        await expect(unauthorizedPage.locator('[data-testid="login-required"]')).toBeVisible();
        
        // Intentar con credenciales no autorizadas
        await unauthorizedPage.fill('[name="email"]', TEST_ROLES.unauthorized.email);
        await unauthorizedPage.fill('[name="password"]', 'fakepassword');
        await unauthorizedPage.click('button:text("Iniciar Sesión")');
        
        // Debe fallar la autenticación
        await expect(unauthorizedPage.locator('[data-testid="auth-failed"]')).toBeVisible();
        
        logger.info('🚫 Acceso no autorizado bloqueado correctamente');
        
      } finally {
        await unauthorizedContext.close();
      }
    });
  });

  test('⏰ Gestión de Retención y Derechos del Paciente', async () => {
    await test.step('📅 Política de retención HIPAA (7 años)', async () => {
      logger.info('📅 Validando política de retención HIPAA...');
      
      const retentionResponse = await doctorPage.request.get(
        `http://localhost:3001/api/v1/recordings/${recordingId}/retention-policy`,
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          }
        }
      );
      
      expect(retentionResponse.status()).toBe(200);
      const retention = await retentionResponse.json();
      
      expect(retention.data.retentionPeriodYears).toBe(HIPAA_RETENTION_YEARS);
      expect(retention.data.creationDate).toBeDefined();
      expect(retention.data.scheduledDeletionDate).toBeDefined();
      
      // Verificar que la fecha de eliminación es exactamente 7 años después
      const creationDate = new Date(retention.data.creationDate);
      const deletionDate = new Date(retention.data.scheduledDeletionDate);
      const yearsDifference = (deletionDate.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      expect(Math.abs(yearsDifference - HIPAA_RETENTION_YEARS)).toBeLessThan(0.1);
      
      // Verificar recordatorios programados
      expect(retention.data.reminderSchedule).toBeDefined();
      expect(retention.data.reminderSchedule.length).toBeGreaterThan(0);
      
      logger.info('📅 Política de retención configurada:', {
        periodoAnios: retention.data.retentionPeriodYears,
        eliminacionProgramada: deletionDate.toLocaleDateString(),
        recordatorios: retention.data.reminderSchedule.length
      });
    });

    await test.step('🔄 Derecho del paciente a revocar consentimiento', async () => {
      // Paciente solicita revocación de consentimiento
      await patientPage.goto(`http://localhost:3003/my-recordings`);
      
      // Encontrar la grabación específica
      await patientPage.click(`[data-testid="recording-${recordingId}"]`);
      
      // Opción para revocar consentimiento
      await expect(patientPage.locator('button:text("Revocar Consentimiento")')).toBeVisible();
      
      await patientPage.click('button:text("Revocar Consentimiento")');
      
      // Proceso de revocación informada
      await expect(patientPage.locator('[data-testid="revocation-consequences"]')).toBeVisible();
      await expect(patientPage.locator('text="eliminación inmediata"')).toBeVisible();
      await expect(patientPage.locator('text="no recuperable"')).toBeVisible();
      
      // Confirmar revocación
      await patientPage.fill('[data-testid="revocation-reason"]', 
        'Ya no deseo que se conserve esta grabación por razones personales');
      
      await patientPage.check('[name="understandConsequences"]');
      await patientPage.click('button:text("Confirmar Revocación")');
      
      // Verificar que se programa eliminación inmediata
      await expect(patientPage.locator('[data-testid="revocation-processed"]')).toBeVisible();
      
      const revocationData = await patientPage.evaluate(() => {
        return (window as any).consentRevocation;
      });
      
      expect(revocationData.recordingId).toBe(recordingId);
      expect(revocationData.revocationTimestamp).toBeDefined();
      expect(revocationData.immediateDelection).toBe(true);
      expect(revocationData.reason).toBeDefined();
      
      logger.info('🔄 Revocación de consentimiento procesada correctamente');
    });

    await test.step('🗑️ Eliminación segura certificada', async () => {
      // Esperar procesamiento de eliminación
      await doctorPage.waitForTimeout(5000);
      
      // Verificar que la grabación fue eliminada de forma segura
      const deletionResponse = await doctorPage.request.get(
        `http://localhost:3001/api/v1/recordings/${recordingId}/deletion-status`,
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          }
        }
      );
      
      expect(deletionResponse.status()).toBe(200);
      const deletion = await deletionResponse.json();
      
      expect(deletion.data.deleted).toBe(true);
      expect(deletion.data.deletionMethod).toBe('secure_overwrite');
      expect(deletion.data.certificateGenerated).toBe(true);
      expect(deletion.data.allCopiesDeleted).toBe(true);
      
      // Verificar certificado de destrucción
      expect(deletion.data.destructionCertificate.id).toBeDefined();
      expect(deletion.data.destructionCertificate.method).toBe('DOD_5220_22_M');
      expect(deletion.data.destructionCertificate.passes).toBeGreaterThanOrEqual(3);
      expect(deletion.data.destructionCertificate.verified).toBe(true);
      
      logger.info('🗑️ Eliminación segura certificada:', {
        metodo: deletion.data.deletionMethod,
        certificado: deletion.data.destructionCertificate.id,
        pasadas: deletion.data.destructionCertificate.passes
      });
    });

    await test.step('🔍 Verificar eliminación completa', async () => {
      // Intentar acceder a la grabación eliminada
      const accessResponse = await doctorPage.request.get(
        `http://localhost:3001/api/v1/recordings/${recordingId}`,
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          }
        }
      );
      
      expect(accessResponse.status()).toBe(404);
      
      // Verificar que tampoco existe en el frontend
      await doctorPage.goto(`http://localhost:3002/recordings/${recordingId}`);
      await expect(doctorPage.locator('[data-testid="recording-not-found"]')).toBeVisible();
      
      // Verificar que se mantiene log de auditoría de la eliminación
      const auditResponse = await doctorPage.request.get(
        `http://localhost:3001/api/v1/audit-logs/recording-deletion/${recordingId}`,
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          }
        }
      );
      
      expect(auditResponse.status()).toBe(200);
      const auditLog = await auditResponse.json();
      
      expect(auditLog.data.action).toBe('RECORDING_DELETED');
      expect(auditLog.data.reason).toBe('PATIENT_CONSENT_REVOKED');
      expect(auditLog.data.certified).toBe(true);
      
      logger.info('🔍 Eliminación completa verificada - solo queda audit trail');
    });
  });

  test('📊 Auditoría y Compliance Reporting', async () => {
    await test.step('📋 Generar reporte de compliance de grabaciones', async () => {
      logger.info('📊 Generando reporte de compliance de grabaciones...');
      
      const complianceResponse = await doctorPage.request.get(
        'http://localhost:3001/api/v1/recordings/compliance-report',
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          },
          params: {
            period: 'last_30_days',
            includeDeleted: 'true'
          }
        }
      );
      
      expect(complianceResponse.status()).toBe(200);
      const compliance = await complianceResponse.json();
      
      // Métricas de consentimiento
      expect(compliance.data.consent.totalRecordings).toBeGreaterThan(0);
      expect(compliance.data.consent.explicitConsentRate).toBe(100);
      expect(compliance.data.consent.documentedConsentRate).toBe(100);
      expect(compliance.data.consent.revocationRate).toBeDefined();
      
      // Métricas de encriptación
      expect(compliance.data.encryption.totalRecordings).toBeGreaterThan(0);
      expect(compliance.data.encryption.encryptionRate).toBe(100);
      expect(compliance.data.encryption.algorithmCompliance.aes256).toBe(100);
      expect(compliance.data.encryption.keyRotationCompliance).toBe(100);
      
      // Métricas de almacenamiento
      expect(compliance.data.storage.backupCompliance).toBe(100);
      expect(compliance.data.storage.integrityChecksPassed).toBe(100);
      expect(compliance.data.storage.geographicDistribution).toBe(true);
      
      // Métricas de acceso
      expect(compliance.data.access.unauthorizedAttempts).toBe(0);
      expect(compliance.data.access.auditTrailCompleteness).toBe(100);
      expect(compliance.data.access.roleBasedAccessCompliance).toBe(100);
      
      logger.info('📊 Reporte de compliance generado:', {
        consentimiento: `${compliance.data.consent.explicitConsentRate}%`,
        encriptacion: `${compliance.data.encryption.encryptionRate}%`,
        almacenamiento: `${compliance.data.storage.backupCompliance}%`,
        acceso: `${compliance.data.access.roleBasedAccessCompliance}%`
      });
    });

    await test.step('🏆 Certificación HIPAA de grabaciones', async () => {
      const certificationResponse = await doctorPage.request.get(
        'http://localhost:3001/api/v1/recordings/hipaa-certification',
        {
          headers: {
            'Authorization': `Bearer ${await doctorPage.evaluate(() => localStorage.getItem('auth-token'))}`
          }
        }
      );
      
      expect(certificationResponse.status()).toBe(200);
      const certification = await certificationResponse.json();
      
      // Verificar certificaciones requeridas
      expect(certification.data.hipaaCompliant).toBe(true);
      expect(certification.data.certificationLevel).toBe('FULL_COMPLIANCE');
      expect(certification.data.lastAuditDate).toBeDefined();
      expect(certification.data.nextAuditDue).toBeDefined();
      
      // Verificar controles técnicos
      expect(certification.data.technicalSafeguards.encryption).toBe('COMPLIANT');
      expect(certification.data.technicalSafeguards.accessControl).toBe('COMPLIANT');
      expect(certification.data.technicalSafeguards.auditControls).toBe('COMPLIANT');
      expect(certification.data.technicalSafeguards.integrityControl).toBe('COMPLIANT');
      
      // Verificar controles administrativos
      expect(certification.data.administrativeSafeguards.consentManagement).toBe('COMPLIANT');
      expect(certification.data.administrativeSafeguards.retentionPolicy).toBe('COMPLIANT');
      expect(certification.data.administrativeSafeguards.employeeTraining).toBe('COMPLIANT');
      
      // Verificar controles físicos
      expect(certification.data.physicalSafeguards.dataStorage).toBe('COMPLIANT');
      expect(certification.data.physicalSafeguards.mediaDisposal).toBe('COMPLIANT');
      
      logger.info('🏆 Certificación HIPAA confirmada:', {
        nivel: certification.data.certificationLevel,
        ultimaAuditoria: new Date(certification.data.lastAuditDate).toLocaleDateString(),
        proximaAuditoria: new Date(certification.data.nextAuditDue).toLocaleDateString()
      });
    });
  });
});

/**
 * 🛠️ HELPER FUNCTIONS PARA RECORDING COMPLIANCE
 */

async function setupRecordingMonitoring(page: Page) {
  await page.addInitScript(() => {
    (window as any).recordingCompliance = {
      consentData: null,
      encryptionStatus: null,
      storageMetrics: null,
      accessLogs: []
    };
    
    // Monitor de eventos de grabación
    (window as any).logRecordingEvent = (event: any) => {
      const compliance = (window as any).recordingCompliance;
      compliance.accessLogs.push({
        ...event,
        timestamp: Date.now()
      });
    };
  });
  
  logger.info('🔍 Monitoreo de compliance de grabaciones configurado');
}

// Validar fortaleza de hash SHA-256
function validateSHA256Hash(hash: string): boolean {
  const sha256Regex = /^[a-f0-9]{64}$/;
  return sha256Regex.test(hash);
}

// Calcular fecha de expiración HIPAA
function calculateHIPAAExpirationDate(creationDate: Date): Date {
  const expirationDate = new Date(creationDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + HIPAA_RETENTION_YEARS);
  return expirationDate;
}

// Generar certificado de destrucción
function generateDestructionCertificate(recordingId: string): any {
  return {
    id: `CERT-DEST-${recordingId}-${Date.now()}`,
    recordingId,
    method: 'DOD_5220_22_M', // Estándar DOD para eliminación segura
    passes: 3,
    timestamp: new Date().toISOString(),
    verified: true,
    hash: crypto.createHash('sha256').update(`${recordingId}-${Date.now()}`).digest('hex')
  };
}

/**
 * 📊 METADATA DE RECORDING COMPLIANCE TEST
 */
const RECORDING_COMPLIANCE_METADATA = {
  testType: 'recording_hipaa_compliance',
  criticality: 'critical',
  hipaaRequirements: HIPAA_RECORDING_REQUIREMENTS,
  complianceStandards: ['HIPAA', 'GDPR', 'CCPA', 'Argentina_PDPA'],
  technicalSafeguards: {
    encryption: ENCRYPTION_STANDARD,
    keyRotation: 'monthly',
    integrityChecking: 'continuous',
    accessControl: 'role_based'
  },
  administrativeSafeguards: {
    consentManagement: 'digital_signature',
    retentionPolicy: `${HIPAA_RETENTION_YEARS}_years`,
    employeeTraining: 'mandatory',
    auditTrail: 'immutable'
  },
  physicalSafeguards: {
    storage: 'geographically_distributed',
    backup: 'encrypted_redundant',
    disposal: 'dod_5220_22_m'
  }
};