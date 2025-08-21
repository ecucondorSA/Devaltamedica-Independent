/**
 * Request Management Types
 * Centralized types for export request lifecycle management
 */

export interface ExportRequest {
  id: string;
  patientId: string;
  requestedBy: string;
  status: RequestStatus;
  priority: RequestPriority;
  exportOptions: ExportOptions;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  estimatedCompletionAt?: Date;
  retryCount: number;
  maxRetries: number;
  metadata: RequestMetadata;
}

export enum RequestStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  RETRYING = 'retrying'
}

export enum RequestPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export interface ExportOptions {
  format: string;
  categories: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  language: string;
  includeMetadata: boolean;
  encryption: boolean;
  compression: boolean;
  customFields?: Record<string, any>;
}

export interface RequestMetadata {
  source: 'web' | 'api' | 'mobile' | 'admin';
  userAgent?: string;
  ipAddress?: string;
  estimatedSize?: number;
  estimatedDuration?: number;
  tags: string[];
  correlationId?: string;
}

export interface RequestProgress {
  requestId: string;
  stage: ProcessingStage;
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number;
  currentOperation?: string;
  errorDetails?: any;
}

export enum ProcessingStage {
  VALIDATION = 'validation',
  DATA_COLLECTION = 'data_collection',
  SECURITY_CHECK = 'security_check',
  GENERATION = 'generation',
  ENCRYPTION = 'encryption',
  FINALIZATION = 'finalization'
}

export interface RequestValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedSize: number;
  estimatedDuration: number;
  requiresApproval: boolean;
}

export interface RequestNotification {
  type: NotificationType;
  recipient: string;
  subject: string;
  message: string;
  priority: RequestPriority;
  metadata?: Record<string, any>;
}

export enum NotificationType {
  REQUEST_CREATED = 'request_created',
  PROCESSING_STARTED = 'processing_started',
  PROGRESS_UPDATE = 'progress_update',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface RequestConfiguration {
  maxConcurrentRequests: number;
  defaultPriority: RequestPriority;
  timeoutDuration: number;
  retryIntervals: number[];
  notificationSettings: {
    enableEmailNotifications: boolean;
    enableWebPushNotifications: boolean;
    enableSMSNotifications: boolean;
  };
  validationRules: ValidationRule[];
}

export interface ValidationRule {
  name: string;
  description: string;
  condition: (request: ExportRequest) => boolean;
  errorMessage: string;
  severity: 'error' | 'warning';
}

export interface RequestSearchFilter {
  status?: RequestStatus[];
  priority?: RequestPriority[];
  patientId?: string;
  requestedBy?: string;
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'completedAt';
    from: Date;
    to: Date;
  };
  tags?: string[];
  source?: string;
}

export interface RequestStatistics {
  total: number;
  byStatus: Record<RequestStatus, number>;
  byPriority: Record<RequestPriority, number>;
  averageProcessingTime: number;
  successRate: number;
  failureRate: number;
  retryRate: number;
}