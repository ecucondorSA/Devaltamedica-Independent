/**
 * Legacy Compatibility Module
 * Maintains backward compatibility with original PatientDataExportService
 */

import { compatibilityLayerService } from './compatibility-layer.service';

export {
  CompatibilityLayerService,
  compatibilityLayerService,
  type LegacyExportOptions,
  type LegacyExportResult,
  type LegacyValidationResult,
  type LegacyExportStatus,
  type LegacyFormatInfo,
  type LegacyAccessResult,
} from './compatibility-layer.service';

/**
 * Legacy PatientDataExportService class
 * Drop-in replacement for the original 1,630-line God File
 * 
 * Usage:
 * ```typescript
 * import { PatientDataExportService } from '@altamedica/shared/services/patient-export/legacy';
 * 
 * const exportService = new PatientDataExportService();
 * const result = await exportService.exportPatientData(patientId, userId, options);
 * ```
 */
export class PatientDataExportService {
  private readonly compatibility = compatibilityLayerService;

  /**
   * Main export method - maintains original signature
   */
  async exportPatientData(
    patientId: string,
    requestedBy: string,
    options: any
  ) {
    return this.compatibility.exportPatientData(patientId, requestedBy, options);
  }

  /**
   * Validate export request - maintains original signature
   */
  async validateExportRequest(
    patientId: string,
    requestedBy: string,
    options: any
  ) {
    return this.compatibility.validateExportRequest(patientId, requestedBy, options);
  }

  /**
   * Get export status - maintains original signature
   */
  async getExportStatus(exportId: string) {
    return this.compatibility.getExportStatus(exportId);
  }

  /**
   * Cancel export - maintains original signature
   */
  async cancelExport(exportId: string, reason?: string) {
    return this.compatibility.cancelExport(exportId, reason);
  }

  /**
   * Retry export - maintains original signature
   */
  async retryExport(exportId: string) {
    return this.compatibility.retryExport(exportId);
  }

  /**
   * Get available formats - maintains original signature
   */
  getAvailableFormats() {
    return this.compatibility.getAvailableFormats();
  }

  /**
   * Validate patient access - maintains original signature
   */
  async validatePatientAccess(patientId: string, requestedBy: string) {
    return this.compatibility.validatePatientAccess(patientId, requestedBy);
  }
}

// Export default instance for backward compatibility
export const patientDataExportService = new PatientDataExportService();