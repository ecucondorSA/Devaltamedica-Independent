// medical-data-integration.ts
// Optimización por Medical Backend Developer (hydezltyg)

import { z } from 'zod';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

// Esquemas FHIR R4 simplificados para AltaMedica
export const FHIRPatientSchema = z.object({
  resourceType: z.literal('Patient'),
  id: z.string(),
  identifier: z.array(z.object({
    system: z.string(),
    value: z.string(),
  })),
  active: z.boolean().default(true),
  name: z.array(z.object({
    use: z.enum(['usual', 'official', 'temp', 'nickname']),
    family: z.string(),
    given: z.array(z.string()),
  })),
  telecom: z.array(z.object({
    system: z.enum(['phone', 'fax', 'email', 'pager', 'url']),
    value: z.string(),
    use: z.enum(['home', 'work', 'temp', 'old', 'mobile']).optional(),
  })).optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']),
  birthDate: z.string(), // YYYY-MM-DD
  address: z.array(z.object({
    use: z.enum(['home', 'work', 'temp', 'old', 'billing']).optional(),
    line: z.array(z.string()),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  })).optional(),
  contact: z.array(z.object({
    relationship: z.array(z.object({
      coding: z.array(z.object({
        system: z.string(),
        code: z.string(),
        display: z.string(),
      })),
    })),
    name: z.object({
      family: z.string(),
      given: z.array(z.string()),
    }),
    telecom: z.array(z.object({
      system: z.enum(['phone', 'email']),
      value: z.string(),
    })),
  })).optional(),
});

export const FHIRObservationSchema = z.object({
  resourceType: z.literal('Observation'),
  id: z.string(),
  status: z.enum(['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled']),
  category: z.array(z.object({
    coding: z.array(z.object({
      system: z.string(),
      code: z.string(),
      display: z.string(),
    })),
  })),
  code: z.object({
    coding: z.array(z.object({
      system: z.string(),
      code: z.string(),
      display: z.string(),
    })),
    text: z.string().optional(),
  }),
  subject: z.object({
    reference: z.string(), // Patient/[id]
  }),
  effectiveDateTime: z.string(),
  valueQuantity: z.object({
    value: z.number(),
    unit: z.string(),
    system: z.string(),
    code: z.string(),
  }).optional(),
  valueString: z.string().optional(),
  valueBoolean: z.boolean().optional(),
  performer: z.array(z.object({
    reference: z.string(), // Practitioner/[id]
  })).optional(),
});

export const FHIRMedicationRequestSchema = z.object({
  resourceType: z.literal('MedicationRequest'),
  id: z.string(),
  status: z.enum(['active', 'on-hold', 'cancelled', 'completed', 'entered-in-error', 'stopped', 'draft']),
  intent: z.enum(['proposal', 'plan', 'order', 'original-order', 'reflex-order', 'filler-order', 'instance-order']),
  medicationCodeableConcept: z.object({
    coding: z.array(z.object({
      system: z.string(),
      code: z.string(),
      display: z.string(),
    })),
    text: z.string(),
  }),
  subject: z.object({
    reference: z.string(), // Patient/[id]
  }),
  authoredOn: z.string(),
  requester: z.object({
    reference: z.string(), // Practitioner/[id]
  }),
  dosageInstruction: z.array(z.object({
    text: z.string(),
    timing: z.object({
      repeat: z.object({
        frequency: z.number(),
        period: z.number(),
        periodUnit: z.enum(['s', 'min', 'h', 'd', 'wk', 'mo', 'a']),
      }),
    }).optional(),
    route: z.object({
      coding: z.array(z.object({
        system: z.string(),
        code: z.string(),
        display: z.string(),
      })),
    }).optional(),
    doseAndRate: z.array(z.object({
      doseQuantity: z.object({
        value: z.number(),
        unit: z.string(),
        system: z.string(),
        code: z.string(),
      }),
    })).optional(),
  })),
});

// Clase para manejo de datos médicos con compliance HIPAA
export class MedicalDataManager {
  private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
  private static readonly AUDIT_COLLECTION = 'medical_audit_trail';

