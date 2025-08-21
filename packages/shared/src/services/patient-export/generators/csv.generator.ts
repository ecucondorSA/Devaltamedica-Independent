import type { PatientDataPackage } from '../types';
import { BaseExportGenerator } from './base.generator';

/**
 * CSV Export Generator
 * Generates structured CSV exports with proper escaping and multiple sheets
 * Extracted from lines 992-1011 of original PatientDataExportService
 * Enhanced with multi-file output and proper CSV formatting
 */

export class CsvExportGenerator extends BaseExportGenerator {
  protected readonly fileExtension = '.csv';
  protected readonly mimeType = 'text/csv';
  protected readonly supportedLanguages = ['es', 'en', 'pt'];

  private readonly CSV_DELIMITER = ',';
  private readonly CSV_QUOTE = '"';
  private readonly CSV_ESCAPE = '""';

  /**
   * Generate CSV export as multiple files in a directory
   */
  async generate(dataPackage: PatientDataPackage, exportDir: string): Promise<string> {
    try {
      this.logProgress('Starting CSV export generation');
      
      // Validate inputs
      this.validateDataPackage(dataPackage);
      this.ensureExportDirectory(exportDir);

      // Create CSV-specific directory
      const csvDir = this.generateFilePath(exportDir, dataPackage, 'csv_export');
      this.ensureExportDirectory(csvDir);

      // Generate individual CSV files for each category
      await this.generatePatientInfoCsv(dataPackage, csvDir);
      await this.generateMedicalDataCsvs(dataPackage, csvDir);
      await this.generateSummaryCsv(dataPackage, csvDir);
      await this.generateReadmeFile(dataPackage, csvDir);

      this.logProgress('CSV export completed', { csvDir });

      return csvDir;
    } catch (error) {
      this.handleGenerationError(error, 'CSV generation');
    }
  }

  /**
   * Generate patient information CSV
   */
  private async generatePatientInfoCsv(dataPackage: PatientDataPackage, csvDir: string): Promise<void> {
    const patientInfo = dataPackage.patientInfo;
    const filePath = `${csvDir}/01_patient_information.csv`;

    const headers = [
      'Field',
      'Value',
      'Type',
      'Source',
      'Last_Updated'
    ];

    const rows = [
      ['Patient_ID', patientInfo.id, 'Identifier', 'System', this.formatDate(new Date())],
      ['First_Name', patientInfo.firstName, 'Personal', 'Patient', this.formatDate(new Date())],
      ['Last_Name', patientInfo.lastName, 'Personal', 'Patient', this.formatDate(new Date())],
      ['Date_of_Birth', this.formatDate(patientInfo.dateOfBirth), 'Personal', 'Patient', this.formatDate(new Date())],
      ['Gender', patientInfo.gender, 'Personal', 'Patient', this.formatDate(new Date())],
      ['Email', patientInfo.contactInfo?.email || 'N/A', 'Contact', 'Patient', this.formatDate(new Date())],
      ['Phone', patientInfo.contactInfo?.phone || 'N/A', 'Contact', 'Patient', this.formatDate(new Date())],
      ['Address', patientInfo.contactInfo?.address || 'N/A', 'Contact', 'Patient', this.formatDate(new Date())],
    ];

    const csvContent = this.createCsvContent(headers, rows);
    await this.writeToFile(filePath, csvContent);
  }

  /**
   * Generate CSV files for each medical data category
   */
  private async generateMedicalDataCsvs(dataPackage: PatientDataPackage, csvDir: string): Promise<void> {
    const medicalData = dataPackage.medicalData;
    let fileIndex = 2;

    for (const [category, data] of Object.entries(medicalData)) {
      if (Array.isArray(data) && data.length > 0) {
        const fileName = `${String(fileIndex).padStart(2, '0')}_${category}.csv`;
        const filePath = `${csvDir}/${fileName}`;
        
        await this.generateCategoryCsv(category, data, filePath);
        fileIndex++;
      }
    }
  }

