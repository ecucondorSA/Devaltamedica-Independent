import type { PatientDataPackage } from '../types';
import { BaseExportGenerator } from './base.generator';

/**
 * JSON Export Generator
 * Generates clean, structured JSON exports with metadata
 * Extracted from lines 963-973 of original PatientDataExportService
 * Enhanced with proper formatting and validation
 */

export class JsonExportGenerator extends BaseExportGenerator {
  protected readonly fileExtension = '.json';
  protected readonly mimeType = 'application/json';
  protected readonly supportedLanguages = ['es', 'en', 'pt'];

  /**
   * Generate JSON export with enhanced formatting and metadata
   */
  async generate(dataPackage: PatientDataPackage, exportDir: string): Promise<string> {
    try {
      this.logProgress('Starting JSON export generation');
      
      // Validate inputs
      this.validateDataPackage(dataPackage);
      this.ensureExportDirectory(exportDir);

      // Generate file path
      const filePath = this.generateFilePath(exportDir, dataPackage, 'patient_data.json');

      // Create enhanced JSON structure
      const exportData = this.createEnhancedJsonStructure(dataPackage);

      // Write to file with pretty formatting
      const jsonContent = JSON.stringify(exportData, null, 2);
      await this.writeToFile(filePath, jsonContent);

      this.logProgress('JSON export completed', { 
        filePath, 
        size: this.formatFileSize(this.getFileSize(filePath)) 
      });

      return filePath;
    } catch (error) {
      this.handleGenerationError(error, 'JSON generation');
    }
  }

  /**
   * Create enhanced JSON structure with metadata and organization
   */
  private createEnhancedJsonStructure(dataPackage: PatientDataPackage): any {
    const exportMetadata = this.generateExportMetadata(dataPackage);
    
    return {
      // Export metadata (first for easy access)
      export: {
        id: dataPackage.exportId,
        version: dataPackage.metadata.exportVersion,
        generatedAt: dataPackage.metadata.exportDate.toISOString(),
        format: 'json',
        totalRecords: exportMetadata.totalRecords,
        categoriesIncluded: exportMetadata.categories,
        dataRange: dataPackage.metadata.dataRange ? {
          from: dataPackage.metadata.dataRange.from.toISOString(),
          to: dataPackage.metadata.dataRange.to.toISOString(),
        } : null,
        checksum: dataPackage.metadata.checksum,
        encrypted: dataPackage.metadata.encrypted,
      },

      // Patient information (sanitized and organized)
      patient: {
        demographics: {
          id: dataPackage.patientInfo.id,
          firstName: dataPackage.patientInfo.firstName,
          lastName: dataPackage.patientInfo.lastName,
          dateOfBirth: dataPackage.patientInfo.dateOfBirth?.toISOString(),
          gender: dataPackage.patientInfo.gender,
        },
        contact: dataPackage.patientInfo.contactInfo,
        emergencyContacts: dataPackage.patientInfo.emergencyContacts || [],
        insurance: dataPackage.patientInfo.insurance || [],
      },

      // Medical data (organized by category)
      medicalData: this.organizeMedicalData(dataPackage.medicalData),

      // Compliance information
      compliance: {
        standards: {
          hipaa: dataPackage.compliance.hipaaCompliant,
          ley26529: dataPackage.compliance.ley26529Compliant,
          dataMinimization: dataPackage.compliance.dataMinimization,
        },
        security: {
          encrypted: dataPackage.compliance.encryptionUsed,
          auditLogged: dataPackage.compliance.auditLogged,
          patientConsent: dataPackage.compliance.patientConsent,
        },
        retention: {
          period: dataPackage.compliance.retentionPeriod,
          expiresAt: this.calculateRetentionExpiry(dataPackage.compliance.retentionPeriod),
        },
      },

      // Generation metadata (last for reference)
      _metadata: {
        generator: 'AltaMedica Patient Export Service',
        generatorVersion: '2.0.0',
        format: 'json',
        schema: 'altamedica-patient-export-v2',
        encoding: 'utf-8',
        timezone: 'America/Argentina/Buenos_Aires',
        generatedBy: 'PatientDataExportService',
        processingTime: Date.now(),
      },
    };
  }

  /**
   * Organize medical data with proper categorization and sorting
   */
  private organizeMedicalData(medicalData: any): any {
    const organized: any = {};

    // Process each category with enhanced structure
    Object.entries(medicalData).forEach(([category, data]) => {
      if (Array.isArray(data) && data.length > 0) {
        organized[category] = {
          count: data.length,
          data: this.processCategoryData(category, data),
          lastUpdated: this.findLatestDate(data),
        };
      }
    });

    return organized;
  }

