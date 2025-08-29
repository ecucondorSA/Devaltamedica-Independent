import * as fs from 'fs';
import * as path from 'path';
import type { PatientDataPackage, ExportGenerator, ExportResult } from '../types';
import { logger } from '../../logger.service';

/**
 * Base Export Generator
 * Abstract class providing common functionality for all export generators
 * Implements basic file operations, validation, and error handling
 */

export abstract class BaseExportGenerator implements ExportGenerator {
  protected abstract readonly fileExtension: string;
  protected abstract readonly mimeType: string;
  protected abstract readonly supportedLanguages: string[];

  /**
   * Generate export file - must be implemented by concrete generators
   */
  abstract generate(dataPackage: PatientDataPackage, exportDir: string): Promise<string>;

  /**
   * Get file extension for this generator
   */
  getFileExtension(): string {
    return this.fileExtension;
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return this.supportedLanguages;
  }

  /**
   * Get MIME type for this export format
   */
  getMimeType(): string {
    return this.mimeType;
  }

  /**
   * Validate export directory and create if necessary
   */
  protected ensureExportDirectory(exportDir: string): void {
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
  }

  /**
   * Generate output file path with proper naming convention
   */
  protected generateFilePath(
    exportDir: string,
    dataPackage: PatientDataPackage,
    customName?: string
  ): string {
    const patientName = `${dataPackage.patientInfo.firstName}_${dataPackage.patientInfo.lastName}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = customName || `${patientName}_export_${timestamp}${this.fileExtension}`;
    
    return path.join(exportDir, this.sanitizeFileName(fileName));
  }

  /**
   * Sanitize file name to remove invalid characters
   */
  protected sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Validate data package before generation
   */
  protected validateDataPackage(dataPackage: PatientDataPackage): void {
    if (!dataPackage) {
      throw new Error('Data package is required');
    }

    if (!dataPackage.patientInfo) {
      throw new Error('Patient information is required');
    }

    if (!dataPackage.patientInfo.id) {
      throw new Error('Patient ID is required');
    }

    if (!dataPackage.medicalData) {
      throw new Error('Medical data is required');
    }

    if (!dataPackage.metadata) {
      throw new Error('Metadata is required');
    }
  }

  /**
   * Calculate total record count across all categories
   */
  protected calculateTotalRecords(dataPackage: PatientDataPackage): number {
    const medicalData = dataPackage.medicalData;
    let total = 0;

    Object.values(medicalData).forEach(categoryData => {
      if (Array.isArray(categoryData)) {
        total += categoryData.length;
      }
    });

    return total;
  }

  /**
   * Get non-empty categories from medical data
   */
  protected getNonEmptyCategories(dataPackage: PatientDataPackage): string[] {
    const medicalData = dataPackage.medicalData;
    const categories: string[] = [];

    Object.entries(medicalData).forEach(([category, data]) => {
      if (Array.isArray(data) && data.length > 0) {
        categories.push(category);
      }
    });

    return categories;
  }

  /**
   * Format date for display
   */
  protected formatDate(date: Date, locale: string = 'es-AR'): string {
    if (!date || !(date instanceof Date)) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(date);
  }

  /**
   * Format file size for display
   */
  protected formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate export metadata for inclusion in files
   */
  protected generateExportMetadata(dataPackage: PatientDataPackage): any {
    return {
      exportId: dataPackage.exportId,
      exportDate: this.formatDate(dataPackage.metadata.exportDate),
      exportVersion: dataPackage.metadata.exportVersion,
      totalRecords: this.calculateTotalRecords(dataPackage),
      categories: this.getNonEmptyCategories(dataPackage),
      patient: {
        name: `${dataPackage.patientInfo.firstName} ${dataPackage.patientInfo.lastName}`,
        id: dataPackage.patientInfo.id,
        dateOfBirth: this.formatDate(dataPackage.patientInfo.dateOfBirth),
      },
      compliance: {
        hipaaCompliant: dataPackage.compliance.hipaaCompliant,
        ley26529Compliant: dataPackage.compliance.ley26529Compliant,
        encrypted: dataPackage.compliance.encryptionUsed,
        auditLogged: dataPackage.compliance.auditLogged,
      },
      dataRange: dataPackage.metadata.dataRange ? {
        from: this.formatDate(dataPackage.metadata.dataRange.from),
        to: this.formatDate(dataPackage.metadata.dataRange.to),
      } : null,
      checksum: dataPackage.metadata.checksum,
    };
  }

  /**
   * Write data to file with error handling
   */
  protected async writeToFile(filePath: string, data: string | Buffer): Promise<void> {
    try {
      if (typeof data === 'string') {
        fs.writeFileSync(filePath, data, 'utf8');
      } else {
        fs.writeFileSync(filePath, data);
      }
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  /**
   * Get file size after generation
   */
  protected getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      logger.warn(`Could not get file size for ${filePath}`, this.constructor.name, error);
      return 0;
    }
  }

  /**
   * Generate standard export result
   */
  protected createExportResult(filePath: string, dataPackage: PatientDataPackage): ExportResult {
    const fileSize = this.getFileSize(filePath);
    const fileName = path.basename(filePath);
    
    // In production, this would be a signed URL or secure download endpoint
    const downloadUrl = `/api/v1/exports/download/${dataPackage.exportId}/${fileName}`;

    return {
      url: downloadUrl,
      size: fileSize,
      checksum: dataPackage.metadata.checksum,
    };
  }

  /**
   * Generate README content for exports
   */
  protected generateReadmeContent(dataPackage: PatientDataPackage, language: string = 'es'): string {
    const metadata = this.generateExportMetadata(dataPackage);
    
    const texts = {
      es: {
        title: 'EXPORTACIÓN DE DATOS MÉDICOS - ALTAMEDICA PLATFORM',
        patient: 'Paciente',
        exportDate: 'Fecha de Exportación',
        content: 'CONTENIDO',
        totalRecords: 'Total de Registros',
        categories: 'Categorías Incluidas',
        compliance: 'CUMPLIMIENTO NORMATIVO',
        important: 'IMPORTANTE',
        confidential: '- Esta información es confidencial y personal',
        noShare: '- No compartir con terceros sin autorización',
        retention: '- Período de retención',
        checksum: '- Checksum SHA-256',
        support: 'Para soporte contacte: soporte@altamedica.com',
        copyright: '© 2025 AltaMedica Platform - Todos los derechos reservados',
      },
      en: {
        title: 'MEDICAL DATA EXPORT - ALTAMEDICA PLATFORM',
        patient: 'Patient',
        exportDate: 'Export Date',
        content: 'CONTENT',
        totalRecords: 'Total Records',
        categories: 'Included Categories',
        compliance: 'REGULATORY COMPLIANCE',
        important: 'IMPORTANT',
        confidential: '- This information is confidential and personal',
        noShare: '- Do not share with third parties without authorization',
        retention: '- Retention period',
        checksum: '- SHA-256 Checksum',
        support: 'For support contact: support@altamedica.com',
        copyright: '© 2025 AltaMedica Platform - All rights reserved',
      },
    };

    const t = texts[language as keyof typeof texts] || texts.es;

    return `
${t.title}
${'='.repeat(t.title.length)}

${t.patient}: ${metadata.patient.name}
ID: ${metadata.patient.id}
${t.exportDate}: ${metadata.exportDate}

${t.content}
---------
${t.totalRecords}: ${metadata.totalRecords}
${t.categories}: ${metadata.categories.join(', ')}

${t.compliance}
----------------------
✓ HIPAA Compliant: ${metadata.compliance.hipaaCompliant ? 'Sí' : 'No'}
✓ Ley 26.529 Compliant: ${metadata.compliance.ley26529Compliant ? 'Sí' : 'No'}
✓ Datos Encriptados: ${metadata.compliance.encrypted ? 'Sí' : 'No'}

${t.important}
----------
${t.confidential}
${t.noShare}
${t.retention}: ${dataPackage.compliance.retentionPeriod}
${t.checksum}: ${metadata.checksum}

${t.support}

${t.copyright}
    `.trim();
  }

  /**
   * Handle generation errors with context
   */
  protected handleGenerationError(error: any, context: string): never {
    logger.error(`Error in ${context}`, this.constructor.name, error);
    throw new Error(`Export generation failed in ${context}: ${error.message || error}`);
  }

  /**
   * Validate language support
   */
  protected validateLanguage(language: string): void {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(
        `Language '${language}' not supported. Supported languages: ${this.supportedLanguages.join(', ')}`
      );
    }
  }

  /**
   * Log generation progress (for debugging)
   */
  protected logProgress(message: string, data?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      logger.info(message, this.constructor.name, data);
    }
  }
}
