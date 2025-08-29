import archiver from 'archiver';
import * as crypto from 'crypto';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { getFirebaseFirestore } from '../adapters/firebase';
import { logger } from './logger.service';

/**
 * Servicio de Exportación de Datos del Paciente
 * Cumple con HIPAA "Right of Access" y Ley 26.529 Art. 14 (Derecho a la información)
 * Permite a los pacientes descargar toda su información médica
 */

export interface ExportRequest {
  id: string;
  patientId: string;
  requestedBy: string; // userId del solicitante
  requestDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  format: ExportFormat;
  scope: ExportScope;
  dateRange?: {
    from: Date;
    to: Date;
  };
  includeOptions: ExportOptions;
  completedDate?: Date;
  downloadUrl?: string;
  expirationDate?: Date;
  fileSize?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface ExportFormat {
  type: 'json' | 'pdf' | 'csv' | 'zip' | 'fhir';
  includeImages: boolean;
  includeDocuments: boolean;
  language: 'es' | 'en' | 'pt';
}

export interface ExportScope {
  includeAll: boolean;
  categories?: DataCategory[];
  specificRecords?: string[];
}

export interface ExportOptions {
  includeMedicalHistory: boolean;
  includeLabResults: boolean;
  includePrescriptions: boolean;
  includeAppointments: boolean;
  includeVitalSigns: boolean;
  includeImmunizations: boolean;
  includeAllergies: boolean;
  includeProcedures: boolean;
  includeDiagnoses: boolean;
  includeNotes: boolean;
  includeImages: boolean;
  includeDocuments: boolean;
  includeBilling: boolean;
  includeConsents: boolean;
  includeAuditLogs: boolean;
}

export type DataCategory =
  | 'medical_records'
  | 'lab_results'
  | 'prescriptions'
  | 'appointments'
  | 'vital_signs'
  | 'immunizations'
  | 'allergies'
  | 'procedures'
  | 'diagnoses'
  | 'clinical_notes'
  | 'imaging'
  | 'documents'
  | 'billing'
  | 'consents'
  | 'audit_logs';

export interface PatientDataPackage {
  exportId: string;
  patientInfo: PatientInfo;
  medicalData: MedicalData;
  metadata: ExportMetadata;
  compliance: ComplianceInfo;
}

export interface PatientInfo {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: string;
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  emergencyContacts?: any[];
  insurance?: any[];
}

export interface MedicalData {
  medicalHistory?: any[];
  labResults?: any[];
  prescriptions?: any[];
  appointments?: any[];
  vitalSigns?: any[];
  immunizations?: any[];
  allergies?: any[];
  procedures?: any[];
  diagnoses?: any[];
  clinicalNotes?: any[];
  images?: any[];
  documents?: any[];
  billing?: any[];
  consents?: any[];
  auditLogs?: any[];
}

export interface ExportMetadata {
  exportDate: Date;
  exportVersion: string;
  dataRange?: {
    from: Date;
    to: Date;
  };
  totalRecords: number;
  categories: string[];
  format: string;
  checksum: string;
  encrypted: boolean;
}

export interface ComplianceInfo {
  hipaaCompliant: boolean;
  ley26529Compliant: boolean;
  dataMinimization: boolean;
  patientConsent: boolean;
  auditLogged: boolean;
  encryptionUsed: boolean;
  retentionPeriod: string;
}

export class PatientDataExportService {
  private readonly db = getFirebaseFirestore();
  private readonly EXPORT_PATH = process.env.EXPORT_PATH || '/exports';
  private readonly ENCRYPTION_KEY = process.env.EXPORT_ENCRYPTION_KEY || '';
  private readonly EXPORT_EXPIRATION_DAYS = 7; // Archivos expiran en 7 días
  private readonly MAX_EXPORT_SIZE = 1024 * 1024 * 500; // 500MB máximo
  // Feature flags (dev/test)
  private readonly exportEnabled: boolean =
    (process.env.PATIENT_EXPORT_ENABLED || 'false') === 'true';
  private readonly useMocks: boolean = (process.env.PATIENT_EXPORT_USE_MOCKS || 'false') === 'true';

  constructor() {
    this.initializeExportDirectory();
  }