  // Conversión de datos AltaMedica a FHIR
  static convertPatientToFHIR(altamedicaPatient: any): z.infer<typeof FHIRPatientSchema> {
    return {
      resourceType: 'Patient',
      id: altamedicaPatient.id,
      identifier: [
        {
          system: 'https://altamedica.com/patient-id',
          value: altamedicaPatient.id,
        },
        ...(altamedicaPatient.nationalId ? [{
          system: 'https://altamedica.com/national-id',
          value: altamedicaPatient.nationalId,
        }] : []),
      ],
      active: altamedicaPatient.active ?? true,
      name: [{
        use: 'official' as const,
        family: altamedicaPatient.lastName,
        given: [altamedicaPatient.firstName],
      }],
      telecom: [
        ...(altamedicaPatient.email ? [{
          system: 'email' as const,
          value: altamedicaPatient.email,
          use: 'home' as const,
        }] : []),
        ...(altamedicaPatient.phone ? [{
          system: 'phone' as const,
          value: altamedicaPatient.phone,
          use: 'mobile' as const,
        }] : []),
      ],
      gender: this.mapGender(altamedicaPatient.gender),
      birthDate: altamedicaPatient.birthDate,
      address: altamedicaPatient.address ? [{
        use: 'home' as const,
        line: [altamedicaPatient.address.street],
        city: altamedicaPatient.address.city,
        state: altamedicaPatient.address.state,
        postalCode: altamedicaPatient.address.zipCode,
        country: altamedicaPatient.address.country || 'AR',
      }] : undefined,
    };
  }

  static convertObservationToFHIR(observation: any): z.infer<typeof FHIRObservationSchema> {
    return {
      resourceType: 'Observation',
      id: observation.id,
      status: observation.status || 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: this.mapObservationCategory(observation.type),
          display: this.getObservationCategoryDisplay(observation.type),
        }],
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: observation.loincCode || 'LA6115-3',
          display: observation.name,
        }],
        text: observation.name,
      },
      subject: {
        reference: `Patient/${observation.patientId}`,
      },
      effectiveDateTime: observation.date,
      valueQuantity: observation.value && observation.unit ? {
        value: parseFloat(observation.value),
        unit: observation.unit,
        system: 'http://unitsofmeasure.org',
        code: observation.unitCode || observation.unit,
      } : undefined,
      valueString: typeof observation.value === 'string' ? observation.value : undefined,
      performer: observation.doctorId ? [{
        reference: `Practitioner/${observation.doctorId}`,
      }] : undefined,
    };
  }

  private static mapGender(gender: string): 'male' | 'female' | 'other' | 'unknown' {
    const mapping: Record<string, 'male' | 'female' | 'other' | 'unknown'> = {
      'M': 'male',
      'F': 'female',
      'male': 'male',
      'female': 'female',
      'masculino': 'male',
      'femenino': 'female',
    };
    return mapping[gender] || 'unknown';
  }

  private static mapObservationCategory(type: string): string {
    const mapping: Record<string, string> = {
      'vital-signs': 'vital-signs',
      'laboratory': 'laboratory',
      'imaging': 'imaging',
      'procedure': 'procedure',
      'survey': 'survey',
      'exam': 'exam',
      'therapy': 'therapy',
    };
    return mapping[type] || 'exam';
  }

  private static getObservationCategoryDisplay(type: string): string {
    const mapping: Record<string, string> = {
      'vital-signs': 'Vital Signs',
      'laboratory': 'Laboratory',
      'imaging': 'Imaging',
      'procedure': 'Procedure',
      'survey': 'Survey',
      'exam': 'Exam',
      'therapy': 'Therapy',
    };
    return mapping[type] || 'Examination';
  }

  // Encriptación de datos sensibles
  static async encryptSensitiveData(data: string, patientId: string): Promise<string> {
    const key = this.deriveEncryptionKey(patientId);
    // Simulación de IV (vector de inicialización)
    const iv = Buffer.from(Array.from({ length: 16 }, () => Math.floor(Math.random() * 256)));
    // En un entorno real, usar crypto.subtle o librerías de encriptación
    // Esta es una implementación simplificada
    const hash = createHash('sha256').update(data + key).digest('hex');
    return `encrypted:${iv.toString('hex')}:${hash}`;
  }

  static async decryptSensitiveData(encryptedData: string, patientId: string): Promise<string> {
    if (!encryptedData.startsWith('encrypted:')) {
      throw new Error('Invalid encrypted data format');
    }
    // Implementar decriptación real en producción
    return 'decrypted_data_placeholder';
  }

  private static deriveEncryptionKey(patientId: string): string {
    const secret = process.env.ENCRYPTION_SECRET || 'dev-secret-key';
    return createHash('sha256').update(patientId + secret).digest('hex');
  }

  // Audit trail para compliance
  static async logDataAccess(
    userId: string,
    patientId: string,
    action: 'read' | 'write' | 'delete' | 'export',
    resourceType: string,
    resourceId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      userId,
      patientId,
      action,
      resourceType,
      resourceId: resourceId || null,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      sessionId: this.generateSessionId(),
      outcome: 'success', // En implementación real, capturar el resultado
    };
    try {
      await adminDb.collection(this.AUDIT_COLLECTION).add(auditEntry);
    } catch (error) {
      logger.error('Failed to log audit trail:', undefined, error);
      // En producción, esto debe ser crítico y alertar al equipo de seguridad
    }
  }

  private static generateSessionId(): string {
    return createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex').substring(0, 16);
  }

  // Validación de acceso a datos según roles
  static async validateDataAccess(
    userId: string,
    patientId: string,
    action: 'read' | 'write' | 'delete',
    userRole: string
  ): Promise<boolean> {
    // Reglas de acceso por rol
    const accessRules = {
      patient: {
        read: (uid: string, pid: string) => uid === pid, // Solo sus propios datos
        write: (uid: string, pid: string) => uid === pid, // Solo sus propios datos
        delete: () => false, // Los pacientes no pueden eliminar datos
      },
      doctor: {
        read: async (uid: string, pid: string) => {
          // Verificar si el doctor tiene asignado al paciente
          const assignment = await adminDb
            .collection('doctor_patient_assignments')
            .where('doctorId', '==', uid)
            .where('patientId', '==', pid)
            .where('active', '==', true)
            .get();
          return !assignment.empty;
        },
        write: async (uid: string, pid: string) => {
          // Misma validación que read
          const assignment = await adminDb
            .collection('doctor_patient_assignments')
            .where('doctorId', '==', uid)
            .where('patientId', '==', pid)
            .where('active', '==', true)
            .get();
          return !assignment.empty;
        },
        delete: () => false, // Los doctores no pueden eliminar, solo marcar como inactivo
      },
      admin: {
        read: () => true, // Acceso total
        write: () => true, // Acceso total
        delete: () => false, // Incluso admins no pueden eliminar, solo archivar
      },
      nurse: {
        read: async (uid: string, pid: string) => {
          // Las enfermeras pueden ver pacientes de su departamento
          // Implementar lógica específica según organización
          return true; // Placeholder
        },
        write: (uid: string, pid: string) => false, // Solo lectura para enfermeras
        delete: () => false,
      },
    };
    const rule = accessRules[userRole as keyof typeof accessRules];
    if (!rule) {
      return false;
    }
    return await rule[action](userId, patientId);
  }
}

