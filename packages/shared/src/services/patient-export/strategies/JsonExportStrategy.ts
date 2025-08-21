/**
 * JsonExportStrategy - Estrategia para exportar datos en formato JSON
 * Parte del refactoring del God Object patient-data-export.service.ts
 */

import type { ExportOptions, PatientDataPackage } from '../types';

export interface ExportStrategy {
  export(data: PatientDataPackage, options: ExportOptions): Promise<Buffer>;
  getContentType(): string;
  getFileExtension(): string;
}

export class JsonExportStrategy implements ExportStrategy {
  /**
   * Exporta los datos del paciente en formato JSON
   */
  async export(data: PatientDataPackage, options: ExportOptions): Promise<Buffer> {
    const exportData = this.filterDataByOptions(data, options);
    const jsonString = JSON.stringify(exportData, null, 2);
    return Buffer.from(jsonString, 'utf-8');
  }

  /**
   * Obtiene el tipo de contenido MIME
   */
  getContentType(): string {
    return 'application/json';
  }

  /**
   * Obtiene la extensión del archivo
   */
  getFileExtension(): string {
    return 'json';
  }

  /**
   * Filtra los datos según las opciones de exportación
   */
  private filterDataByOptions(
    data: PatientDataPackage,
    options: ExportOptions,
  ): Partial<PatientDataPackage> {
    const filtered = {
      exportId: data.exportId,
      patientInfo: data.patientInfo,
      metadata: data.metadata,
      compliance: data.compliance,
      medicalData: {} as PatientDataPackage['medicalData'],
    };

    // Filtrar datos médicos según opciones
    if (options.includeMedicalHistory && data.medicalData.medicalHistory) {
      filtered.medicalData.medicalHistory = data.medicalData.medicalHistory;
    }

    if (options.includeLabResults && data.medicalData.labResults) {
      filtered.medicalData.labResults = data.medicalData.labResults;
    }

    if (options.includePrescriptions && data.medicalData.prescriptions) {
      filtered.medicalData.prescriptions = data.medicalData.prescriptions;
    }

    if (options.includeAppointments && data.medicalData.appointments) {
      filtered.medicalData.appointments = data.medicalData.appointments;
    }

    if (options.includeVitalSigns && data.medicalData.vitalSigns) {
      filtered.medicalData.vitalSigns = data.medicalData.vitalSigns;
    }

    if (options.includeImmunizations && data.medicalData.immunizations) {
      filtered.medicalData.immunizations = data.medicalData.immunizations;
    }

    if (options.includeAllergies && data.medicalData.allergies) {
      filtered.medicalData.allergies = data.medicalData.allergies;
    }

    if (options.includeProcedures && data.medicalData.procedures) {
      filtered.medicalData.procedures = data.medicalData.procedures;
    }

    if (options.includeDiagnoses && data.medicalData.diagnoses) {
      filtered.medicalData.diagnoses = data.medicalData.diagnoses;
    }

    if (options.includeNotes && data.medicalData.clinicalNotes) {
      filtered.medicalData.clinicalNotes = data.medicalData.clinicalNotes;
    }

    if (options.includeDocuments && data.medicalData.documents) {
      filtered.medicalData.documents = data.medicalData.documents;
    }

    if (options.includeBilling && data.medicalData.billing) {
      filtered.medicalData.billing = data.medicalData.billing;
    }

    if (options.includeConsents && data.medicalData.consents) {
      filtered.medicalData.consents = data.medicalData.consents;
    }

    if (options.includeAuditLogs && data.medicalData.auditLogs) {
      filtered.medicalData.auditLogs = data.medicalData.auditLogs;
    }

    return filtered;
  }
}

export default JsonExportStrategy;
