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
  RequestStatus
} from './types';

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
      console.log(`[RequestManager] Creating export request for patient ${patientId}`);

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

      console.log(`[RequestManager] Export request created successfully: ${request.id}`);
      return request;
    } catch (error) {
      console.error('[RequestManager] Failed to create export request:', error);
      throw error;
    }
  }

  /**
   * Start processing a request
   */
  async startProcessing(requestId: string): Promise<void> {
    try {
      console.log(`[RequestManager] Starting processing for request ${requestId}`);

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

      console.log(`[RequestManager] Processing started for request ${requestId}`);
    } catch (error) {
      console.error(`[RequestManager] Failed to start processing for ${requestId}:`, error);
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
      // Update progress in lifecycle service
      await this.lifecycle.updateProgress(requestId, {
        stage: stage as any,
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

      console.log(`[RequestManager] Progress updated for ${requestId}: ${progress}%`);
    } catch (error) {
      console.error(`[RequestManager] Failed to update progress for ${requestId}:`, error);
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
      console.log(`[RequestManager] Completing request ${requestId}`);

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

      console.log(`[RequestManager] Request ${requestId} completed successfully`);
    } catch (error) {
      console.error(`[RequestManager] Failed to complete request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Fail request with error details
   */
  async failRequest(
    requestId: string,
    errorMessage: string,
    errorDetails?: any,
    retryable: boolean = true
  ): Promise<void> {
    try {
      console.log(`[RequestManager] Failing request ${requestId}: ${errorMessage}`);

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

      console.log(`[RequestManager] Request ${requestId} marked as failed`);
    } catch (error) {
      console.error(`[RequestManager] Failed to mark request ${requestId} as failed:`, error);
      throw error;
    }
  }

  /**
   * Cancel request
   */
  async cancelRequest(requestId: string, reason: string): Promise<void> {
    try {
      console.log(`[RequestManager] Cancelling request ${requestId}: ${reason}`);

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

      console.log(`[RequestManager] Request ${requestId} cancelled successfully`);
    } catch (error) {
      console.error(`[RequestManager] Failed to cancel request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Retry failed request
   */
  async retryRequest(requestId: string): Promise<boolean> {
    try {
      console.log(`[RequestManager] Retrying request ${requestId}`);

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

      console.log(`[RequestManager] Retry ${canRetry ? 'successful' : 'failed'} for ${requestId}`);
      return canRetry;
    } catch (error) {
      console.error(`[RequestManager] Failed to retry request ${requestId}:`, error);
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
      console.log('[RequestManager] Searching requests with filters:', filter);

      // This would be implemented with proper database queries
      // For now, returning empty array as placeholder
      return [];
    } catch (error) {
      console.error('[RequestManager] Request search failed:', error);
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
      console.error(`[RequestManager] Failed to get requests by status ${status}:`, error);
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
      console.error('[RequestManager] Failed to get retryable requests:', error);
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
      console.log('[RequestManager] Calculating request statistics');

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
      console.error('[RequestManager] Failed to calculate statistics:', error);
      throw error;
    }
  }

  /**
   * Clean up expired requests
   */
  async cleanupExpiredRequests(): Promise<number> {
    try {
      const cleanedCount = await this.lifecycle.cleanupExpiredRequests();
      console.log(`[RequestManager] Cleaned up ${cleanedCount} expired requests`);
      return cleanedCount;
    } catch (error) {
      console.error('[RequestManager] Cleanup failed:', error);
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
      console.error('[RequestManager] Failed to get system capacity:', error);
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
        console.error(`[RequestManager] Failed to cancel ${requestId}:`, error);
        results.failed.push(requestId);
      }
    }

    console.log(`[RequestManager] Bulk cancel completed: ${results.successful.length} successful, ${results.failed.length} failed`);
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
        console.error(`[RequestManager] Failed to retry ${requestId}:`, error);
        results.failed.push(requestId);
      }
    }

    console.log(`[RequestManager] Bulk retry completed: ${results.successful.length} successful, ${results.failed.length} failed`);
    return results;
  }
}

// Export singleton instance
export const requestManagerService = new RequestManagerService();