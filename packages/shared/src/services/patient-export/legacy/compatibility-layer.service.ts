import { exportOrchestratorService } from '../orchestrator/export-orchestrator.service';
import { ExportResult } from '../types';
import { ExportOptions, RequestMetadata, RequestPriority } from '../request/types';

/**
 * Compatibility Layer Service
 * Maintains 100% backward compatibility with the original PatientDataExportService API
 * Translates legacy method calls to the new modular architecture
 * 
 * This service ensures that existing code using the original 1,630-line service
 * continues to work without any modifications while benefiting from the new architecture
 */

export class CompatibilityLayerService {
  /**
   * Legacy method: exportPatientData
   * Original signature maintained for backward compatibility
   */
  async exportPatientData(
    patientId: string,
    requestedBy: string,
    options: LegacyExportOptions
  ): Promise<LegacyExportResult> {
    try {
      console.log(`[CompatibilityLayer] Legacy export request for patient ${patientId}`);

      // Transform legacy options to new format
      const modernOptions = this.transformLegacyOptions(options);

      // Transform legacy metadata
      const modernMetadata = this.transformLegacyMetadata(options);

      // Determine priority from legacy options
      const priority = this.determinePriority(options);

      // Call new orchestrator service
      const result = await exportOrchestratorService.exportPatientData(
        patientId,
        requestedBy,
        modernOptions,
        modernMetadata,
        priority
      );

      // Transform result back to legacy format
      return this.transformResultToLegacy(result, options);

    } catch (error) {
      console.error('[CompatibilityLayer] Legacy export failed:', error);
      throw new Error(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Legacy method: validateExportRequest
   * Maintains original validation behavior
   */
  async validateExportRequest(
    patientId: string,
    requestedBy: string,
    options: LegacyExportOptions
  ): Promise<LegacyValidationResult> {
    try {
      // Transform to modern format for validation
      const modernOptions = this.transformLegacyOptions(options);

      // Use the modern validation through a temporary request (not stored)
      const tempRequest = {
        id: 'temp-validation',
        patientId,
        requestedBy,
        exportOptions: modernOptions,
        status: 'pending' as any,
        priority: RequestPriority.NORMAL,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: 3,
        metadata: {
          source: 'web' as const,
          tags: [],
        },
      };

      // Perform access control validation
      const { securityManager } = await import('../security');
      const accessResult = await securityManager.verifyAndLogAccess(
        patientId,
        requestedBy,
        modernOptions
      );

      return {
        valid: accessResult.granted,
        errors: accessResult.granted ? [] : [accessResult.reason || 'Access denied'],
        warnings: accessResult.warnings || [],
        estimatedSize: this.estimateExportSize(modernOptions),
        estimatedDuration: this.estimateProcessingTime(modernOptions),
      };

    } catch (error) {
      console.error('[CompatibilityLayer] Validation failed:', error);
      return {
        valid: false,
        errors: [`Validation error: ${error}`],
        warnings: [],
        estimatedSize: 0,
        estimatedDuration: 0,
      };
    }
  }

  /**
   * Legacy method: getExportStatus
   * Maintains original status format
   */
  async getExportStatus(exportId: string): Promise<LegacyExportStatus> {
    try {
      const status = await exportOrchestratorService.getExportStatus(exportId);

      if (!status.request) {
        return {
          found: false,
          status: 'not_found',
          progress: 0,
          message: 'Export request not found',
        };
      }

      return {
        found: true,
        status: this.transformStatusToLegacy(status.request.status),
        progress: status.progress?.progress || 0,
        message: status.progress?.message || 'Processing...',
        completedAt: status.request.completedDate,
        downloadUrl: status.request.status === 'completed' ?
          `/api/v1/exports/download/${exportId}` : undefined,
      };

    } catch (error) {
      console.error(`[CompatibilityLayer] Failed to get status for ${exportId}:`, error);
      return {
        found: false,
        status: 'error',
        progress: 0,
        message: `Status check failed: ${error}`,
      };
    }
  }

  /**
   * Legacy method: cancelExport
   */
  async cancelExport(exportId: string, reason?: string): Promise<boolean> {
    try {
      await exportOrchestratorService.cancelExport(
        exportId,
        reason || 'Cancelled by user'
      );
      return true;
    } catch (error) {
      console.error(`[CompatibilityLayer] Failed to cancel ${exportId}:`, error);
      return false;
    }
  }

  /**
   * Legacy method: retryExport
   */
  async retryExport(exportId: string): Promise<boolean> {
    try {
      return await exportOrchestratorService.retryExport(exportId);
    } catch (error) {
      console.error(`[CompatibilityLayer] Failed to retry ${exportId}:`, error);
      return false;
    }
  }

  /**
   * Legacy method: getAvailableFormats
   */
  getAvailableFormats(): LegacyFormatInfo[] {
    const { GeneratorFactory } = require('../factories/generator.factory');
    const modernFormats = GeneratorFactory.getAvailableFormats();

    return Object.entries(modernFormats).map(([format, capabilities]: [string, any]) => ({
      format,
      name: this.getFormatDisplayName(format),
      description: this.getFormatDescription(format),
      fileExtension: this.getFormatExtension(format),
      supportedLanguages: capabilities.supportedLanguages,
      maxSize: capabilities.maxFileSize,
      supportsEncryption: capabilities.supportsEncryption,
    }));
  }

  /**
   * Legacy method: validatePatientAccess
   */
  async validatePatientAccess(
    patientId: string,
    requestedBy: string
  ): Promise<LegacyAccessResult> {
    try {
      const { securityManager } = await import('../security');
      const accessResult = await securityManager.verifyAndLogAccess(
        patientId,
        requestedBy,
        { format: 'json', categories: ['basic'], language: 'es', includeMetadata: true, encryption: false, compression: false }
      );

      return {
        hasAccess: accessResult.granted,
        reason: accessResult.reason,
        restrictions: accessResult.restrictions || [],
        permissions: {
          canViewBasicInfo: accessResult.granted,
          canViewMedicalRecords: accessResult.granted && !accessResult.restrictions?.includes('medical_records'),
          canViewLabResults: accessResult.granted && !accessResult.restrictions?.includes('lab_results'),
          canExportData: accessResult.granted,
        },
      };

    } catch (error) {
      console.error(`[CompatibilityLayer] Access validation failed for patient ${patientId}:`, error);
      return {
        hasAccess: false,
        reason: `Access validation error: ${error}`,
        restrictions: [],
        permissions: {
          canViewBasicInfo: false,
          canViewMedicalRecords: false,
          canViewLabResults: false,
          canExportData: false,
        },
      };
    }
  }

  /**
   * Transform legacy export options to modern format
   */
  private transformLegacyOptions(legacyOptions: LegacyExportOptions): ExportOptions {
    return {
      format: legacyOptions.format || 'json',
      categories: legacyOptions.dataTypes || ['medical_records'],
      dateRange: legacyOptions.dateRange ? {
        from: new Date(legacyOptions.dateRange.startDate),
        to: new Date(legacyOptions.dateRange.endDate),
      } : undefined,
      language: legacyOptions.language || 'es',
      includeMetadata: legacyOptions.includeMetadata !== false,
      encryption: legacyOptions.encrypt === true,
      compression: legacyOptions.compress === true,
      customFields: legacyOptions.customOptions || {},
    };
  }

  /**
   * Transform legacy metadata to modern format
   */
  private transformLegacyMetadata(legacyOptions: LegacyExportOptions): Partial<RequestMetadata> {
    return {
      source: 'web',
      tags: legacyOptions.tags || [],
      correlationId: legacyOptions.correlationId,
    };
  }

  /**
   * Determine priority from legacy options
   */
  private determinePriority(legacyOptions: LegacyExportOptions): RequestPriority {
    if (legacyOptions.urgent === true) {
      return RequestPriority.URGENT;
    }
    if (legacyOptions.priority === 'high') {
      return RequestPriority.HIGH;
    }
    if (legacyOptions.priority === 'low') {
      return RequestPriority.LOW;
    }
    return RequestPriority.NORMAL;
  }

  /**
   * Transform modern result to legacy format
   */
  private transformResultToLegacy(
    modernResult: ExportResult,
    legacyOptions: LegacyExportOptions
  ): LegacyExportResult {
    return {
      success: true,
      exportId: this.extractExportIdFromUrl(modernResult.url),
      downloadUrl: modernResult.url,
      fileSize: modernResult.size,
      checksum: modernResult.checksum || '',
      format: legacyOptions.format || 'json',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      metadata: {
        generatedAt: new Date(),
        requestedBy: '', // This would be filled from context
        dataTypes: legacyOptions.dataTypes || [],
      },
    };
  }

  /**
   * Transform modern status to legacy format
   */
  private transformStatusToLegacy(modernStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'queued',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'expired': 'expired',
      'retrying': 'retrying',
    };

    return statusMap[modernStatus] || modernStatus;
  }

  /**
   * Extract export ID from download URL
   */
  private extractExportIdFromUrl(url: string): string {
    const match = url.match(/\/exports\/download\/([^\/]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Get format display name
   */
  private getFormatDisplayName(format: string): string {
    const names: Record<string, string> = {
      'json': 'JSON',
      'csv': 'CSV',
      'pdf': 'PDF',
      'zip': 'ZIP Archive',
      'fhir': 'FHIR R4',
    };
    return names[format] || format.toUpperCase();
  }

  /**
   * Get format description
   */
  private getFormatDescription(format: string): string {
    const descriptions: Record<string, string> = {
      'json': 'Structured JSON format for developers and systems integration',
      'csv': 'Comma-separated values for spreadsheet applications',
      'pdf': 'Formatted PDF document for printing and sharing',
      'zip': 'Compressed archive containing multiple file formats',
      'fhir': 'FHIR R4 standard for healthcare interoperability',
    };
    return descriptions[format] || `${format.toUpperCase()} format export`;
  }

  /**
   * Get format file extension
   */
  private getFormatExtension(format: string): string {
    const extensions: Record<string, string> = {
      'json': '.json',
      'csv': '.csv',
      'pdf': '.pdf',
      'zip': '.zip',
      'fhir': '.json',
    };
    return extensions[format] || `.${format}`;
  }

  /**
   * Estimate export size for legacy validation
   */
  private estimateExportSize(options: ExportOptions): number {
    // Base size estimation (simplified)
    const baseSize = options.categories.length * 1024 * 1024; // 1MB per category

    // Adjust for format
    const formatMultipliers: Record<string, number> = {
      'json': 1.0,
      'csv': 0.7,
      'pdf': 2.5,
      'zip': 0.3,
      'fhir': 1.8,
    };

    return Math.round(baseSize * (formatMultipliers[options.format] || 1.0));
  }

  /**
   * Estimate processing time for legacy validation
   */
  private estimateProcessingTime(options: ExportOptions): number {
    // Base time: 30 seconds + 10 seconds per category
    const baseTime = 30000 + (options.categories.length * 10000);

    // Add encryption overhead
    if (options.encryption) {
      return Math.round(baseTime * 1.5);
    }

    return baseTime;
  }
}

// Legacy interfaces for backward compatibility
export interface LegacyExportOptions {
  format?: string;
  dataTypes?: string[];
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  language?: string;
  includeMetadata?: boolean;
  encrypt?: boolean;
  compress?: boolean;
  urgent?: boolean;
  priority?: 'low' | 'normal' | 'high';
  customOptions?: Record<string, any>;
  tags?: string[];
  correlationId?: string;
}

export interface LegacyExportResult {
  success: boolean;
  exportId: string;
  downloadUrl: string;
  fileSize: number;
  checksum: string;
  format: string;
  expiresAt: Date;
  metadata: {
    generatedAt: Date;
    requestedBy: string;
    dataTypes: string[];
  };
}

export interface LegacyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  estimatedSize: number;
  estimatedDuration: number;
}

export interface LegacyExportStatus {
  found: boolean;
  status: string;
  progress: number;
  message: string;
  completedAt?: Date;
  downloadUrl?: string;
}

export interface LegacyFormatInfo {
  format: string;
  name: string;
  description: string;
  fileExtension: string;
  supportedLanguages: string[];
  maxSize?: number;
  supportsEncryption: boolean;
}

export interface LegacyAccessResult {
  hasAccess: boolean;
  reason?: string;
  restrictions: string[];
  permissions: {
    canViewBasicInfo: boolean;
    canViewMedicalRecords: boolean;
    canViewLabResults: boolean;
    canExportData: boolean;
  };
}

// Export singleton instance
export const compatibilityLayerService = new CompatibilityLayerService();