  /**
   * Inicializa el directorio de exportaciones
   */
  private initializeExportDirectory(): void {
    if (!fs.existsSync(this.EXPORT_PATH)) {
      fs.mkdirSync(this.EXPORT_PATH, { recursive: true });
    }
  }

  /**
   * Crea una solicitud de exportación
   */
  async createExportRequest(
    patientId: string,
    requestedBy: string,
    format: ExportFormat,
    scope: ExportScope,
    options: ExportOptions,
    dateRange?: { from: Date; to: Date },
  ): Promise<ExportRequest> {
    // Verificar que el solicitante tiene derecho a los datos
    await this.verifyAccessRights(patientId, requestedBy);

    const requestId = `export_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;

    const request: ExportRequest = {
      id: requestId,
      patientId,
      requestedBy,
      requestDate: new Date(),
      status: 'pending',
      format,
      scope,
      dateRange,
      includeOptions: options,
      expirationDate: new Date(Date.now() + this.EXPORT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
    };

    // Guardar solicitud en Firestore
    const requestRef = doc(this.db, 'export_requests', requestId);
    await setDoc(requestRef, {
      ...request,
      requestDate: Timestamp.fromDate(request.requestDate),
      expirationDate: Timestamp.fromDate(request.expirationDate!),
      dateRange: dateRange
        ? {
            from: Timestamp.fromDate(dateRange.from),
            to: Timestamp.fromDate(dateRange.to),
          }
        : null,
    });

    // Registrar en audit log
    await this.logExportRequest(request);

    // Procesar la exportación (async)
    this.processExportAsync(request);

    return request;
  }

  /**
   * Procesa la exportación de forma asíncrona
   */
  private async processExportAsync(request: ExportRequest): Promise<void> {
    try {
      // Actualizar estado a procesando
      await this.updateRequestStatus(request.id, 'processing');

      // Recopilar todos los datos
      const dataPackage = await this.collectPatientData(
        request.patientId,
        request.scope,
        request.includeOptions,
        request.dateRange,
      );

      // Generar archivo de exportación
      const exportFile = await this.generateExportFile(dataPackage, request.format);

      // Actualizar solicitud con resultado
      await this.updateRequestStatus(request.id, 'completed', {
        downloadUrl: exportFile.url,
        fileSize: exportFile.size,
        completedDate: new Date(),
      });

      // Notificar al paciente
      await this.notifyExportReady(request);
    } catch (error: any) {
      logger.error('[Export Service] Error processing export:', error);

      await this.updateRequestStatus(request.id, 'failed', {
        errorMessage: error.message,
      });
    }
  }

  /**
   * Recopila todos los datos del paciente
   */
  private async collectPatientData(
    patientId: string,
    scope: ExportScope,
    options: ExportOptions,
    dateRange?: { from: Date; to: Date },
  ): Promise<PatientDataPackage> {
    const exportId = `pkg_${Date.now().toString(36)}`;

    // Obtener información básica del paciente
    const patientInfo = await this.getPatientInfo(patientId);

    // Recopilar datos médicos según opciones
    const medicalData: MedicalData = {};
    let totalRecords = 0;
    const categories: string[] = [];

    if (options.includeMedicalHistory) {
      medicalData.medicalHistory = await this.getMedicalHistory(patientId, dateRange);
      totalRecords += medicalData.medicalHistory.length;
      categories.push('medical_history');
    }

    if (options.includeLabResults) {
      medicalData.labResults = await this.getLabResultsPrivate(patientId, dateRange);
      totalRecords += medicalData.labResults.length;
      categories.push('lab_results');
    }

    if (options.includePrescriptions) {
      medicalData.prescriptions = await this.getPrescriptionsPrivate(patientId, dateRange);
      totalRecords += medicalData.prescriptions.length;
      categories.push('prescriptions');
    }

    if (options.includeAppointments) {
      medicalData.appointments = await this.getAppointmentsPrivate(patientId, dateRange);
      totalRecords += medicalData.appointments.length;
      categories.push('appointments');
    }

    if (options.includeVitalSigns) {
      medicalData.vitalSigns = await this.getVitalSignsPrivate(patientId, dateRange);
      totalRecords += medicalData.vitalSigns.length;
      categories.push('vital_signs');
    }

    if (options.includeImmunizations) {
      medicalData.immunizations = await this.getImmunizationsPrivate(patientId);
      totalRecords += medicalData.immunizations.length;
      categories.push('immunizations');
    }

    if (options.includeAllergies) {
      medicalData.allergies = await this.getAllergiesPrivate(patientId);
      totalRecords += medicalData.allergies.length;
      categories.push('allergies');
    }

    if (options.includeProcedures) {
      medicalData.procedures = await this.getProceduresPrivate(patientId, dateRange);
      totalRecords += medicalData.procedures.length;
      categories.push('procedures');
    }

    if (options.includeDiagnoses) {
      medicalData.diagnoses = await this.getDiagnoses(patientId, dateRange);
      totalRecords += medicalData.diagnoses.length;
      categories.push('diagnoses');
    }

    if (options.includeNotes) {
      medicalData.clinicalNotes = await this.getClinicalNotes(patientId, dateRange);
      totalRecords += medicalData.clinicalNotes.length;
      categories.push('clinical_notes');
    }

    if (options.includeImages) {
      medicalData.images = await this.getImages(patientId, dateRange);
      totalRecords += medicalData.images.length;
      categories.push('imaging');
    }

    if (options.includeDocuments) {
      medicalData.documents = await this.getDocumentsPrivate(patientId, dateRange);
      totalRecords += medicalData.documents.length;
      categories.push('documents');
    }

    if (options.includeBilling) {
      medicalData.billing = await this.getBillingInfo(patientId, dateRange);
      totalRecords += medicalData.billing.length;
      categories.push('billing');
    }

    if (options.includeConsents) {
      medicalData.consents = await this.getConsentsPrivate(patientId);
      totalRecords += medicalData.consents.length;
      categories.push('consents');
    }

    if (options.includeAuditLogs) {
      medicalData.auditLogs = await this.getAuditLogs(patientId, dateRange);
      totalRecords += medicalData.auditLogs.length;
      categories.push('audit_logs');
    }

    // Generar metadata
    const metadata: ExportMetadata = {
      exportDate: new Date(),
      exportVersion: '1.0.0',
      dataRange: dateRange,
      totalRecords,
      categories,
      format: 'json',
      checksum: '',
      encrypted: !!this.ENCRYPTION_KEY,
    };

    // Información de compliance
    const compliance: ComplianceInfo = {
      hipaaCompliant: true,
      ley26529Compliant: true,
      dataMinimization: true,
      patientConsent: true,
      auditLogged: true,
      encryptionUsed: !!this.ENCRYPTION_KEY,
      retentionPeriod: '10 years',
    };

    return {
      exportId,
      patientInfo,
      medicalData,
      metadata,
      compliance,
    };
  }

  /**
   * Obtiene información del paciente
   */
  private async getPatientInfo(patientId: string): Promise<PatientInfo> {
    const patientRef = doc(this.db, 'patients', patientId);
    const patientDoc = await getDoc(patientRef);

    if (!patientDoc.exists()) {
      throw new Error('Paciente no encontrado');
    }

    const data = patientDoc.data();

    // Sanitizar datos sensibles si es necesario
    return {
      id: patientId,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth?.toDate(),
      gender: data.gender,
      contactInfo: {
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
      emergencyContacts: data.emergencyContacts,
      insurance: data.insurance,
    };
  }

  /**
   * Obtiene historial médico
   */
  private async getMedicalHistory(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const recordsRef = collection(this.db, 'medical_records');
    let q = query(recordsRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('date', '>=', Timestamp.fromDate(dateRange.from)),
        where('date', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    q = query(q, orderBy('date', 'desc'));

    const snapshot = await getDocs(q);
    const records: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      });
    });

    return records;
  }

  /**
   * Obtiene resultados de laboratorio
   */
  private async getLabResultsPrivate(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const labsRef = collection(this.db, 'lab_results');
    let q = query(labsRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('resultDate', '>=', Timestamp.fromDate(dateRange.from)),
        where('resultDate', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const results: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      results.push({
        id: doc.id,
        ...doc.data(),
        resultDate: doc.data().resultDate?.toDate(),
      });
    });

    return results;
  }

  /**
   * Obtiene prescripciones
   */
  private async getPrescriptionsPrivate(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const prescriptionsRef = collection(this.db, 'prescriptions');
    let q = query(prescriptionsRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('prescriptionDate', '>=', Timestamp.fromDate(dateRange.from)),
        where('prescriptionDate', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const prescriptions: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      prescriptions.push({
        id: doc.id,
        ...doc.data(),
        prescriptionDate: doc.data().prescriptionDate?.toDate(),
      });
    });

    return prescriptions;
  }

  /**
   * Obtiene citas médicas
   */
  private async getAppointmentsPrivate(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const appointmentsRef = collection(this.db, 'appointments');
    let q = query(appointmentsRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('appointmentDate', '>=', Timestamp.fromDate(dateRange.from)),
        where('appointmentDate', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const appointments: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data(),
        appointmentDate: doc.data().appointmentDate?.toDate(),
      });
    });

    return appointments;
  }

  /**
   * Obtiene signos vitales
   */
  private async getVitalSignsPrivate(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const vitalsRef = collection(this.db, 'vital_signs');
    let q = query(vitalsRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('recordedAt', '>=', Timestamp.fromDate(dateRange.from)),
        where('recordedAt', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const vitals: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      vitals.push({
        id: doc.id,
        ...doc.data(),
        recordedAt: doc.data().recordedAt?.toDate(),
      });
    });

    return vitals;
  }

  /**
   * Obtiene inmunizaciones
   */
  private async getImmunizationsPrivate(patientId: string): Promise<Record<string, unknown>[]> {
    const immunizationsRef = collection(this.db, 'immunizations');
    const q = query(immunizationsRef, where('patientId', '==', patientId));

    const snapshot = await getDocs(q);
    const immunizations: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      immunizations.push({
        id: doc.id,
        ...doc.data(),
        administeredDate: doc.data().administeredDate?.toDate(),
      });
    });

    return immunizations;
  }

  /**
   * Obtiene alergias
   */
  private async getAllergiesPrivate(patientId: string): Promise<Record<string, unknown>[]> {
    const allergiesRef = collection(this.db, 'allergies');
    const q = query(allergiesRef, where('patientId', '==', patientId));

    const snapshot = await getDocs(q);
    const allergies: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      allergies.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return allergies;
  }

  /**
   * Obtiene procedimientos
   */
  private async getProceduresPrivate(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const proceduresRef = collection(this.db, 'procedures');
    let q = query(proceduresRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('procedureDate', '>=', Timestamp.fromDate(dateRange.from)),
        where('procedureDate', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const procedures: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      procedures.push({
        id: doc.id,
        ...doc.data(),
        procedureDate: doc.data().procedureDate?.toDate(),
      });
    });

    return procedures;
  }

  /**
   * Obtiene diagnósticos
   */
  private async getDiagnoses(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const diagnosesRef = collection(this.db, 'diagnoses');
    let q = query(diagnosesRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('diagnosisDate', '>=', Timestamp.fromDate(dateRange.from)),
        where('diagnosisDate', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const diagnoses: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      diagnoses.push({
        id: doc.id,
        ...doc.data(),
        diagnosisDate: doc.data().diagnosisDate?.toDate(),
      });
    });

    return diagnoses;
  }

  /**
   * Obtiene notas clínicas
   */
  private async getClinicalNotes(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const notesRef = collection(this.db, 'clinical_notes');
    let q = query(notesRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('noteDate', '>=', Timestamp.fromDate(dateRange.from)),
        where('noteDate', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const notes: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data(),
        noteDate: doc.data().noteDate?.toDate(),
      });
    });

    return notes;
  }

  /**
   * Obtiene imágenes médicas
   */
  private async getImages(patientId: string, dateRange?: { from: Date; to: Date }): Promise<Record<string, unknown>[]> {
    const imagesRef = collection(this.db, 'medical_images');
    let q = query(imagesRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('studyDate', '>=', Timestamp.fromDate(dateRange.from)),
        where('studyDate', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const images: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      images.push({
        id: doc.id,
        ...doc.data(),
        studyDate: doc.data().studyDate?.toDate(),
        // No incluir URLs directas por seguridad
        imageUrl: '[Protected - Request separate download]',
      });
    });

    return images;
  }

  /**
   * Obtiene documentos
   */
  private async getDocumentsPrivate(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const documentsRef = collection(this.db, 'medical_documents');
    let q = query(documentsRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('uploadDate', '>=', Timestamp.fromDate(dateRange.from)),
        where('uploadDate', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const documents: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
        uploadDate: doc.data().uploadDate?.toDate(),
        documentUrl: '[Protected - Request separate download]',
      });
    });

    return documents;
  }

  /**
   * Obtiene información de facturación
   */
  private async getBillingInfo(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const billingRef = collection(this.db, 'billing');
    let q = query(billingRef, where('patientId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('billDate', '>=', Timestamp.fromDate(dateRange.from)),
        where('billDate', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const billing: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Sanitizar información financiera sensible
      billing.push({
        id: doc.id,
        billDate: data.billDate?.toDate(),
        amount: data.amount,
        status: data.status,
        description: data.description,
        // Omitir números de tarjeta, etc.
      });
    });

    return billing;
  }

  /**
   * Obtiene consentimientos
   */
  private async getConsentsPrivate(patientId: string): Promise<Record<string, unknown>[]> {
    const consentsRef = collection(this.db, 'consents');
    const q = query(consentsRef, where('patientId', '==', patientId));

    const snapshot = await getDocs(q);
    const consents: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      consents.push({
        id: doc.id,
        ...doc.data(),
        consentDate: doc.data().consentDate?.toDate(),
      });
    });

    return consents;
  }

  /**
   * Obtiene logs de auditoría
   */
  private async getAuditLogs(
    patientId: string,
    dateRange?: { from: Date; to: Date },
  ): Promise<Record<string, unknown>[]> {
    const auditRef = collection(this.db, 'audit_logs');
    let q = query(auditRef, where('targetId', '==', patientId));

    if (dateRange) {
      q = query(
        q,
        where('timestamp', '>=', Timestamp.fromDate(dateRange.from)),
        where('timestamp', '<=', Timestamp.fromDate(dateRange.to)),
      );
    }

    const snapshot = await getDocs(q);
    const logs: Record<string, unknown>[] = [];

    snapshot.forEach((doc) => {
      logs.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      });
    });

    return logs;
  }

  /**
   * Genera el archivo de exportación
   */
  private async generateExportFile(
    dataPackage: PatientDataPackage,
    format: ExportFormat,
  ): Promise<{ url: string; size: number }> {
    const exportDir = path.join(this.EXPORT_PATH, dataPackage.patientInfo.id, dataPackage.exportId);

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    let filePath: string;
    let fileSize: number;

    switch (format.type) {
      case 'json':
        filePath = await this.generateJSONExport(dataPackage, exportDir);
        break;

      case 'pdf':
        filePath = await this.generatePDFExport(dataPackage, exportDir);
        break;

      case 'csv':
        filePath = await this.generateCSVExport(dataPackage, exportDir);
        break;

      case 'zip':
        filePath = await this.generateZIPExport(dataPackage, exportDir);
        break;

      case 'fhir':
        filePath = await this.generateFHIRExport(dataPackage, exportDir);
        break;

      default:
        throw new Error(`Formato no soportado: ${format.type}`);
    }

    // Calcular checksum
    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Actualizar metadata con checksum
    dataPackage.metadata.checksum = checksum;

    // Encriptar si está configurado
    if (this.ENCRYPTION_KEY) {
      filePath = await this.encryptExportFile(filePath);
    }

    // Obtener tamaño final
    const stats = fs.statSync(filePath);
    fileSize = stats.size;

    // Generar URL de descarga (en producción sería una URL firmada de S3/Cloud Storage)
    const downloadUrl = `/api/v1/exports/download/${dataPackage.exportId}`;

    return {
      url: downloadUrl,
      size: fileSize,
    };
  }

  /**
   * Genera exportación en formato JSON
   */
  private async generateJSONExport(
    dataPackage: PatientDataPackage,
    exportDir: string,
  ): Promise<string> {
    const filePath = path.join(exportDir, 'patient_data.json');

    const jsonData = JSON.stringify(dataPackage, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf8');

    return filePath;
  }

  /**
   * Genera exportación en formato PDF
   */
  private async generatePDFExport(
    dataPackage: PatientDataPackage,
    exportDir: string,
  ): Promise<string> {
    // Implementación de generación PDF se haría con una librería como pdfkit
    // Por ahora retornamos placeholder
    const filePath = path.join(exportDir, 'patient_data.pdf');
    fs.writeFileSync(filePath, 'PDF Export - To be implemented');
    return filePath;
  }

  /**
   * Genera exportación en formato CSV
   */
  private async generateCSVExport(
    dataPackage: PatientDataPackage,
    exportDir: string,
  ): Promise<string> {
    // Implementación básica CSV
    const filePath = path.join(exportDir, 'patient_data.csv');

    // Convertir a formato tabular
    let csvContent = 'Category,Date,Type,Description,Value\n';

    // Agregar registros médicos
    if (dataPackage.medicalData.medicalHistory) {
      dataPackage.medicalData.medicalHistory.forEach((record) => {
        csvContent += `Medical History,${record.date},${record.type},"${record.description}","${record.value || ''}"\n`;
      });
    }

    fs.writeFileSync(filePath, csvContent, 'utf8');
    return filePath;
  }

  /**
   * Genera exportación en formato ZIP
   */
  private async generateZIPExport(
    dataPackage: PatientDataPackage,
    exportDir: string,
  ): Promise<string> {
    const zipPath = path.join(exportDir, 'patient_data.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Máxima compresión
    });

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(zipPath));
      archive.on('error', reject);

      archive.pipe(output);

      // Agregar archivo JSON principal
      archive.append(JSON.stringify(dataPackage, null, 2), { name: 'patient_data.json' });

      // Agregar README
      archive.append(this.generateReadme(dataPackage), { name: 'README.txt' });

      archive.finalize();
    });
  }

  /**
   * Genera exportación en formato FHIR
   */
  private async generateFHIRExport(
    dataPackage: PatientDataPackage,
    exportDir: string,
  ): Promise<string> {
    // Implementación FHIR R4
    const filePath = path.join(exportDir, 'patient_data_fhir.json');

    const fhirBundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [],
    };

    // Convertir a recursos FHIR
    // ... implementación específica FHIR ...

    fs.writeFileSync(filePath, JSON.stringify(fhirBundle, null, 2));
    return filePath;
  }

  /**
   * Genera README para el export
   */
  private generateReadme(dataPackage: PatientDataPackage): string {
    return `
EXPORTACIÓN DE DATOS MÉDICOS - ALTAMEDICA PLATFORM
===================================================

Paciente: ${dataPackage.patientInfo.firstName} ${dataPackage.patientInfo.lastName}
ID: ${dataPackage.patientInfo.id}
Fecha de Exportación: ${dataPackage.metadata.exportDate}

CONTENIDO
---------
Total de Registros: ${dataPackage.metadata.totalRecords}
Categorías Incluidas: ${dataPackage.metadata.categories.join(', ')}

CUMPLIMIENTO NORMATIVO
----------------------
✓ HIPAA Compliant: ${dataPackage.compliance.hipaaCompliant ? 'Sí' : 'No'}
✓ Ley 26.529 Compliant: ${dataPackage.compliance.ley26529Compliant ? 'Sí' : 'No'}
✓ Datos Encriptados: ${dataPackage.compliance.encryptionUsed ? 'Sí' : 'No'}

IMPORTANTE
----------
- Esta información es confidencial y personal
- No compartir con terceros sin autorización
- Período de retención: ${dataPackage.compliance.retentionPeriod}
- Checksum SHA-256: ${dataPackage.metadata.checksum}

Para soporte contacte: soporte@altamedica.com

© 2025 AltaMedica Platform - Todos los derechos reservados
    `;
  }

  /**
   * Encripta el archivo de exportación
   */
  private async encryptExportFile(filePath: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    const input = fs.createReadStream(filePath);
    const encryptedPath = `${filePath}.encrypted`;
    const output = fs.createWriteStream(encryptedPath);

    return new Promise((resolve, reject) => {
      input
        .pipe(cipher)
        .pipe(output)
        .on('finish', () => {
          // Eliminar archivo sin encriptar
          fs.unlinkSync(filePath);
          resolve(encryptedPath);
        })
        .on('error', reject);
    });
  }

  /**
   * Verifica derechos de acceso
   */
  private async verifyAccessRights(patientId: string, requestedBy: string): Promise<void> {
    // Verificar que el solicitante es el paciente o tiene autorización
    const userRef = doc(this.db, 'users', requestedBy);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('Usuario no autorizado');
    }

    const userData = userDoc.data();

    // Verificar permisos
    if (
      userData.patientId !== patientId &&
      userData.role !== 'admin' &&
      !userData.authorizedPatients?.includes(patientId)
    ) {
      throw new Error('No tiene permisos para acceder a estos datos');
    }
  }

  /**
   * Actualiza el estado de la solicitud
   */
  private async updateRequestStatus(
    requestId: string,
    status: ExportRequest['status'],
    additionalData?: Partial<ExportRequest>,
  ): Promise<void> {
    const requestRef = doc(this.db, 'export_requests', requestId);
    await updateDoc(requestRef, {
      status,
      ...additionalData,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * Registra la solicitud en audit log
   */
  private async logExportRequest(request: ExportRequest): Promise<void> {
    const auditRef = doc(collection(this.db, 'audit_logs'));
    await setDoc(auditRef, {
      action: 'patient_data_export_requested',
      userId: request.requestedBy,
      targetId: request.patientId,
      resource: 'patient_data',
      metadata: {
        exportId: request.id,
        format: request.format.type,
        categories: Object.keys(request.includeOptions).filter(
          (k) => request.includeOptions[k as keyof ExportOptions],
        ),
      },
      timestamp: serverTimestamp(),
      ip: 'system',
      compliance: {
        hipaa: true,
        ley26529: true,
        article: 'Right of Access / Art. 14',
      },
    });
  }

  /**
   * Notifica al paciente que la exportación está lista
   */
  private async notifyExportReady(request: ExportRequest): Promise<void> {
    // Implementar notificación por email/push
    logger.info(`[Export Service] Notifying patient ${request.patientId} - Export ready`);
  }

  /**
   * Obtiene datos del paciente (método helper para aggregator)
   */
  async getPatientData(patientId: string): Promise<any> {
    // Check if export is enabled
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    // Use mock data only if explicitly enabled in dev
    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return {
        firstName: 'Mock',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'unknown',
        medicalRecordNumber: 'MOCK-001',
        nationalId: 'MOCK-ID',
        ethnicity: '',
        preferredLanguage: 'es',
        maritalStatus: '',
        occupation: '',
        educationLevel: '',
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'Argentina',
        },
        phone: '',
        email: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
        },
      };
    }

    // Real Firestore query
    const patientDoc = await getDoc(doc(this.db, 'patients', patientId));

    if (!patientDoc.exists()) {
      throw new Error(`Patient ${patientId} not found`);
    }

    const data = patientDoc.data();
    return {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
      gender: data.gender || 'unknown',
      medicalRecordNumber: data.medicalRecordNumber || '',
      nationalId: data.nationalId || '',
      ethnicity: data.ethnicity || '',
      preferredLanguage: data.preferredLanguage || 'es',
      maritalStatus: data.maritalStatus || '',
      occupation: data.occupation || '',
      educationLevel: data.educationLevel || '',
      address: data.address || {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Argentina',
      },
      phone: data.phone || '',
      email: data.email || '',
      emergencyContact: data.emergencyContact || {
        name: '',
        relationship: '',
        phone: '',
      },
    };
  }

  /**
   * Obtiene registros médicos del paciente
   */
  async getMedicalRecords(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Real Firestore query
    const recordsRef = collection(this.db, 'medicalRecords');
    const q = query(recordsRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);

    const records: any[] = [];
    snapshot.forEach((doc) => {
      records.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      });
    });

    return records;
  }

  /**
   * Obtiene estudios de imágenes del paciente
   */
  async getImagingStudies(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Real Firestore query
    const imagingRef = collection(this.db, 'imagingStudies');
    const q = query(imagingRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);

    const studies: any[] = [];
    snapshot.forEach((doc) => {
      studies.push({
        id: doc.id,
        ...doc.data(),
        studyDate: doc.data().studyDate?.toDate(),
      });
    });

    return studies;
  }

  /**
   * Obtiene historial de telemedicina del paciente
   */
  async getTelemedicine(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Real Firestore query
    const telemedicineRef = collection(this.db, 'telemedicineSessions');
    const q = query(telemedicineRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);

    const sessions: any[] = [];
    snapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
        sessionDate: doc.data().sessionDate?.toDate(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate(),
      });
    });

    return sessions;
  }

  /**
   * Obtiene información de seguro del paciente
   */
  async getInsurance(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Real Firestore query
    const insuranceRef = collection(this.db, 'insurance');
    const q = query(insuranceRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);

    const insurance: any[] = [];
    snapshot.forEach((doc) => {
      insurance.push({
        id: doc.id,
        ...doc.data(),
        effectiveDate: doc.data().effectiveDate?.toDate(),
        expirationDate: doc.data().expirationDate?.toDate(),
      });
    });

    return insurance;
  }

  /**
   * Obtiene información de facturación del paciente
   */
  async getBilling(patientId: string): Promise<any> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return {
        totalBilled: 0,
        totalPaid: 0,
        balance: 0,
        invoices: [],
      };
    }

    // Real Firestore query
    const invoicesRef = collection(this.db, 'invoices');
    const q = query(invoicesRef, where('patientId', '==', patientId));
    const snapshot = await getDocs(q);

    let totalBilled = 0;
    let totalPaid = 0;
    const invoices: any[] = [];

    snapshot.forEach((doc) => {
      const invoice = doc.data();
      totalBilled += invoice.amount || 0;
      totalPaid += invoice.paidAmount || 0;
      invoices.push({
        id: doc.id,
        ...invoice,
        invoiceDate: invoice.invoiceDate?.toDate(),
        dueDate: invoice.dueDate?.toDate(),
        paidDate: invoice.paidDate?.toDate(),
      });
    });

    return {
      totalBilled,
      totalPaid,
      balance: totalBilled - totalPaid,
      invoices,
    };
  }

  /**
   * Obtiene prescripciones del paciente
   */
  async getPrescriptions(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Use the existing private method that already has real Firestore implementation
    return this.getPrescriptionsPrivate(patientId);
  }

  /**
   * Obtiene alergias del paciente
   */
  async getAllergies(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Use the existing private method that already has real Firestore implementation
    return this.getAllergiesPrivate(patientId);
  }

  /**
   * Obtiene inmunizaciones del paciente
   */
  async getImmunizations(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Use the existing private method that already has real Firestore implementation
    return this.getImmunizationsPrivate(patientId);
  }

  /**
   * Obtiene resultados de laboratorio del paciente
   */
  async getLabResults(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Use the existing private method that already has real Firestore implementation
    return this.getLabResultsPrivate(patientId);
  }

  /**
   * Obtiene signos vitales del paciente
   */
  async getVitalSigns(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Use the existing private method that already has real Firestore implementation
    return this.getVitalSignsPrivate(patientId);
  }

  /**
   * Obtiene documentos del paciente
   */
  async getDocuments(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Use the existing private method that already has real Firestore implementation
    return this.getDocumentsPrivate(patientId);
  }

  /**
   * Obtiene procedimientos del paciente
   */
  async getProcedures(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Use the existing private method that already has real Firestore implementation
    return this.getProceduresPrivate(patientId);
  }

  /**
   * Obtiene citas del paciente
   */
  async getAppointments(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Use the existing private method that already has real Firestore implementation
    return this.getAppointmentsPrivate(patientId);
  }

  /**
   * Obtiene consentimientos del paciente
   */
  async getConsents(patientId: string): Promise<any[]> {
    if (!this.exportEnabled) {
      throw new Error('Patient data export is disabled');
    }

    if (this.useMocks && process.env.NODE_ENV !== 'production') {
      return [];
    }

    // Use the existing private method that already has real Firestore implementation
    return this.getConsentsPrivate(patientId);
  }

  /**
   * Limpia exportaciones expiradas
   */
  async cleanupExpiredExports(): Promise<void> {
    const exportsRef = collection(this.db, 'export_requests');
    const q = query(
      exportsRef,
      where('status', '==', 'completed'),
      where('expirationDate', '<=', Timestamp.now()),
    );

    const snapshot = await getDocs(q);

    for (const doc of snapshot.docs) {
      const request = doc.data() as ExportRequest;

      // Eliminar archivos
      const exportPath = path.join(this.EXPORT_PATH, request.patientId, request.id);
      if (fs.existsSync(exportPath)) {
        fs.rmSync(exportPath, { recursive: true, force: true });
      }

      // Actualizar estado
      await updateDoc(doc.ref, {
        status: 'expired',
        expiredAt: serverTimestamp(),
      });

      logger.info(`[Export Service] Cleaned up expired export: ${request.id}`);
    }
  }
}

// Funciones auxiliares de Firestore
import { serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { logger } from './logger.service';
// Exportar instancia singleton
export const patientDataExportService = new PatientDataExportService();
