import { requestNotificationService } from './notification.service';
import { requestLifecycleService } from './request-lifecycle.service';
import {
  ExportOptions,
  ExportRequest,
  NotificationType,
  RequestMetadata,
  RequestPriority,
  RequestProgress,
  RequestSearchFilter,
  RequestStatistics,
  RequestStatus,
  ProcessingStage
} from './types';
import { logger } from '../../logger.service';

/**
 * Request Manager Service
 * Unified interface for managing export requests
 * Orchestrates lifecycle, notifications, and status management
 * Provides high-level API for request operations
 */

export class RequestManagerService {
  private readonly lifecycle = requestLifecycleService;
  private readonly notifications = requestNotificationService;

  /**
   * Create and initiate export request
   */
  async createExportRequest(
    patientId: string,
    requestedBy: string,
    exportOptions: ExportOptions,
    metadata: Partial<RequestMetadata> = {},
    priority: RequestPriority = RequestPriority.NORMAL
  ): Promise<ExportRequest> {
    try {
      logger.info(`Creating export request for patient ${patientId}`, 'RequestManager');

      // Check if system can accept new requests
      if (!(await this.lifecycle.canAcceptNewRequest())) {
        throw new Error('System is at maximum capacity. Please try again later.');
      }

      // Create the request
      const request = await this.lifecycle.createRequest(
        patientId,
        requestedBy,
        exportOptions,
        metadata,
        priority
      );

      // Send creation notification
      await this.notifications.sendRequestNotification(
        request,
        NotificationType.REQUEST_CREATED
      );

      logger.info(`Export request created successfully: ${request.id}`, 'RequestManager');
      return request;
    } catch (error) {
      logger.error('Failed to create export request', 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Start processing a request
   */
  async startProcessing(requestId: string): Promise<void> {
    try {
      logger.info(`Starting processing for request ${requestId}`, 'RequestManager');

      const request = await this.lifecycle.getRequest(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new Error(`Request ${requestId} is not in pending state`);
      }

      // Update status to processing
      await this.lifecycle.updateRequestStatus(
        requestId,
        RequestStatus.PROCESSING,
        'Export processing started'
      );

      // Send processing notification
      await this.notifications.sendRequestNotification(
        request,
        NotificationType.PROCESSING_STARTED
      );

      logger.info(`Processing started for request ${requestId}`, 'RequestManager');
    } catch (error) {
      logger.error(`Failed to start processing for ${requestId}`, 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Update request progress
   */
  async updateProgress(
    requestId: string,
    progress: number,
    stage: string,
    message: string,
    estimatedTimeRemaining?: number
  ): Promise<void> {
    try {
      const stageEnum: ProcessingStage = (Object.values(ProcessingStage) as string[]).includes(stage)
        ? (stage as ProcessingStage)
        : ProcessingStage.VALIDATION;
      // Update progress in lifecycle service
      await this.lifecycle.updateProgress(requestId, {
        stage: stageEnum,
        progress,
        message,
        estimatedTimeRemaining,
        currentOperation: stage,
      });

      // Send progress notification if at milestone
      const request = await this.lifecycle.getRequest(requestId);
      if (request) {
        await this.notifications.sendProgressUpdate(
          request,
          progress,
          stage,
          estimatedTimeRemaining
        );
      }

      logger.info(`Progress updated for ${requestId}: ${progress}%`, 'RequestManager');
    } catch (error) {
      logger.error(`Failed to update progress for ${requestId}`, 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Complete request successfully
   */
  async completeRequest(
    requestId: string,
    downloadUrl: string,
    fileSize: number,
    checksum?: string
  ): Promise<void> {
    try {
      logger.info(`Completing request ${requestId}`, 'RequestManager');

      const request = await this.lifecycle.getRequest(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      // Update status to completed
      await this.lifecycle.updateRequestStatus(
        requestId,
        RequestStatus.COMPLETED,
        'Export completed successfully'
      );

      // Calculate expiry (24 hours from now)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Send completion notification
      await this.notifications.sendCompletionNotification(
        request,
        downloadUrl,
        fileSize,
        expiresAt
      );

      logger.info(`Request ${requestId} completed successfully`, 'RequestManager');
    } catch (error) {
      logger.error(`Failed to complete request ${requestId}`, 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Fail request with error details
   */
  async failRequest(
    requestId: string,
    errorMessage: string,
    errorDetails?: unknown,
    retryable: boolean = true
  ): Promise<void> {
    try {
      logger.warn(`Failing request ${requestId}: ${errorMessage}`, 'RequestManager');

      const request = await this.lifecycle.getRequest(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      // Update status to failed
      await this.lifecycle.updateRequestStatus(
        requestId,
        RequestStatus.FAILED,
        `Export failed: ${errorMessage}`,
        errorDetails
      );

      // Send failure notification
      await this.notifications.sendFailureNotification(
        request,
        errorMessage,
        retryable && request.retryCount < request.maxRetries
      );

      logger.warn(`Request ${requestId} marked as failed`, 'RequestManager');
    } catch (error) {
      logger.error(`Failed to mark request ${requestId} as failed`, 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Cancel request
   */
  async cancelRequest(requestId: string, reason: string): Promise<void> {
    try {
      logger.warn(`Cancelling request ${requestId}: ${reason}`, 'RequestManager');

      const request = await this.lifecycle.getRequest(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      // Update status to cancelled
      await this.lifecycle.cancelRequest(requestId, reason);

      // Send cancellation notification
      await this.notifications.sendRequestNotification(
        request,
        NotificationType.CANCELLED,
        { reason }
      );

      logger.info(`Request ${requestId} cancelled successfully`, 'RequestManager');
    } catch (error) {
      logger.error(`Failed to cancel request ${requestId}`, 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Retry failed request
   */
  async retryRequest(requestId: string): Promise<boolean> {
    try {
      logger.info(`Retrying request ${requestId}`, 'RequestManager');

      const request = await this.lifecycle.getRequest(requestId);
      if (!request) {
        throw new Error('Request not found');
      }

      const canRetry = await this.lifecycle.retryRequest(requestId);

      if (canRetry) {
        // Send retry notification
        await this.notifications.sendRequestNotification(
          request,
          NotificationType.PROCESSING_STARTED,
          { isRetry: true, retryAttempt: request.retryCount + 1 }
        );
      }

      logger.info(`Retry ${canRetry ? 'successful' : 'failed'} for ${requestId}`, 'RequestManager');
      return canRetry;
    } catch (error) {
      logger.error(`Failed to retry request ${requestId}`, 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Get request by ID
   */
  async getRequest(requestId: string): Promise<ExportRequest | null> {
    return await this.lifecycle.getRequest(requestId);
  }

  /**
   * Get request progress
   */
  async getRequestProgress(requestId: string): Promise<RequestProgress | null> {
    return await this.lifecycle.getRequestProgress(requestId);
  }

  /**
   * Search requests with filters
   */
  async searchRequests(
    filter: RequestSearchFilter,
    limit: number = 50,
    offset: number = 0
  ): Promise<ExportRequest[]> {
    try {
      logger.info('Searching requests with filters', 'RequestManager', filter);

      // This would be implemented with proper database queries
      // For now, returning empty array as placeholder
      return [];
    } catch (error) {
      logger.error('Request search failed', 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Get requests by status
   */
  async getRequestsByStatus(
    status: RequestStatus,
    limit: number = 50
  ): Promise<ExportRequest[]> {
    try {
      return await this.searchRequests({ status: [status] }, limit);
    } catch (error) {
      logger.error(`Failed to get requests by status ${status}`, 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Get pending requests
   */
  async getPendingRequests(limit: number = 50): Promise<ExportRequest[]> {
    return await this.getRequestsByStatus(RequestStatus.PENDING, limit);
  }

  /**
   * Get processing requests
   */
  async getProcessingRequests(limit: number = 50): Promise<ExportRequest[]> {
    return await this.getRequestsByStatus(RequestStatus.PROCESSING, limit);
  }

  /**
   * Get failed requests that can be retried
   */
  async getRetryableRequests(limit: number = 50): Promise<ExportRequest[]> {
    try {
      const failedRequests = await this.getRequestsByStatus(RequestStatus.FAILED, limit);
      return failedRequests.filter(request => request.retryCount < request.maxRetries);
    } catch (error) {
      logger.error('Failed to get retryable requests', 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Get request statistics
   */
  async getRequestStatistics(
    dateRange?: { from: Date; to: Date }
  ): Promise<RequestStatistics> {
    try {
      logger.info('Calculating request statistics', 'RequestManager');

      // This would be implemented with proper database aggregation
      // For now, returning mock statistics
      return {
        total: 0,
        byStatus: {
          [RequestStatus.PENDING]: 0,
          [RequestStatus.PROCESSING]: 0,
          [RequestStatus.COMPLETED]: 0,
          [RequestStatus.FAILED]: 0,
          [RequestStatus.CANCELLED]: 0,
          [RequestStatus.EXPIRED]: 0,
          [RequestStatus.RETRYING]: 0,
        },
        byPriority: {
          [RequestPriority.LOW]: 0,
          [RequestPriority.NORMAL]: 0,
          [RequestPriority.HIGH]: 0,
          [RequestPriority.URGENT]: 0,
          [RequestPriority.EMERGENCY]: 0,
        },
        averageProcessingTime: 0,
        successRate: 0,
        failureRate: 0,
        retryRate: 0,
      };
    } catch (error) {
      logger.error('Failed to calculate statistics', 'RequestManager', error);
      throw error;
    }
  }

  /**
   * Clean up expired requests
   */
  async cleanupExpiredRequests(): Promise<number> {
    try {
      const cleanedCount = await this.lifecycle.cleanupExpiredRequests();
      logger.info(`Cleaned up ${cleanedCount} expired requests`, 'RequestManager');
      return cleanedCount;
    } catch (error) {
      logger.error('Cleanup failed', 'RequestManager', error);
      return 0;
    }
  }

  /**
   * Get system capacity status
   */
  async getSystemCapacity(): Promise<{
    canAcceptNewRequests: boolean;
    pendingCount: number;
    maxConcurrent: number;
    utilizationPercentage: number;
  }> {
    try {
      const pendingCount = await this.lifecycle.getPendingRequestsCount();
      const maxConcurrent = this.lifecycle.getConfiguration().maxConcurrentRequests;
      const canAccept = await this.lifecycle.canAcceptNewRequest();
      const utilization = Math.round((pendingCount / maxConcurrent) * 100);

      return {
        canAcceptNewRequests: canAccept,
        pendingCount,
        maxConcurrent,
        utilizationPercentage: utilization,
      };
    } catch (error) {
      logger.error('Failed to get system capacity', 'RequestManager', error);
      return {
        canAcceptNewRequests: false,
        pendingCount: 0,
        maxConcurrent: 0,
        utilizationPercentage: 100,
      };
    }
  }

  /**
   * Bulk operations for administrative tasks
   */
  async bulkCancelRequests(
    requestIds: string[],
    reason: string
  ): Promise<{ successful: string[]; failed: string[] }> {
    const results: { successful: string[]; failed: string[] } = { successful: [], failed: [] };

    for (const requestId of requestIds) {
      try {
        await this.cancelRequest(requestId, reason);
        results.successful.push(requestId);
      } catch (error) {
        logger.error(`Failed to cancel ${requestId}`, 'RequestManager', error);
        results.failed.push(requestId);
      }
    }

    logger.info(`Bulk cancel completed: ${results.successful.length} successful, ${results.failed.length} failed`, 'RequestManager');
    return results;
  }

  /**
   * Bulk retry failed requests
   */
  async bulkRetryRequests(
    requestIds: string[]
  ): Promise<{ successful: string[]; failed: string[] }> {
    const results: { successful: string[]; failed: string[] } = { successful: [], failed: [] };

    for (const requestId of requestIds) {
      try {
        const retried = await this.retryRequest(requestId);
        if (retried) {
          results.successful.push(requestId);
        } else {
          results.failed.push(requestId);
        }
      } catch (error) {
        logger.error(`Failed to retry ${requestId}`, 'RequestManager', error);
        results.failed.push(requestId);
      }
    }

    logger.info(`Bulk retry completed: ${results.successful.length} successful, ${results.failed.length} failed`, 'RequestManager');
    return results;
  }
}

// Export singleton instance
export const requestManagerService = new RequestManagerService();