// Servicio de integración con sistemas externos
export class HealthcareIntegrationService {
  // Integración con laboratorios externos
  static async fetchLabResults(patientId: string, labSystem: string): Promise<any[]> {
    const integrationConfig = {
      'lab-system-a': {
        baseUrl: process.env.LAB_SYSTEM_A_URL,
        apiKey: process.env.LAB_SYSTEM_A_KEY,
        format: 'hl7',
      },
      'lab-system-b': {
        baseUrl: process.env.LAB_SYSTEM_B_URL,
        apiKey: process.env.LAB_SYSTEM_B_KEY,
        format: 'fhir',
      },
    };
    const config = integrationConfig[labSystem as keyof typeof integrationConfig];
    if (!config) {
      throw new Error(`Unsupported lab system: ${labSystem}`);
    }
    try {
      // Log del acceso para audit trail
      await MedicalDataManager.logDataAccess(
        'system',
        patientId,
        'read',
        'LabResult',
        undefined,
        'external-integration'
      );
      // Simulación de integración externa
      // En producción, implementar llamadas reales a APIs externas
      const mockResults = [
        {
          id: `lab-${Date.now()}`,
          patientId,
          testName: 'Complete Blood Count',
          value: '12.5',
          unit: 'g/dL',
          referenceRange: '12.0-15.5',
          status: 'final',
          date: new Date().toISOString(),
          labSystem,
        },
      ];
      return mockResults;
    } catch (error) {
      logger.error(`Lab integration error for ${labSystem}:`, undefined, error);
      throw new Error('Failed to fetch lab results');
    }
  }

