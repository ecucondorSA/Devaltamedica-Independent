/**
 * Request Management Module
 * Centralized export request lifecycle management
 */

// Core Services
export { RequestLifecycleService, requestLifecycleService } from './request-lifecycle.service';
export { RequestNotificationService, requestNotificationService } from './notification.service';
export { RequestManagerService, requestManagerService } from './request-manager.service';

// Types and Enums
export type {
  ExportRequest,
  ExportOptions,
  RequestMetadata,
  RequestProgress,
  RequestValidation,
  RequestNotification,
  RequestConfiguration,
  ValidationRule,
  RequestSearchFilter,
  RequestStatistics,
} from './types';

export {
  RequestStatus,
  RequestPriority,
  ProcessingStage,
  NotificationType,
} from './types';

// Unified Request Manager (recommended interface)
export class RequestManager {
  private static instance: RequestManagerService;

  /**
   * Get singleton instance of Request Manager
   */
  static getInstance(): RequestManagerService {
    if (!this.instance) {
      this.instance = requestManagerService;
    }
    return this.instance;
  }

  /**
   * Create export request with full lifecycle management
   */
  static async createExportRequest(
    patientId: string,
    requestedBy: string,
    exportOptions: ExportOptions,
    metadata?: Partial<RequestMetadata>,
    priority?: RequestPriority
  ) {
    return this.getInstance().createExportRequest(
      patientId,
      requestedBy,
      exportOptions,
      metadata,
      priority
    );
  }

  /**
   * Update request progress with notifications
   */
  static async updateProgress(
    requestId: string,
    progress: number,
    stage: string,
    message: string,
    estimatedTimeRemaining?: number
  ) {
    return this.getInstance().updateProgress(
      requestId,
      progress,
      stage,
      message,
      estimatedTimeRemaining
    );
  }

  /**
   * Complete request with download notifications
   */
  static async completeRequest(
    requestId: string,
    downloadUrl: string,
    fileSize: number,
    checksum?: string
  ) {
    return this.getInstance().completeRequest(
      requestId,
      downloadUrl,
      fileSize,
      checksum
    );
  }

  /**
   * Fail request with error notifications
   */
  static async failRequest(
    requestId: string,
    errorMessage: string,
    errorDetails?: any,
    retryable?: boolean
  ) {
    return this.getInstance().failRequest(
      requestId,
      errorMessage,
      errorDetails,
      retryable
    );
  }

  /**
   * Get request details
   */
  static async getRequest(requestId: string) {
    return this.getInstance().getRequest(requestId);
  }

  /**
   * Get system capacity
   */
  static async getSystemCapacity() {
    return this.getInstance().getSystemCapacity();
  }
}

// Export singleton for direct use
export const requestManager = RequestManager.getInstance();