import { getFirebaseFirestore } from '@altamedica/firebase/client';
import { v4 as uuidv4 } from 'uuid';
import {
  ExportOptions,
  ExportRequest,
  ProcessingStage,
  RequestConfiguration,
  RequestMetadata,
  RequestPriority,
  RequestProgress,
  RequestStatus,
  RequestValidation
} from './types';

/**
 * Request Lifecycle Service
 * Manages the complete lifecycle of export requests
 * Extracted from lines 184-231 of original PatientDataExportService
 * Enhanced with comprehensive request management and validation
 */

export class RequestLifecycleService {
  private readonly db = getFirebaseFirestore();
  private readonly collectionName = 'export_requests';
  private readonly progressCollectionName = 'request_progress';

  private configuration: RequestConfiguration = {
    maxConcurrentRequests: 10,
    defaultPriority: RequestPriority.NORMAL,
    timeoutDuration: 1800000, // 30 minutes
    retryIntervals: [5000, 15000, 60000, 300000], // 5s, 15s, 1m, 5m
    notificationSettings: {
      enableEmailNotifications: true,
      enableWebPushNotifications: true,
      enableSMSNotifications: false,
    },
    validationRules: [],
  };

  /**
   * Create a new export request
   */
  async createRequest(
    patientId: string,
    requestedBy: string,
    exportOptions: ExportOptions,
    metadata: Partial<RequestMetadata> = {},
    priority: RequestPriority = RequestPriority.NORMAL
  ): Promise<ExportRequest> {
    try {
      console.log(`[RequestLifecycle] Creating export request for patient ${patientId}`);

      // Validate input parameters
      this.validateCreateRequestParams(patientId, requestedBy, exportOptions);

      // Generate request ID
      const requestId = uuidv4();

      // Create complete metadata
      const completeMetadata: RequestMetadata = {
        source: 'web',
        tags: [],
        ...metadata,
      };

      // Create request object
      const request: ExportRequest = {
        id: requestId,
        patientId,
        requestedBy,
        status: RequestStatus.PENDING,
        priority,
        exportOptions,
        createdAt: new Date(),
        updatedAt: new Date(),
        retryCount: 0,
        maxRetries: this.configuration.retryIntervals.length,
        metadata: completeMetadata,
      };

      // Validate request according to business rules
      const validation = await this.validateRequest(request);
      if (!validation.isValid) {
        throw new Error(`Request validation failed: ${validation.errors.join(', ')}`);
      }

      // Add estimated completion time
      request.estimatedCompletionAt = this.calculateEstimatedCompletion(validation.estimatedDuration);

      // Store in database
      await this.storeRequest(request);

      // Initialize progress tracking
      await this.initializeProgress(requestId);

      console.log(`[RequestLifecycle] Request created successfully: ${requestId}`);
      return request;
    } catch (error) {
      console.error('[RequestLifecycle] Failed to create request:', error);
      throw new Error(`Failed to create export request: ${error}`);
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    message?: string,
    errorDetails?: any
  ): Promise<void> {
    try {
      const updates: Partial<ExportRequest> = {
        status,
        updatedAt: new Date(),
      };

      if (status === RequestStatus.COMPLETED) {
        updates.completedAt = new Date();
      }

      if (status === RequestStatus.FAILED && errorDetails) {
        updates.errorMessage = typeof errorDetails === 'string' 
          ? errorDetails 
          : JSON.stringify(errorDetails);
      }

      // Update in database
      const docRef = this.db.collection(this.collectionName).doc(requestId);
      await docRef.update(updates);

      // Update progress
      if (message) {
        await this.updateProgress(requestId, {
          stage: this.getStageFromStatus(status),
          progress: status === RequestStatus.COMPLETED ? 100 : 0,
          message,
          errorDetails,
        });
      }

      console.log(`[RequestLifecycle] Status updated for ${requestId}: ${status}`);
    } catch (error) {
      console.error(`[RequestLifecycle] Failed to update status for ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Update request progress
   */
  async updateProgress(
    requestId: string,
    progressUpdate: Partial<RequestProgress>
  ): Promise<void> {
    try {
      const progress: RequestProgress = {
        requestId,
        stage: ProcessingStage.VALIDATION,
        progress: 0,
        message: 'Processing...',
        ...progressUpdate,
      };

      const docRef = this.db.collection(this.progressCollectionName).doc(requestId);
      await docRef.set(progress, { merge: true });

      console.log(`[RequestLifecycle] Progress updated for ${requestId}: ${progress.progress}%`);
    } catch (error) {
      console.error(`[RequestLifecycle] Failed to update progress for ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get request by ID
   */
  async getRequest(requestId: string): Promise<ExportRequest | null> {
    try {
      const doc = await this.db.collection(this.collectionName).doc(requestId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        completedAt: data.completedAt?.toDate(),
        estimatedCompletionAt: data.estimatedCompletionAt?.toDate(),
      } as ExportRequest;
    } catch (error) {
      console.error(`[RequestLifecycle] Failed to get request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get request progress
   */
  async getRequestProgress(requestId: string): Promise<RequestProgress | null> {
    try {
      const doc = await this.db.collection(this.progressCollectionName).doc(requestId).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as RequestProgress;
    } catch (error) {
      console.error(`[RequestLifecycle] Failed to get progress for ${requestId}:`, error);
      return null;
    }
  }

  /**
   * Cancel request
   */
  async cancelRequest(requestId: string, reason: string): Promise<void> {
    try {
      await this.updateRequestStatus(requestId, RequestStatus.CANCELLED, `Cancelled: ${reason}`);
      console.log(`[RequestLifecycle] Request ${requestId} cancelled: ${reason}`);
    } catch (error) {
      console.error(`[RequestLifecycle] Failed to cancel request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Retry failed request
   */
  async retryRequest(requestId: string): Promise<boolean> {
    try {
      const request = await this.getRequest(requestId);

      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== RequestStatus.FAILED) {
        throw new Error('Only failed requests can be retried');
      }

      if (request.retryCount >= request.maxRetries) {
        throw new Error('Maximum retry attempts exceeded');
      }

      // Update retry count and status
      const updates = {
        status: RequestStatus.RETRYING,
        retryCount: request.retryCount + 1,
        updatedAt: new Date(),
      };

      await this.db.collection(this.collectionName).doc(requestId).update(updates);

      console.log(`[RequestLifecycle] Request ${requestId} queued for retry (${updates.retryCount}/${request.maxRetries})`);
      return true;
    } catch (error) {
      console.error(`[RequestLifecycle] Failed to retry request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up expired requests
   */
  async cleanupExpiredRequests(): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - this.configuration.timeoutDuration);

      const expiredQuery = this.db
        .collection(this.collectionName)
        .where('status', 'in', [RequestStatus.PENDING, RequestStatus.PROCESSING])
        .where('createdAt', '<', cutoffDate);

      const expiredDocs = await expiredQuery.get();
      let cleanedCount = 0;

      for (const doc of expiredDocs.docs) {
        await this.updateRequestStatus(doc.id, RequestStatus.EXPIRED, 'Request expired due to timeout');
        cleanedCount++;
      }

      console.log(`[RequestLifecycle] Cleaned up ${cleanedCount} expired requests`);
      return cleanedCount;
    } catch (error) {
      console.error('[RequestLifecycle] Failed to cleanup expired requests:', error);
      return 0;
    }
  }

  /**
   * Get pending requests count
   */
  async getPendingRequestsCount(): Promise<number> {
    try {
      const snapshot = await this.db
        .collection(this.collectionName)
        .where('status', 'in', [RequestStatus.PENDING, RequestStatus.PROCESSING, RequestStatus.RETRYING])
        .get();

      return snapshot.size;
    } catch (error) {
      console.error('[RequestLifecycle] Failed to get pending requests count:', error);
      return 0;
    }
  }

  /**
   * Check if new requests can be accepted
   */
  async canAcceptNewRequest(): Promise<boolean> {
    const pendingCount = await this.getPendingRequestsCount();
    return pendingCount < this.configuration.maxConcurrentRequests;
  }

  /**
   * Validate request according to business rules
   */
  private async validateRequest(request: ExportRequest): Promise<RequestValidation> {
    const validation: RequestValidation = {
      isValid: true,
      errors: [],
      warnings: [],
      estimatedSize: 0,
      estimatedDuration: 0,
      requiresApproval: false,
    };

    try {
      // Basic validation
      if (!request.patientId) {
        validation.errors.push('Patient ID is required');
      }

      if (!request.requestedBy) {
        validation.errors.push('Requestor ID is required');
      }

      if (!request.exportOptions?.format) {
        validation.errors.push('Export format is required');
      }

      if (!request.exportOptions?.categories?.length) {
        validation.errors.push('At least one category must be selected');
      }

      // Apply custom validation rules
      for (const rule of this.configuration.validationRules) {
        try {
          if (!rule.condition(request)) {
            if (rule.severity === 'error') {
              validation.errors.push(rule.errorMessage);
            } else {
              validation.warnings.push(rule.errorMessage);
            }
          }
        } catch (error) {
          console.warn(`[RequestLifecycle] Validation rule '${rule.name}' failed:`, error);
        }
      }

      // Estimate size and duration
      validation.estimatedSize = this.estimateExportSize(request.exportOptions);
      validation.estimatedDuration = this.estimateProcessingDuration(validation.estimatedSize);

      // Check if approval is required (large exports)
      validation.requiresApproval = validation.estimatedSize > 100 * 1024 * 1024; // 100MB

      validation.isValid = validation.errors.length === 0;

      return validation;
    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Validation error: ${error}`);
      return validation;
    }
  }

  /**
   * Store request in database
   */
  private async storeRequest(request: ExportRequest): Promise<void> {
    const docRef = this.db.collection(this.collectionName).doc(request.id);
    await docRef.set(request);
  }

  /**
   * Initialize progress tracking
   */
  private async initializeProgress(requestId: string): Promise<void> {
    const initialProgress: RequestProgress = {
      requestId,
      stage: ProcessingStage.VALIDATION,
      progress: 0,
      message: 'Request created, awaiting processing',
    };

    await this.updateProgress(requestId, initialProgress);
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(estimatedDuration: number): Date {
    return new Date(Date.now() + estimatedDuration);
  }

  /**
   * Estimate export size
   */
  private estimateExportSize(options: ExportOptions): number {
    // Base size per category (rough estimation)
    const baseSizePerCategory = 1024 * 1024; // 1MB
    const categoriesCount = options.categories.length;

    let estimatedSize = baseSizePerCategory * categoriesCount;

    // Adjust for format
    switch (options.format.toLowerCase()) {
      case 'json':
        estimatedSize *= 1.0;
        break;
      case 'csv':
        estimatedSize *= 0.7;
        break;
      case 'pdf':
        estimatedSize *= 2.5;
        break;
      case 'zip':
        estimatedSize *= 0.3;
        break;
      default:
        estimatedSize *= 1.0;
    }

    return Math.round(estimatedSize);
  }

  /**
   * Estimate processing duration
   */
  private estimateProcessingDuration(estimatedSize: number): number {
    // Base processing time: 1 second per MB
    const baseDuration = Math.max(estimatedSize / (1024 * 1024), 5) * 1000;

    // Add overhead for security operations
    const securityOverhead = baseDuration * 0.3;

    return Math.round(baseDuration + securityOverhead);
  }

  /**
   * Get processing stage from status
   */
  private getStageFromStatus(status: RequestStatus): ProcessingStage {
    switch (status) {
      case RequestStatus.PENDING:
        return ProcessingStage.VALIDATION;
      case RequestStatus.PROCESSING:
        return ProcessingStage.DATA_COLLECTION;
      case RequestStatus.COMPLETED:
        return ProcessingStage.FINALIZATION;
      default:
        return ProcessingStage.VALIDATION;
    }
  }

  /**
   * Validate create request parameters
   */
  private validateCreateRequestParams(
    patientId: string,
    requestedBy: string,
    exportOptions: ExportOptions
  ): void {
    if (!patientId?.trim()) {
      throw new Error('Patient ID is required');
    }

    if (!requestedBy?.trim()) {
      throw new Error('Requestor ID is required');
    }

    if (!exportOptions) {
      throw new Error('Export options are required');
    }

    if (!exportOptions.format?.trim()) {
      throw new Error('Export format is required');
    }

    if (!exportOptions.categories?.length) {
      throw new Error('At least one category must be specified');
    }
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<RequestConfiguration>): void {
    this.configuration = { ...this.configuration, ...config };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): RequestConfiguration {
    return { ...this.configuration };
  }
}

// Export singleton instance
export const requestLifecycleService = new RequestLifecycleService();