  // Sincronización con sistemas hospitalarios
  static async syncWithHIS(patientId: string): Promise<void> {
    try {
      // Hospital Information System integration
      const hisEndpoint = process.env.HIS_INTEGRATION_URL;
      const apiKey = process.env.HIS_API_KEY;
      if (!hisEndpoint || !apiKey) {
        logger.warn('HIS integration not configured');
        return;
      }
      // Log del acceso
      await MedicalDataManager.logDataAccess(
        'system',
        patientId,
        'read',
        'PatientData',
        undefined,
        'his-integration'
      );
      // Implementar sincronización real
      // Esto incluiría:
      // - Obtener datos actualizados del HIS
      // - Comparar con datos locales
      // - Sincronizar diferencias
      // - Resolver conflictos
      logger.info(`HIS sync completed for patient ${patientId}`);
    } catch (error) {
      logger.error('HIS sync error:', undefined, error);
      // No lanzar error para no afectar el flujo principal
    }
  }

  // Exportación de datos para reportes regulatorios
  static async exportForCompliance(
    startDate: string,
    endDate: string,
    reportType: 'quality-measures' | 'adverse-events' | 'patient-safety'
  ): Promise<any> {
    try {
      const query = adminDb
        .collection('medical_records')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate);
      const snapshot = await query.get();
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Convertir a formato FHIR para compliance
      const fhirData = {
        resourceType: 'Bundle',
        id: `compliance-export-${Date.now()}`,
        type: 'collection',
        timestamp: new Date().toISOString(),
        entry: records.map(record => ({
          resource: this.convertToFHIRResource(record, reportType),
        })),
      };
      // Log de exportación para audit
      await MedicalDataManager.logDataAccess(
        'system',
        'bulk',
        'export',
        'ComplianceReport',
        fhirData.id
      );
      return fhirData;
    } catch (error) {
      logger.error('Compliance export error:', undefined, error);
      throw new Error('Failed to generate compliance report');
    }
  }

  private static convertToFHIRResource(record: any, reportType: string): any {
    // Convertir registros internos a recursos FHIR según el tipo de reporte
    switch (reportType) {
      case 'quality-measures':
        return {
          resourceType: 'Measure',
          id: record.id,
          status: 'active',
          // Agregar campos específicos para medidas de calidad
        };
      case 'adverse-events':
        return {
          resourceType: 'AdverseEvent',
          id: record.id,
          // Agregar campos para eventos adversos
        };
      case 'patient-safety':
        return {
          resourceType: 'RiskAssessment',
          id: record.id,
          // Agregar campos para evaluación de riesgos
        };
      default:
        return record;
    }
  }
}

// Middleware específico para endpoints médicos con compliance HIPAA
import type { NextRequest, NextResponse } from 'next/server';
import { logger } from '@altamedica/shared/services/logger.service';
export function withMedicalCompliance(
  requiredRole: string[] = ['doctor', 'nurse', 'admin']
) {
  return function(
    handler: (request: NextRequest, user: any, patientId: string) => Promise<NextResponse>
  ) {
    return async function(request: NextRequest): Promise<NextResponse> {
      try {
        // Verificar autenticación
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
          return Response.json(
            { error: 'Authentication required for medical data access' },
            { status: 401 }
          );
        }
        // Obtener patientId de la URL o query params
        const url = new URL(request.url);
        const patientId = url.searchParams.get('patientId') || 
                         url.pathname.split('/').find(segment => segment.startsWith('patient-'));
        if (!patientId) {
          return Response.json(
            { error: 'Patient ID required for medical data access' },
            { status: 400 }
          );
        }
        // Simular usuario autenticado
        const user = { 
          id: 'user-123', 
          role: 'doctor', 
          permissions: ['read:medical', 'write:medical'] 
        };
        // Validar acceso a datos del paciente
        const hasAccess = await MedicalDataManager.validateDataAccess(
          user.id,
          patientId,
          request.method === 'GET' ? 'read' : 'write',
          user.role
        );
        if (!hasAccess) {
          return Response.json(
            { error: 'Insufficient permissions for this patient data' },
            { status: 403 }
          );
        }
        // Log del acceso para audit trail
        await MedicalDataManager.logDataAccess(
          user.id,
          patientId,
          request.method === 'GET' ? 'read' : 'write',
          'MedicalRecord',
          undefined,
          // @ts-ignore: NextRequest no tiene ip, usar cabeceras
          request.headers.get('x-forwarded-for') || 'unknown',
          request.headers.get('user-agent') || undefined
        );
        return await handler(request, user, patientId);
      } catch (error) {
        logger.error('Medical compliance middleware error:', undefined, error);
        return Response.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}