  /**
   * Generate CSV for a specific medical data category
   */
  private async generateCategoryCsv(category: string, data: any[], filePath: string): Promise<void> {
    if (!data || data.length === 0) {
      return;
    }

    // Extract all unique fields from the data
    const allFields = new Set<string>();
    data.forEach(record => {
      Object.keys(record).forEach(key => allFields.add(key));
    });

    // Sort fields with important ones first
    const sortedFields = this.sortFieldsForCategory(category, Array.from(allFields));
    
    // Create header row
    const headers = sortedFields.map(field => this.formatFieldName(field));

    // Create data rows
    const rows = data.map(record => 
      sortedFields.map(field => this.formatCellValue(record[field]))
    );

    const csvContent = this.createCsvContent(headers, rows);
    await this.writeToFile(filePath, csvContent);
  }

  /**
   * Sort fields based on category and importance
   */
  private sortFieldsForCategory(category: string, fields: string[]): string[] {
    const fieldPriority: Record<string, string[]> = {
      medical_records: ['id', 'date', 'type', 'description', 'providerId', 'providerName', 'diagnosis', 'treatment'],
      lab_results: ['id', 'resultDate', 'testName', 'value', 'unit', 'status', 'flag', 'referenceRange'],
      appointments: ['id', 'appointmentDate', 'type', 'status', 'providerId', 'providerName', 'reason', 'notes'],
      vital_signs: ['id', 'recordedAt', 'bloodPressure', 'heartRate', 'temperature', 'weight', 'height'],
      prescriptions: ['id', 'prescriptionDate', 'medication', 'dosage', 'frequency', 'duration', 'providerId'],
      immunizations: ['id', 'vaccine', 'administeredDate', 'dose', 'site', 'providerId'],
      allergies: ['id', 'allergen', 'reaction', 'severity', 'onsetDate'],
      procedures: ['id', 'procedureDate', 'name', 'description', 'outcome', 'providerId'],
      diagnoses: ['id', 'diagnosisDate', 'code', 'description', 'type', 'status'],
      clinical_notes: ['id', 'noteDate', 'type', 'content', 'providerId'],
      default: ['id', 'date', 'createdAt', 'updatedAt']
    };

    const priority = fieldPriority[category] || fieldPriority.default;
    const priorityFields = priority.filter(field => fields.includes(field));
    const remainingFields = fields.filter(field => !priority.includes(field)).sort();

    return [...priorityFields, ...remainingFields];
  }

  /**
   * Format field name for CSV header
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
      .replace(/_+/g, '_')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('_');
  }

  /**
   * Format cell value for CSV
   */
  private formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (value instanceof Date) {
      return this.formatDate(value);
    }

    if (typeof value === 'object') {
      // Handle complex objects
      if (Array.isArray(value)) {
        return value.map(item => this.formatCellValue(item)).join('; ');
      } else {
        // Convert object to key:value pairs
        return Object.entries(value)
          .map(([k, v]) => `${k}: ${this.formatCellValue(v)}`)
          .join('; ');
      }
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    // String handling with proper escaping
    return String(value);
  }

  /**
   * Create CSV content with proper escaping
   */
  private createCsvContent(headers: string[], rows: string[][]): string {
    const csvRows = [headers, ...rows];
    
    return csvRows
      .map(row => 
        row.map(cell => this.escapeCsvCell(cell)).join(this.CSV_DELIMITER)
      )
      .join('\n');
  }

  /**
   * Escape CSV cell content
   */
  private escapeCsvCell(cell: string): string {
    const cellStr = String(cell || '');
    
    // Check if escaping is needed
    const needsEscaping = 
      cellStr.includes(this.CSV_DELIMITER) ||
      cellStr.includes(this.CSV_QUOTE) ||
      cellStr.includes('\n') ||
      cellStr.includes('\r');

    if (needsEscaping) {
      // Escape quotes and wrap in quotes
      const escaped = cellStr.replace(new RegExp(this.CSV_QUOTE, 'g'), this.CSV_ESCAPE);
      return `${this.CSV_QUOTE}${escaped}${this.CSV_QUOTE}`;
    }

    return cellStr;
  }

