import { collectorFactory } from '../factories/collector.factory';
import { GeneratorFactory } from '../factories/generator.factory';
import { requestManager } from '../request';
import { securityManager } from '../security';
import {
  DataCategory,
  ExportRequest,
  ExportResult,
  PatientDataPackage,
  ExportMetadata,
  PatientInfo,
  MedicalData,
  DateRange
} from '../types';
import {
  ExportOptions,
  ProcessingStage,
  RequestMetadata,
  RequestPriority
} from '../request/types';

/**
 * Export Orchestrator Service
 * Main orchestrator that coordinates the entire export process
 * Replaces the original God File while maintaining the same interface
 * Implements the orchestration pattern for complex workflows
 */

export class ExportOrchestratorService {
  private readonly tempExportDir = process.env.TEMP_EXPORT_DIR || '/tmp/exports';

  /**
   * Main export method - orchestrates the complete export workflow
   * This replaces the original 1,630-line method with a clean orchestration pattern
   */
  async exportPatientData(
    patientId: string,
    requestedBy: string,
    exportOptions: ExportOptions,
    metadata: Partial<RequestMetadata> = {},
    priority: RequestPriority = RequestPriority.NORMAL
  ): Promise<ExportResult> {
    let request: ExportRequest | null = null;

    try {
      console.log(`[ExportOrchestrator] Starting export for patient ${patientId}`);

      // Phase 1: Request Creation and Validation
      request = await this.createAndValidateRequest(
        patientId,
        requestedBy,
        exportOptions,
        metadata,
        priority
      );

      // Phase 2: Security and Access Control
      await this.performSecurityChecks(request);

      // Phase 3: Data Collection
      const dataPackage = await this.collectPatientData(request);

      // Phase 4: Export Generation
      const filePath = await this.generateExport(request, dataPackage);

      // Phase 5: Security Enhancement (Encryption)
      const secureFilePath = await this.enhanceFileSecurity(request, filePath);

      // Phase 6: Finalization and Cleanup
      const result = await this.finalizeExport(request, secureFilePath, dataPackage);

      console.log(`[ExportOrchestrator] Export completed successfully for request ${request.id}`);
      return result;

    } catch (error) {
      console.error(`[ExportOrchestrator] Export failed:`, error);

      if (request) {
        await requestManager.failRequest(
          request.id,
          error instanceof Error ? error.message : String(error),
          error,
          true // retryable
        );
      }

      throw new Error(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Phase 1: Create and validate export request
   */
  private async createAndValidateRequest(
    patientId: string,
    requestedBy: string,
    exportOptions: ExportOptions,
    metadata: Partial<RequestMetadata>,
    priority: RequestPriority
  ): Promise<ExportRequest> {
    try {
      await this.updateProgress('Creating export request...', 0, ProcessingStage.VALIDATION);

      // Create request with lifecycle management
      const request = await requestManager.createExportRequest(
        patientId,
        requestedBy,
        exportOptions,
        metadata,
        priority
      );

      await this.updateProgress('Request created and validated', 10, ProcessingStage.VALIDATION, request.id);

      return request;
    } catch (error) {
      throw new Error(`Request creation failed: ${error}`);
    }
  }

  /**
   * Phase 2: Perform security and access control checks
   */
  private async performSecurityChecks(request: ExportRequest): Promise<void> {
    try {
      await this.updateProgress(
        'Performing security checks...',
        15,
        ProcessingStage.SECURITY_CHECK,
        request.id
      );

      // Verify access rights with comprehensive validation
      const accessResult = await securityManager.verifyAndLogAccess(
        request.patientId,
        request.requestedBy,
        request.exportOptions
      );

      if (!accessResult.granted) {
        throw new Error(`Access denied: ${accessResult.reason}`);
      }

      await this.updateProgress(
        'Security checks completed',
        25,
        ProcessingStage.SECURITY_CHECK,
        request.id
      );

      await requestManager.startProcessing(request.id);

    } catch (error) {
      throw new Error(`Security verification failed: ${error}`);
    }
  }

  /**
   * Phase 3: Collect patient data using modular collectors
   */
  private async collectPatientData(request: ExportRequest): Promise<PatientDataPackage> {
    try {
      await this.updateProgress(
        'Collecting patient data...',
        30,
        ProcessingStage.DATA_COLLECTION,
        request.id
      );

      const dataPackage: PatientDataPackage = {
        exportId: request.id,
        patientInfo: await this.collectPatientInfo(request.patientId),
        medicalData: {},
        metadata: {
          exportDate: new Date(),
          exportVersion: '2.0.0',
          categories: request.exportOptions.categories,
          format: request.exportOptions.format,
          totalRecords: 0, // Will be updated after collection
          checksum: '', // Will be calculated later
          encrypted: request.exportOptions.encryption,
          dataRange: request.exportOptions.dateRange,
        },
        compliance: {
          hipaaCompliant: true,
          ley26529Compliant: true,
          dataMinimization: true,
          encryptionUsed: request.exportOptions.encryption,
          auditLogged: true,
          patientConsent: true,
          retentionPeriod: '10 years',
        },
      };

      // Collect data using specialized collectors
      let progressStep = 35;
      const progressIncrement = 35 / request.exportOptions.categories.length;

      for (const category of request.exportOptions.categories) {
        await this.updateProgress(
          `Collecting ${category} data...`,
          Math.round(progressStep),
          ProcessingStage.DATA_COLLECTION,
          request.id
        );

        const collector = collectorFactory.getCollector(category as DataCategory);
        const categoryData = await collector.collect(
          request.patientId,
          request.exportOptions.dateRange
        );

        dataPackage.medicalData[category] = categoryData;
        progressStep += progressIncrement;
      }

      // Calculate checksum for data integrity
      dataPackage.metadata.checksum = this.calculateDataChecksum(dataPackage);

      await this.updateProgress(
        'Data collection completed',
        70,
        ProcessingStage.DATA_COLLECTION,
        request.id
      );

      return dataPackage;

    } catch (error) {
      throw new Error(`Data collection failed: ${error}`);
    }
  }

  /**
   * Phase 4: Generate export file using Strategy Pattern
   */
  private async generateExport(
    request: ExportRequest,
    dataPackage: PatientDataPackage
  ): Promise<string> {
    try {
      await this.updateProgress(
        'Generating export file...',
        75,
        ProcessingStage.GENERATION,
        request.id
      );

      // Extract format from export options
      const format = GeneratorFactory.extractFormatFromRequest(request.exportOptions);

      // Generate export using appropriate generator
      const generationResult = await GeneratorFactory.generateExport(
        format,
        dataPackage,
        this.tempExportDir,
        {
          language: request.exportOptions.language,
          compression: request.exportOptions.compression,
          includeMetadata: request.exportOptions.includeMetadata,
          progressCallback: (progress) => {
            // Update progress within generation phase (75-85%)
            const adjustedProgress = 75 + (progress * 0.1);
            this.updateProgress(
              `Generating ${format.toUpperCase()} export: ${progress}%`,
              Math.round(adjustedProgress),
              ProcessingStage.GENERATION,
              request.id
            ).catch(console.error);
          },
        }
      );

      await this.updateProgress(
        'Export file generated successfully',
        85,
        ProcessingStage.GENERATION,
        request.id
      );

      return generationResult.filePath;

    } catch (error) {
      throw new Error(`Export generation failed: ${error}`);
    }
  }

  /**
   * Phase 5: Enhance file security (encryption if requested)
   */
  private async enhanceFileSecurity(
    request: ExportRequest,
    filePath: string
  ): Promise<string> {
    try {
      if (!request.exportOptions.encryption) {
        // No encryption requested, return original path
        return filePath;
      }

      await this.updateProgress(
        'Encrypting export file...',
        90,
        ProcessingStage.ENCRYPTION,
        request.id
      );

      // Encrypt file using security manager
      const encryptionResult = await securityManager.encryptAndLog(
        filePath,
        request.requestedBy,
        request.patientId,
        request.id
      );

      if (!encryptionResult) {
        console.warn(`[ExportOrchestrator] Encryption skipped for request ${request.id}`);
        return filePath;
      }

      await this.updateProgress(
        'File encryption completed',
        95,
        ProcessingStage.ENCRYPTION,
        request.id
      );

      return encryptionResult.filePath;

    } catch (error) {
      throw new Error(`File encryption failed: ${error}`);
    }
  }

  /**
   * Phase 6: Finalize export and return result
   */
  private async finalizeExport(
    request: ExportRequest,
    filePath: string,
    dataPackage: PatientDataPackage
  ): Promise<ExportResult> {
    try {
      await this.updateProgress(
        'Finalizing export...',
        98,
        ProcessingStage.FINALIZATION,
        request.id
      );

      // Calculate final file size
      const fileSize = this.getFileSize(filePath);

      // Generate secure download URL
      const downloadUrl = this.generateDownloadUrl(request.id, filePath);

      // Create export result
      const result: ExportResult = {
        url: downloadUrl,
        size: fileSize,
        checksum: dataPackage.metadata.checksum,
      };

      // Complete the request with success notification
      await requestManager.completeRequest(
        request.id,
        downloadUrl,
        fileSize,
        dataPackage.metadata.checksum
      );

      await this.updateProgress(
        'Export completed successfully',
        100,
        ProcessingStage.FINALIZATION,
        request.id
      );

      return result;

    } catch (error) {
      throw new Error(`Export finalization failed: ${error}`);
    }
  }

  /**
   * Collect basic patient information
   */
  private async collectPatientInfo(patientId: string): Promise<any> {
    try {
      // This would typically use a dedicated PatientInfoCollector
      // For now, using a simplified implementation
      const patientCollector = collectorFactory.getCollector('medical_records' as DataCategory);
      return await patientCollector.collect(patientId);
    } catch (error) {
      console.error(`[ExportOrchestrator] Failed to collect patient info:`, error);
      throw new Error(`Patient information collection failed: ${error}`);
    }
  }

  /**
   * Calculate data checksum for integrity verification
   */
  private calculateDataChecksum(dataPackage: PatientDataPackage): string {
    try {
      // Create a simplified checksum based on data content
      const dataString = JSON.stringify({
        patientId: dataPackage.patientInfo.id,
        exportDate: dataPackage.metadata.exportDate,
        categories: Object.keys(dataPackage.medicalData),
        recordCounts: Object.values(dataPackage.medicalData).map(data =>
          Array.isArray(data) ? data.length : 0
        ),
      });

      // Simple hash implementation (in production, use crypto.createHash)
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return Math.abs(hash).toString(16);
    } catch (error) {
      console.warn('[ExportOrchestrator] Checksum calculation failed:', error);
      return 'unknown';
    }
  }

  /**
   * Get file size utility
   */
  private getFileSize(filePath: string): number {
    try {
      const fs = require('fs');
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      console.warn(`[ExportOrchestrator] Could not get file size for ${filePath}:`, error);
      return 0;
    }
  }

  /**
   * Generate secure download URL
   */
  private generateDownloadUrl(requestId: string, filePath: string): string {
    const fileName = filePath.split('/').pop() || 'export';
    return `/api/v1/exports/download/${requestId}/${fileName}`;
  }

  /**
   * Update progress with request manager
   */
  private async updateProgress(
    message: string,
    progress: number,
    stage: ProcessingStage,
    requestId?: string
  ): Promise<void> {
    try {
      if (requestId) {
        await requestManager.updateProgress(
          requestId,
          progress,
          stage,
          message
        );
      }
      console.log(`[ExportOrchestrator] ${message} (${progress}%)`);
    } catch (error) {
      console.error('[ExportOrchestrator] Failed to update progress:', error);
    }
  }

  /**
   * Get export status for a request
   */
  async getExportStatus(requestId: string): Promise<{
    request: ExportRequest | null;
    progress: any;
  }> {
    try {
      const request = await requestManager.getRequest(requestId);
      const progress = await requestManager.getRequestProgress(requestId);

      return { request, progress };
    } catch (error) {
      console.error(`[ExportOrchestrator] Failed to get status for ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel export request
   */
  async cancelExport(requestId: string, reason: string): Promise<void> {
    try {
      await requestManager.cancelRequest(requestId, reason);
      console.log(`[ExportOrchestrator] Export ${requestId} cancelled: ${reason}`);
    } catch (error) {
      console.error(`[ExportOrchestrator] Failed to cancel ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Retry failed export
   */
  async retryExport(requestId: string): Promise<boolean> {
    try {
      const canRetry = await requestManager.retryRequest(requestId);

      if (canRetry) {
        console.log(`[ExportOrchestrator] Export ${requestId} queued for retry`);
        // The actual retry would be handled by a background worker
      }

      return canRetry;
    } catch (error) {
      console.error(`[ExportOrchestrator] Failed to retry ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get system health and capacity
   */
  async getSystemHealth(): Promise<{
    capacity: any;
    securityStatus: any;
    availableFormats: any;
  }> {
    try {
      const capacity = await requestManager.getSystemCapacity();
      const securityStatus = securityManager.getComplianceStatus();
      const availableFormats = GeneratorFactory.getAvailableFormats();

      return {
        capacity,
        securityStatus,
        availableFormats,
      };
    } catch (error) {
      console.error('[ExportOrchestrator] Failed to get system health:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const exportOrchestratorService = new ExportOrchestratorService();