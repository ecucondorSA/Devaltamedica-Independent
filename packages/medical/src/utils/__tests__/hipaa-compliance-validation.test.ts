/**
 * CRITICAL MEDICAL UNIT TESTS: Validación de Compliance HIPAA
 * 
 * ⚠️ CRITICAL: Violaciones HIPAA pueden causar:
 * - Multas de $50,000 a $1,500,000 por incidente
 * - Pérdida de licencia médica
 * - Demandas legales masivas
 * - Cierre de la práctica médica
 * - Prisión para casos graves
 * 
 * Este test DEBE garantizar 100% compliance con regulaciones HIPAA.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateHIPAACompliance,
  scanForPHI,
  validateDataEncryption,
  checkAccessControls,
  validateAuditTrail,
  checkConsentManagement,
  validateDataMinimization,
  validateBreachNotification,
  HIPAAComplianceError,
  type PHIData,
  type HIPAAValidation,
  type EncryptionStatus,
  type AccessControlCheck,
  type AuditLogEntry,
  type ConsentRecord,
  type DataMinimizationCheck
} from '../hipaa-compliance-validation'

describe('CRITICAL: Validador de Compliance HIPAA', () => {
  let samplePHI: PHIData
  let sampleNonPHI: any
  let sampleUserAccess: any
  let sampleAuditLog: AuditLogEntry[]

  beforeEach(() => {
    // Datos que contienen PHI (Protected Health Information)
    samplePHI = {
      patientId: 'P123456789',
      name: 'John Smith',
      dateOfBirth: '1985-03-15',
      ssn: '123-45-6789',
      phoneNumber: '(555) 123-4567',
      email: 'john.smith@email.com',
      address: {
        street: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101'
      },
      medicalRecordNumber: 'MRN789012',
      insuranceId: 'INS456789',
      emergencyContact: {
        name: 'Jane Smith',
        relationship: 'spouse',
        phone: '(555) 987-6543'
      },
      medicalData: {
        conditions: ['diabetes_type_2', 'hypertension'],
        medications: ['metformin', 'lisinopril'],
        allergies: ['penicillin'],
        vitals: {
          bloodPressure: { systolic: 140, diastolic: 90 },
          heartRate: 78
        }
      }
    }

    // Datos que NO contienen PHI
    sampleNonPHI = {
      systemId: 'SYS001',
      timestamp: '2025-08-11T14:30:00Z',
      applicationVersion: '1.2.3',
      serverLocation: 'datacenter-east',
      performanceMetrics: {
        responseTime: 150,
        throughput: 1000
      },
      anonymizedStats: {
        totalPatients: 5000,
        averageAge: 45,
        commonConditions: ['hypertension', 'diabetes']
      }
    }

    // Datos de acceso de usuario
    sampleUserAccess = {
      userId: 'USER123',
      role: 'physician',
      accessLevel: 'full',
      department: 'cardiology',
      lastLogin: '2025-08-11T10:00:00Z',
      permissions: ['read_phi', 'write_phi', 'delete_records']
    }

    // Log de auditoría sample
    sampleAuditLog = [
      {
        timestamp: '2025-08-11T14:30:00Z',
        userId: 'USER123',
        action: 'access_patient_record',
        resourceId: 'P123456789',
        resourceType: 'patient_record',
        ipAddress: '192.168.1.100',
        outcome: 'success',
        details: 'Accessed patient medical history'
      },
      {
        timestamp: '2025-08-11T14:25:00Z',
        userId: 'USER456',
        action: 'modify_patient_data',
        resourceId: 'P123456789',
        resourceType: 'patient_record',
        ipAddress: '192.168.1.101',
        outcome: 'success',
        details: 'Updated medication list'
      }
    ]
  })

  describe('Detección de PHI (Protected Health Information)', () => {
    it('debe detectar TODOS los identificadores PHI directos', () => {
      const phiScan = scanForPHI(samplePHI)

      expect(phiScan.containsPHI).toBe(true)
      expect(phiScan.identifiedPHI).toContainEqual({
        type: 'name',
        value: 'John Smith',
        location: 'name',
        riskLevel: 'high'
      })
      
      expect(phiScan.identifiedPHI).toContainEqual({
        type: 'ssn',
        value: '123-45-6789',
        location: 'ssn',
        riskLevel: 'critical'
      })

      expect(phiScan.identifiedPHI).toContainEqual({
        type: 'phone_number',
        value: '(555) 123-4567',
        location: 'phoneNumber',
        riskLevel: 'medium'
      })

      expect(phiScan.identifiedPHI).toContainEqual({
        type: 'email',
        value: 'john.smith@email.com',
        location: 'email',
        riskLevel: 'medium'
      })

      expect(phiScan.identifiedPHI).toContainEqual({
        type: 'date_of_birth',
        value: '1985-03-15',
        location: 'dateOfBirth',
        riskLevel: 'high'
      })
    })

    it('debe detectar PHI en texto libre y campos anidados', () => {
      const textWithPHI = {
        clinicalNotes: "Patient John Smith (DOB: 03/15/1985) visited today. SSN: 123-45-6789. Phone: 555-123-4567. Lives at 123 Main St, Boston MA 02101.",
        prescription: {
          instructions: "Call patient at (555) 123-4567 if issues arise",
          pharmacy: {
            address: "456 Oak St, Boston MA 02101"
          }
        }
      }

      const phiScan = scanForPHI(textWithPHI)

      expect(phiScan.containsPHI).toBe(true)
      expect(phiScan.identifiedPHI.length).toBeGreaterThanOrEqual(5)
      
      // Debe detectar nombre en texto libre
      expect(phiScan.identifiedPHI).toContainEqual(
        expect.objectContaining({
          type: 'name',
          value: expect.stringContaining('John Smith')
        })
      )

      // Debe detectar fecha en formato diferente
      expect(phiScan.identifiedPHI).toContainEqual(
        expect.objectContaining({
          type: 'date_of_birth',
          value: expect.stringMatching(/03\/15\/1985/)
        })
      )
    })

    it('debe NO detectar falsos positivos en datos no-PHI', () => {
      const phiScan = scanForPHI(sampleNonPHI)

      expect(phiScan.containsPHI).toBe(false)
      expect(phiScan.identifiedPHI).toHaveLength(0)
      expect(phiScan.safeForLogging).toBe(true)
      expect(phiScan.safeForAnalytics).toBe(true)
    })

    it('debe detectar quasi-identifiers que combinados forman PHI', () => {
      const quasiIdentifiers = {
        zipCode: '02101',
        age: 39,
        gender: 'male',
        race: 'caucasian',
        medicalCondition: 'rare_genetic_disorder'
      }

      const phiScan = scanForPHI(quasiIdentifiers, { checkQuasiIdentifiers: true })

      expect(phiScan.quasiIdentifierRisk).toBe('high')
      expect(phiScan.reidentificationRisk).toBeGreaterThan(0.33) // >33% risk
      expect(phiScan.recommendedAction).toBe('additional_de_identification_required')
    })
  })

  describe('Validación de Encriptación de Datos', () => {
    it('debe validar encriptación AES-256 para PHI en reposo', () => {
      const encryptionStatus = validateDataEncryption({
        data: samplePHI,
        storageLocation: 'database',
        encryptionMethod: 'AES-256-GCM'
      })

      expect(encryptionStatus.isEncrypted).toBe(true)
      expect(encryptionStatus.algorithm).toBe('AES-256-GCM')
      expect(encryptionStatus.keyLength).toBe(256)
      expect(encryptionStatus.hipaaCompliant).toBe(true)
      expect(encryptionStatus.fipsValidated).toBe(true)
    })

    it('debe rechazar métodos de encriptación débiles', () => {
      expect(() => validateDataEncryption({
        data: samplePHI,
        encryptionMethod: 'DES' // Débil
      })).toThrow(HIPAAComplianceError)

      expect(() => validateDataEncryption({
        data: samplePHI,
        encryptionMethod: 'AES-128-ECB' // Modo inseguro
      })).toThrow('Encryption method does not meet HIPAA requirements')
    })

    it('debe validar encriptación en tránsito (TLS 1.3)', () => {
      const transmissionSecurity = validateDataEncryption({
        data: samplePHI,
        transmissionMethod: 'HTTPS',
        tlsVersion: '1.3',
        cipherSuite: 'TLS_AES_256_GCM_SHA384'
      })

      expect(transmissionSecurity.transmissionEncrypted).toBe(true)
      expect(transmissionSecurity.tlsVersion).toBe('1.3')
      expect(transmissionSecurity.perfectForwardSecrecy).toBe(true)
      expect(transmissionSecurity.certificateValidation).toBe('valid')
    })

    it('debe validar gestión segura de claves de encriptación', () => {
      const keyManagement = validateDataEncryption({
        data: samplePHI,
        keyManagementSystem: 'AWS_KMS',
        keyRotationPeriod: '90_days',
        keyAccessLogs: true
      })

      expect(keyManagement.keyManagementCompliant).toBe(true)
      expect(keyManagement.keyRotation.enabled).toBe(true)
      expect(keyManagement.keyRotation.periodDays).toBeLessThanOrEqual(90)
      expect(keyManagement.keyAccessControlled).toBe(true)
    })
  })

  describe('Control de Acceso y Autorización', () => {
    it('debe validar principio de menor privilegio', () => {
      const accessCheck = checkAccessControls({
        user: sampleUserAccess,
        requestedResource: 'patient_record',
        requestedAction: 'read',
        resourceId: 'P123456789'
      })

      expect(accessCheck.accessGranted).toBe(true)
      expect(accessCheck.principle).toBe('least_privilege_validated')
      expect(accessCheck.justification).toBe('physician_role_requires_patient_access')
      expect(accessCheck.temporaryAccess).toBe(false)
    })

    it('debe rechazar acceso no autorizado a PHI', () => {
      const unauthorizedUser = {
        ...sampleUserAccess,
        role: 'janitor',
        permissions: ['building_access']
      }

      const accessCheck = checkAccessControls({
        user: unauthorizedUser,
        requestedResource: 'patient_record',
        requestedAction: 'read',
        resourceId: 'P123456789'
      })

      expect(accessCheck.accessGranted).toBe(false)
      expect(accessCheck.denialReason).toBe('insufficient_permissions')
      expect(accessCheck.logSecurityEvent).toBe(true)
      expect(accessCheck.alertSecurityTeam).toBe(true)
    })

    it('debe validar autenticación multi-factor para acceso crítico', () => {
      const criticalAccessRequest = {
        user: sampleUserAccess,
        requestedResource: 'bulk_patient_export',
        requestedAction: 'export',
        dataVolume: 'high'
      }

      const accessCheck = checkAccessControls(criticalAccessRequest)

      expect(accessCheck.mfaRequired).toBe(true)
      expect(accessCheck.additionalApprovalRequired).toBe(true)
      expect(accessCheck.supervisorApproval).toBe(true)
      expect(accessCheck.businessJustificationRequired).toBe(true)
    })

    it('debe implementar controles de acceso basados en roles (RBAC)', () => {
      const roles = ['physician', 'nurse', 'admin', 'patient']
      const resources = ['patient_record', 'medication_orders', 'lab_results', 'billing_info']

      roles.forEach(role => {
        resources.forEach(resource => {
          const user = { ...sampleUserAccess, role }
          const check = checkAccessControls({
            user,
            requestedResource: resource,
            requestedAction: 'read'
          })

          expect(check.rbacValidation).toBeTruthy()
          expect(check.rolePermissions).toBeDefined()
        })
      })
    })

    it('debe validar expiración de sesiones y timeouts', () => {
      const sessionCheck = checkAccessControls({
        user: {
          ...sampleUserAccess,
          sessionStart: '2025-08-11T10:00:00Z',
          lastActivity: '2025-08-11T10:45:00Z', // 45 minutos de inactividad
          sessionTimeout: '30_minutes'
        },
        currentTime: '2025-08-11T11:16:00Z'
      })

      expect(sessionCheck.sessionValid).toBe(false)
      expect(sessionCheck.sessionExpired).toBe(true)
      expect(sessionCheck.timeoutReason).toBe('inactivity_timeout')
      expect(sessionCheck.reauthenticationRequired).toBe(true)
    })
  })

  describe('Validación de Audit Trail (Pista de Auditoría)', () => {
    it('debe validar completitud del log de auditoría', () => {
      const auditValidation = validateAuditTrail(sampleAuditLog)

      expect(auditValidation.complete).toBe(true)
      expect(auditValidation.requiredFieldsPresent).toBe(true)
      
      sampleAuditLog.forEach(entry => {
        expect(entry.timestamp).toBeDefined()
        expect(entry.userId).toBeDefined()
        expect(entry.action).toBeDefined()
        expect(entry.resourceId).toBeDefined()
        expect(entry.outcome).toBeDefined()
        expect(entry.ipAddress).toBeDefined()
      })
    })

    it('debe detectar gaps en el audit trail', () => {
      const auditLogWithGaps = [
        {
          timestamp: '2025-08-11T14:30:00Z',
          userId: 'USER123',
          action: 'access_patient_record',
          resourceId: 'P123456789',
          outcome: 'success'
        },
        {
          timestamp: '2025-08-11T16:45:00Z', // Gap de 2+ horas
          userId: 'USER123',
          action: 'modify_patient_data',
          resourceId: 'P123456789',
          outcome: 'success'
        }
      ]

      const auditValidation = validateAuditTrail(auditLogWithGaps, {
        detectGaps: true,
        maxGapMinutes: 60
      })

      expect(auditValidation.hasGaps).toBe(true)
      expect(auditValidation.gaps).toHaveLength(1)
      expect(auditValidation.gaps[0].duration).toBe(135) // minutos
      expect(auditValidation.complianceRisk).toBe('medium')
    })

    it('debe validar integridad del audit log (no modificación)', () => {
      const auditWithHashes = sampleAuditLog.map(entry => ({
        ...entry,
        hash: 'sha256_hash_of_entry',
        previousHash: 'sha256_hash_of_previous_entry'
      }))

      const integrityCheck = validateAuditTrail(auditWithHashes, {
        validateIntegrity: true
      })

      expect(integrityCheck.integrityValidated).toBe(true)
      expect(integrityCheck.hashChainValid).toBe(true)
      expect(integrityCheck.tampering).toBe(false)
    })

    it('debe retener logs por período requerido (6 años)', () => {
      const oldAuditEntry = {
        timestamp: '2018-08-11T14:30:00Z', // 7 años atrás
        userId: 'USER123',
        action: 'access_patient_record',
        resourceId: 'P123456789',
        retentionPolicy: '6_years'
      }

      const retentionCheck = validateAuditTrail([oldAuditEntry], {
        validateRetention: true
      })

      expect(retentionCheck.retentionCompliant).toBe(false)
      expect(retentionCheck.expiredEntries).toHaveLength(1)
      expect(retentionCheck.archiveRequired).toBe(true)
    })
  })

  describe('Gestión de Consentimiento', () => {
    it('debe validar consentimiento válido para uso de PHI', () => {
      const consentRecord: ConsentRecord = {
        patientId: 'P123456789',
        consentType: 'treatment_payment_operations',
        dateGranted: '2025-01-15T10:00:00Z',
        expirationDate: '2026-01-15T10:00:00Z',
        scope: ['treatment', 'payment', 'healthcare_operations'],
        patientSignature: 'digital_signature_hash',
        witnessSignature: 'witness_signature_hash',
        consentMethod: 'electronic_signature',
        revokedDate: null
      }

      const consentValidation = checkConsentManagement({
        patientId: 'P123456789',
        requestedUse: 'treatment',
        consentRecord
      })

      expect(consentValidation.consentValid).toBe(true)
      expect(consentValidation.scopeCovers).toBe(true)
      expect(consentValidation.notExpired).toBe(true)
      expect(consentValidation.notRevoked).toBe(true)
      expect(consentValidation.authorizedUse).toBe(true)
    })

    it('debe rechazar uso sin consentimiento apropiado', () => {
      const consentRecord: ConsentRecord = {
        patientId: 'P123456789',
        consentType: 'treatment_only',
        scope: ['treatment'],
        dateGranted: '2025-01-15T10:00:00Z',
        expirationDate: '2026-01-15T10:00:00Z',
        revokedDate: null
      }

      const consentValidation = checkConsentManagement({
        patientId: 'P123456789',
        requestedUse: 'marketing', // No autorizado
        consentRecord
      })

      expect(consentValidation.consentValid).toBe(false)
      expect(consentValidation.scopeCovers).toBe(false)
      expect(consentValidation.denialReason).toBe('use_not_in_consent_scope')
      expect(consentValidation.requiresNewConsent).toBe(true)
    })

    it('debe manejar revocación de consentimiento', () => {
      const revokedConsent: ConsentRecord = {
        patientId: 'P123456789',
        consentType: 'treatment_payment_operations',
        dateGranted: '2025-01-15T10:00:00Z',
        revokedDate: '2025-08-01T14:00:00Z', // Revocado
        revocationMethod: 'written_request',
        scope: ['treatment', 'payment']
      }

      const consentValidation = checkConsentManagement({
        patientId: 'P123456789',
        requestedUse: 'treatment',
        consentRecord: revokedConsent,
        requestDate: '2025-08-11T14:30:00Z' // Después de revocación
      })

      expect(consentValidation.consentValid).toBe(false)
      expect(consentValidation.notRevoked).toBe(false)
      expect(consentValidation.revoked).toBe(true)
      expect(consentValidation.emergencyOverride).toBe(false) // Solo en emergencias
    })
  })

  describe('Minimización de Datos', () => {
    it('debe validar que solo datos necesarios son recolectados', () => {
      const dataRequest = {
        patientId: 'P123456789',
        requestedFields: ['name', 'dateOfBirth', 'medicalHistory', 'ssn', 'mothersMaidenName'],
        purpose: 'schedule_appointment'
      }

      const minimizationCheck = validateDataMinimization(dataRequest)

      expect(minimizationCheck.compliant).toBe(false)
      expect(minimizationCheck.unnecessaryFields).toContain('ssn')
      expect(minimizationCheck.unnecessaryFields).toContain('mothersMaidenName')
      expect(minimizationCheck.necessaryFields).toContain('name')
      expect(minimizationCheck.necessaryFields).toContain('dateOfBirth')
      expect(minimizationCheck.recommendedFields).not.toContain('ssn')
    })

    it('debe validar período de retención apropiado', () => {
      const retentionCheck = validateDataMinimization({
        dataType: 'medical_records',
        creationDate: '2018-01-01T00:00:00Z',
        lastAccessed: '2020-06-15T10:00:00Z',
        retentionPeriod: '6_years',
        currentDate: '2025-08-11T14:30:00Z'
      })

      expect(retentionCheck.retentionExpired).toBe(true)
      expect(retentionCheck.shouldDelete).toBe(true)
      expect(retentionCheck.daysPastRetention).toBeGreaterThan(180)
      expect(retentionCheck.complianceRisk).toBe('high')
    })
  })

  describe('Notificación de Brechas (Breach Notification)', () => {
    it('debe detectar brecha de seguridad y generar notificación', () => {
      const securityIncident = {
        incidentId: 'INC-2025-001',
        incidentType: 'unauthorized_access',
        affectedRecords: 150,
        phiExposed: true,
        discoveryDate: '2025-08-11T09:00:00Z',
        incidentDate: '2025-08-10T15:30:00Z',
        containmentDate: '2025-08-11T11:00:00Z',
        cause: 'stolen_laptop',
        encryptionStatus: 'unencrypted'
      }

      const breachNotification = validateBreachNotification(securityIncident)

      expect(breachNotification.isBreachNotifiable).toBe(true) // >500 registros O unencrypted
      expect(breachNotification.notificationRequired).toBe(true)
      expect(breachNotification.timelineCompliance).toMatchObject({
        hhs_notification_due: '2025-08-13T09:00:00Z', // 60 días
        media_notification_due: '2025-08-13T09:00:00Z', // Inmediato para >500
        individual_notification_due: '2025-09-10T09:00:00Z' // 60 días
      })
    })

    it('debe NO requerir notificación para brechas menores encriptadas', () => {
      const minorIncident = {
        incidentId: 'INC-2025-002',
        incidentType: 'accidental_disclosure',
        affectedRecords: 50,
        phiExposed: true,
        encryptionStatus: 'encrypted_aes256',
        riskAssessment: 'low_probability_compromise'
      }

      const breachNotification = validateBreachNotification(minorIncident)

      expect(breachNotification.isBreachNotifiable).toBe(false)
      expect(breachNotification.notificationRequired).toBe(false)
      expect(breachNotification.exemptionReason).toBe('encrypted_data_low_risk')
      expect(breachNotification.documentationRequired).toBe(true) // Aún debe documentar
    })
  })

  describe('Compliance General HIPAA', () => {
    it('debe realizar validación completa de compliance HIPAA', () => {
      const medicalSystemData = {
        patientData: samplePHI,
        userAccess: sampleUserAccess,
        auditLog: sampleAuditLog,
        encryptionStatus: { algorithm: 'AES-256-GCM', encrypted: true },
        accessControls: { rbac: true, mfa: true },
        consentManagement: { valid: true, current: true }
      }

      const complianceValidation = validateHIPAACompliance(medicalSystemData)

      expect(complianceValidation.isCompliant).toBe(true)
      expect(complianceValidation.complianceScore).toBeGreaterThanOrEqual(95) // >95%
      
      expect(complianceValidation.administrativeSafeguards).toBe('compliant')
      expect(complianceValidation.physicalSafeguards).toBe('compliant')  
      expect(complianceValidation.technicalSafeguards).toBe('compliant')
      
      expect(complianceValidation.violations).toHaveLength(0)
      expect(complianceValidation.recommendedActions).toHaveLength(0)
    })

    it('debe identificar múltiples violaciones de compliance', () => {
      const nonCompliantSystem = {
        patientData: samplePHI,
        encryptionStatus: { algorithm: 'DES', encrypted: false }, // Violación
        accessControls: { rbac: false, mfa: false }, // Violación
        auditLog: [], // Violación - no audit
        consentManagement: { valid: false }, // Violación
        dataRetention: { expired: true, notDeleted: true } // Violación
      }

      const complianceValidation = validateHIPAACompliance(nonCompliantSystem)

      expect(complianceValidation.isCompliant).toBe(false)
      expect(complianceValidation.complianceScore).toBeLessThan(50) // <50%
      expect(complianceValidation.violations.length).toBeGreaterThanOrEqual(5)
      
      expect(complianceValidation.violations).toContainEqual(
        expect.objectContaining({
          type: 'encryption_violation',
          severity: 'critical'
        })
      )
      
      expect(complianceValidation.violations).toContainEqual(
        expect.objectContaining({
          type: 'access_control_violation',
          severity: 'high'
        })
      )

      expect(complianceValidation.riskLevel).toBe('critical')
      expect(complianceValidation.finesRisk).toBeGreaterThan(50000) // >$50K
    })

    it('debe generar plan de remediación para violaciones', () => {
      const partialCompliantSystem = {
        patientData: samplePHI,
        encryptionStatus: { algorithm: 'AES-128', encrypted: true }, // Débil pero aceptable
        accessControls: { rbac: true, mfa: false }, // MFA missing
        auditLog: [{ basic: 'log' }], // Incomplete
        dataRetention: { reviewing: true }
      }

      const complianceValidation = validateHIPAACompliance(partialCompliantSystem)

      expect(complianceValidation.recommendedActions).toContainEqual(
        expect.objectContaining({
          priority: 'high',
          action: 'implement_mfa',
          timeline: '30_days'
        })
      )

      expect(complianceValidation.recommendedActions).toContainEqual(
        expect.objectContaining({
          priority: 'medium',
          action: 'enhance_audit_logging',
          timeline: '60_days'
        })
      )

      expect(complianceValidation.estimatedRemediationCost).toBeLessThan(25000)
      expect(complianceValidation.estimatedRemediationTime).toBe('90_days')
    })
  })

  describe('Performance y Escalabilidad', () => {
    it('debe completar validación HIPAA en <2 segundos', async () => {
      const startTime = performance.now()
      
      const validation = await validateHIPAACompliance({
        patientData: samplePHI,
        userAccess: sampleUserAccess,
        auditLog: sampleAuditLog
      })
      
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(2000) // <2 segundos
      expect(validation).toBeDefined()
    })

    it('debe manejar validación masiva de registros', async () => {
      const massiveDataset = Array(1000).fill(null).map((_, i) => ({
        patientId: `P${i.toString().padStart(6, '0')}`,
        data: { ...samplePHI, patientId: `P${i}` }
      }))

      const startTime = performance.now()
      
      const validations = await Promise.all(
        massiveDataset.map(record => 
          validateHIPAACompliance({ patientData: record.data })
        )
      )
      
      const endTime = performance.now()

      expect(validations).toHaveLength(1000)
      expect(endTime - startTime).toBeLessThan(30000) // <30 segundos para 1000 registros
    })
  })

  describe('Casos Edge y Emergencias', () => {
    it('debe permitir acceso de emergencia con override y audit', () => {
      const emergencyAccess = checkAccessControls({
        user: { role: 'emergency_physician', permissions: [] },
        requestedResource: 'patient_record',
        emergencyOverride: true,
        emergencyJustification: 'patient_cardiac_arrest',
        currentTime: '2025-08-11T02:30:00Z' // Fuera de horario
      })

      expect(emergencyAccess.accessGranted).toBe(true)
      expect(emergencyAccess.emergencyAccess).toBe(true)
      expect(emergencyAccess.requiresPostEmergencyReview).toBe(true)
      expect(emergencyAccess.auditFlag).toBe('emergency_access')
      expect(emergencyAccess.supervisorNotification).toBe(true)
    })

    it('debe manejar corte de sistema manteniendo compliance', () => {
      const systemOutage = {
        auditSystemDown: true,
        encryptionSystemDown: false,
        accessControlSystemDown: true,
        backupSystemsActive: true
      }

      const complianceValidation = validateHIPAACompliance({
        systemStatus: systemOutage,
        patientData: samplePHI
      })

      expect(complianceValidation.contingencyMode).toBe(true)
      expect(complianceValidation.backupCompliance).toBe(true)
      expect(complianceValidation.manualProcessesRequired).toBe(true)
      expect(complianceValidation.postOutageActions).toContain('audit_reconciliation')
    })
  })
})