  /**
   * Generate summary CSV with export statistics
   */
  private async generateSummaryCsv(dataPackage: PatientDataPackage, csvDir: string): Promise<void> {
    const filePath = `${csvDir}/00_export_summary.csv`;
    const metadata = this.generateExportMetadata(dataPackage);

    const headers = ['Category', 'Record_Count', 'File_Name', 'Description'];
    const rows: string[][] = [];

    // Add patient info row
    rows.push([
      'Patient Information',
      '1',
      '01_patient_information.csv',
      'Basic patient demographics and contact information'
    ]);

    // Add medical data categories
    Object.entries(dataPackage.medicalData).forEach(([category, data], index) => {
      if (Array.isArray(data) && data.length > 0) {
        const fileName = `${String(index + 2).padStart(2, '0')}_${category}.csv`;
        rows.push([
          this.formatCategoryName(category),
          data.length.toString(),
          fileName,
          this.getCategoryDescription(category)
        ]);
      }
    });

    // Add summary row
    rows.push([
      'TOTAL',
      metadata.totalRecords.toString(),
      '',
      `Complete medical record export for ${metadata.patient.name}`
    ]);

    const csvContent = this.createCsvContent(headers, rows);
    await this.writeToFile(filePath, csvContent);
  }

  /**
   * Generate README file for CSV export
   */
  private async generateReadmeFile(dataPackage: PatientDataPackage, csvDir: string): Promise<void> {
    const filePath = `${csvDir}/README.txt`;
    const readmeContent = this.generateReadmeContent(dataPackage);
    
    // Add CSV-specific instructions
    const csvInstructions = `

ARCHIVOS CSV INCLUIDOS
======================

Este directorio contiene múltiples archivos CSV organizados por categoría:

00_export_summary.csv     - Resumen del contenido exportado
01_patient_information.csv - Información básica del paciente
02-XX_[categoria].csv     - Datos médicos por categoría

INSTRUCCIONES DE USO
===================

1. Abrir archivos con Excel, LibreOffice Calc o software similar
2. Configurar codificación UTF-8 si es necesario
3. Los archivos están ordenados por fecha (más recientes primero)
4. Campos complejos están separados por punto y coma (;)

FORMATO DE DATOS
===============

- Fechas: YYYY-MM-DD HH:MM formato ISO
- Valores booleanos: Yes/No
- Campos vacíos: En blanco
- Objetos complejos: clave: valor; clave: valor

COMPATIBILIDAD
=============

Compatible con:
- Microsoft Excel 2016+
- Google Sheets
- LibreOffice Calc
- R/Python para análisis
`;

    await this.writeToFile(filePath, readmeContent + csvInstructions);
  }

  /**
   * Format category name for display
   */
  private formatCategoryName(category: string): string {
    return category
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get description for medical data category
   */
  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      medical_records: 'Complete medical history and consultations',
      lab_results: 'Laboratory test results and values',
      appointments: 'Medical appointments and consultations',
      vital_signs: 'Vital signs measurements and monitoring',
      prescriptions: 'Medication prescriptions and pharmacy records',
      immunizations: 'Vaccination history and immunization records',
      allergies: 'Known allergies and adverse reactions',
      procedures: 'Medical procedures and interventions',
      diagnoses: 'Medical diagnoses and conditions',
      clinical_notes: 'Clinical notes and observations',
      imaging: 'Medical imaging studies and reports',
      documents: 'Medical documents and attachments',
      billing: 'Billing and insurance information',
      consents: 'Patient consents and authorizations',
      audit_logs: 'Access logs and audit trail',
    };

    return descriptions[category] || 'Medical data records';
  }

  /**
   * Validate CSV structure
   */
  private validateCsvStructure(headers: string[], rows: string[][]): void {
    if (!headers || headers.length === 0) {
      throw new Error('CSV headers are required');
    }

    rows.forEach((row, index) => {
      if (row.length !== headers.length) {
        throw new Error(`Row ${index + 1} has ${row.length} columns, expected ${headers.length}`);
      }
    });
  }

  /**
   * Get estimated file sizes for CSV export
   */
  getEstimatedSizes(dataPackage: PatientDataPackage): Record<string, number> {
    const sizes: Record<string, number> = {};
    
    Object.entries(dataPackage.medicalData).forEach(([category, data]) => {
      if (Array.isArray(data) && data.length > 0) {
        // Rough estimation: 100 bytes per record + headers
        sizes[category] = (data.length * 100) + 500;
      }
    });

    return sizes;
  }
}

// Export singleton instance
export const csvExportGenerator = new CsvExportGenerator();