  /**
   * Process category data with proper sorting and formatting
   */
  private processCategoryData(category: string, data: any[]): any[] {
    // Sort by date (most recent first)
    const sortedData = [...data].sort((a, b) => {
      const dateA = this.extractDateFromRecord(a);
      const dateB = this.extractDateFromRecord(b);
      return dateB.getTime() - dateA.getTime();
    });

    // Format dates to ISO strings for consistency
    return sortedData.map(record => this.formatRecordDates(record));
  }

  /**
   * Extract date from record for sorting
   */
  private extractDateFromRecord(record: any): Date {
    // Try common date fields
    const dateFields = ['date', 'recordedAt', 'appointmentDate', 'resultDate', 'createdAt'];
    
    for (const field of dateFields) {
      if (record[field] instanceof Date) {
        return record[field];
      }
      if (record[field] && typeof record[field] === 'string') {
        const parsed = new Date(record[field]);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    // Fallback to current date
    return new Date();
  }

  /**
   * Format all date fields in a record to ISO strings
   */
  private formatRecordDates(record: any): any {
    const formatted = { ...record };

    Object.keys(formatted).forEach(key => {
      if (formatted[key] instanceof Date) {
        formatted[key] = formatted[key].toISOString();
      } else if (formatted[key] && typeof formatted[key] === 'object' && !Array.isArray(formatted[key])) {
        // Recursively format nested objects
        formatted[key] = this.formatRecordDates(formatted[key]);
      }
    });

    return formatted;
  }

  /**
   * Find the latest date in a data array
   */
  private findLatestDate(data: any[]): string {
    let latestDate = new Date(0); // Epoch start

    data.forEach(record => {
      const recordDate = this.extractDateFromRecord(record);
      if (recordDate > latestDate) {
        latestDate = recordDate;
      }
    });

    return latestDate.toISOString();
  }

  /**
   * Calculate retention expiry date
   */
  private calculateRetentionExpiry(retentionPeriod: string): string {
    // Parse retention period (e.g., "10 years", "7 years")
    const match = retentionPeriod.match(/(\d+)\s*(year|month|day)s?/i);
    
    if (!match) {
      // Default to 10 years if unparseable
      return new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    const [, amount, unit] = match;
    const now = new Date();
    
    switch (unit.toLowerCase()) {
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() + parseInt(amount))).toISOString();
      case 'month':
        return new Date(now.setMonth(now.getMonth() + parseInt(amount))).toISOString();
      case 'day':
        return new Date(now.setDate(now.getDate() + parseInt(amount))).toISOString();
      default:
        return new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  /**
   * Validate JSON structure before writing
   */
  private validateJsonStructure(data: any): void {
    try {
      // Test serialization
      JSON.stringify(data);
      
      // Validate required fields
      if (!data.export || !data.patient || !data.medicalData) {
        throw new Error('Missing required top-level fields in JSON structure');
      }
      
      if (!data.export.id || !data.patient.demographics) {
        throw new Error('Missing required nested fields in JSON structure');
      }
    } catch (error) {
      throw new Error(`JSON structure validation failed: ${error}`);
    }
  }

  /**
   * Get JSON schema for validation
   */
  getJsonSchema(): any {
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'AltaMedica Patient Export Schema',
      type: 'object',
      required: ['export', 'patient', 'medicalData', 'compliance', '_metadata'],
      properties: {
        export: {
          type: 'object',
          required: ['id', 'version', 'generatedAt', 'format'],
          properties: {
            id: { type: 'string' },
            version: { type: 'string' },
            generatedAt: { type: 'string', format: 'date-time' },
            format: { type: 'string', enum: ['json'] },
            totalRecords: { type: 'number', minimum: 0 },
            categoriesIncluded: { type: 'array', items: { type: 'string' } },
          },
        },
        patient: {
          type: 'object',
          required: ['demographics'],
          properties: {
            demographics: {
              type: 'object',
              required: ['id', 'firstName', 'lastName'],
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                dateOfBirth: { type: 'string', format: 'date-time' },
                gender: { type: 'string' },
              },
            },
          },
        },
        medicalData: { type: 'object' },
        compliance: { type: 'object' },
        _metadata: { type: 'object' },
      },
    };
  }
}

// Export singleton instance
export const jsonExportGenerator = new JsonExportGenerator();