/**
 * CsvExportStrategy - Estrategia para exportar datos en formato CSV
 * Parte del refactoring del God Object patient-data-export.service.ts
 */

import type { PatientDataPackage, ExportOptions } from '../types';
import type { ExportStrategy } from './JsonExportStrategy';

export class CsvExportStrategy implements ExportStrategy {
  private readonly delimiter = ',';
  private readonly lineBreak = '\r\n';

  /**
   * Exporta los datos del paciente en formato CSV
   */
  async export(data: PatientDataPackage, options: ExportOptions): Promise<Buffer> {
    const csvSections: string[] = [];

    // Información del paciente
    csvSections.push(this.createPatientInfoCsv(data.patientInfo));

    // Datos médicos según opciones
    if (options.includeMedicalHistory && data.medicalData.medicalHistory) {
      csvSections.push(this.createMedicalHistoryCsv(data.medicalData.medicalHistory));
    }

    if (options.includeLabResults && data.medicalData.labResults) {
      csvSections.push(this.createLabResultsCsv(data.medicalData.labResults));
    }

    if (options.includePrescriptions && data.medicalData.prescriptions) {
      csvSections.push(this.createPrescriptionsCsv(data.medicalData.prescriptions));
    }

    if (options.includeAppointments && data.medicalData.appointments) {
      csvSections.push(this.createAppointmentsCsv(data.medicalData.appointments));
    }

    if (options.includeVitalSigns && data.medicalData.vitalSigns) {
      csvSections.push(this.createVitalSignsCsv(data.medicalData.vitalSigns));
    }

    const csvContent = csvSections.join(this.lineBreak + this.lineBreak);
    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Obtiene el tipo de contenido MIME
   */
  getContentType(): string {
    return 'text/csv';
  }

  /**
   * Obtiene la extensión del archivo
   */
  getFileExtension(): string {
    return 'csv';
  }

  /**
   * Crea CSV de información del paciente
   */
  private createPatientInfoCsv(patientInfo: Record<string, unknown>): string {
    const headers = ['Campo', 'Valor'];
    const rows = [
      ['Nombre', patientInfo.fullName || ''],
      ['Fecha de Nacimiento', patientInfo.dateOfBirth || ''],
      ['Género', patientInfo.gender || ''],
      ['DNI', patientInfo.dni || ''],
      ['Email', patientInfo.email || ''],
      ['Teléfono', patientInfo.phone || ''],
    ];

    return this.formatCsvSection('INFORMACIÓN DEL PACIENTE', headers, rows);
  }

  /**
   * Crea CSV de historia médica
   */
  private createMedicalHistoryCsv(history: Array<Record<string, unknown>>): string {
    const headers = ['Fecha', 'Condición', 'Descripción', 'Estado'];
    const rows = history.map((h) => [
      this.formatDate(h.date),
      h.condition || '',
      h.description || '',
      h.status || '',
    ]);

    return this.formatCsvSection('HISTORIA MÉDICA', headers, rows);
  }

  /**
   * Crea CSV de resultados de laboratorio
   */
  private createLabResultsCsv(labResults: Array<Record<string, unknown>>): string {
    const headers = ['Fecha', 'Prueba', 'Resultado', 'Rango Normal', 'Unidad'];
    const rows = labResults.map((lab) => [
      this.formatDate(lab.date),
      lab.testName || '',
      lab.result || '',
      lab.normalRange || '',
      lab.unit || '',
    ]);

    return this.formatCsvSection('RESULTADOS DE LABORATORIO', headers, rows);
  }

  /**
   * Crea CSV de prescripciones
   */
  private createPrescriptionsCsv(prescriptions: Array<Record<string, unknown>>): string {
    const headers = ['Fecha', 'Medicamento', 'Dosis', 'Frecuencia', 'Duración', 'Médico'];
    const rows = prescriptions.map((p) => [
      this.formatDate(p.date),
      p.medication || '',
      p.dosage || '',
      p.frequency || '',
      p.duration || '',
      p.prescribedBy || '',
    ]);

    return this.formatCsvSection('PRESCRIPCIONES', headers, rows);
  }

  /**
   * Crea CSV de citas
   */
  private createAppointmentsCsv(appointments: Array<Record<string, unknown>>): string {
    const headers = ['Fecha', 'Hora', 'Médico', 'Especialidad', 'Motivo', 'Estado'];
    const rows = appointments.map((a) => [
      this.formatDate(a.date),
      a.time || '',
      a.doctorName || '',
      a.specialty || '',
      a.reason || '',
      a.status || '',
    ]);

    return this.formatCsvSection('CITAS MÉDICAS', headers, rows);
  }

  /**
   * Crea CSV de signos vitales
   */
  private createVitalSignsCsv(vitalSigns: Array<Record<string, unknown>>): string {
    const headers = ['Fecha', 'Temperatura', 'Presión', 'Pulso', 'Respiración', 'Saturación O2'];
    const rows = vitalSigns.map((v) => [
      this.formatDate(v.date),
      v.temperature || '',
      v.bloodPressure || '',
      v.heartRate || '',
      v.respiratoryRate || '',
      v.oxygenSaturation || '',
    ]);

    return this.formatCsvSection('SIGNOS VITALES', headers, rows);
  }

  /**
   * Formatea una sección CSV con título
   */
  private formatCsvSection(title: string, headers: string[], rows: string[][]): string {
    const lines: string[] = [];

    // Título de sección
    lines.push(`=== ${title} ===`);

    // Headers
    lines.push(this.escapeCsvRow(headers));

    // Datos
    for (const row of rows) {
      lines.push(this.escapeCsvRow(row));
    }

    return lines.join(this.lineBreak);
  }

  /**
   * Escapa valores CSV para evitar problemas
   */
  private escapeCsvRow(row: string[]): string {
    return row
      .map((value) => {
        // Si contiene delimitador, comillas o saltos de línea, envolver en comillas
        if (value.includes(this.delimiter) || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(this.delimiter);
  }

  /**
   * Formatea fecha para CSV
   */
  private formatDate(date: Date | string | number | null | undefined): string {
    if (!date) return '';

    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
}

export default CsvExportStrategy;
